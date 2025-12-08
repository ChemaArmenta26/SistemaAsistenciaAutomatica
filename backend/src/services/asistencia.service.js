import {
  Asistencia,
  Inscripcion,
  Alumno,
  Usuario,
  Clase,
  Maestro,
  Horario
} from "../models/index.js";

import ScheduleService from "./schedule.service.js";
import UbicacionService from "./ubicacion.service.js";
import { DateTime } from "luxon";
import { Op } from "sequelize";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class AsistenciaService {

  /** -----------------------------------------------------
   *  🔹 Selecciona la mejor asistencia por día/estudiante
   * ----------------------------------------------------- */
  static _filtrarMejorAsistencia(asistencias) {
    const mapa = new Map();

    const esPositivo = (estado) =>
      ['Presente', 'Retardo', 'Justificado', 'Registrada'].includes(estado);

    for (const a of asistencias) {
      const fechaKey = a.fechaHora.toISOString().split('T')[0];
      const key = `${a.idAlumno}-${fechaKey}`;
      const existente = mapa.get(key);

      if (!existente) {
        mapa.set(key, a);
        continue;
      }

      const nuevoEsPositivo = esPositivo(a.estado);
      const viejoEsPositivo = esPositivo(existente.estado);

      if (nuevoEsPositivo && !viejoEsPositivo) {
        mapa.set(key, a);
      } else if (nuevoEsPositivo === viejoEsPositivo) {
        if (new Date(a.updatedAt) > new Date(existente.updatedAt)) {
          mapa.set(key, a);
        }
      }
    }
    return Array.from(mapa.values());
  }

  /** -----------------------------------------------------
   *  🔹 Autogenera faltas si el estudiante no registró nada
   * ----------------------------------------------------- */
  static async _rellenarFaltas(idGrupo, fechaInicio, fechaFin) {
    const horarios = await Horario.findAll({ where: { idGrupo } });
    if (!horarios.length) return;

    const diasClase = new Set(horarios.map(h => h.diaSemana));
    const inscripciones = await Inscripcion.findAll({
      where: { idGrupo, activo: true },
      attributes: ["idAlumno"]
    });

    const idsAlumnos = [...new Set(inscripciones.map(i => i.idAlumno))];

    let current = fechaInicio;
    const now = DateTime.now().setZone(TIMEZONE);
    const limite = fechaFin < now ? fechaFin : now;
    const faltasAInsertar = [];

    while (current <= limite) {
      const dia = current.weekday === 7 ? 0 : current.weekday;

      if (diasClase.has(dia)) {
        let claseYaPaso = true;
        if (current.hasSame(now, "day")) {
          const horarioHoy = horarios.find(h => h.diaSemana === dia);
          if (horarioHoy) {
            const [hFin, mFin] = horarioHoy.horaFin.split(":").map(Number);
            const finClase = current.set({ hour: hFin, minute: mFin });
            if (now < finClase) claseYaPaso = false;
          }
        }

        if (claseYaPaso) {
          const inicioDia = current.startOf("day").toJSDate();
          const finDia = current.endOf("day").toJSDate();

          const asistenciasDia = await Asistencia.findAll({
            where: { idGrupo, fechaHora: { [Op.between]: [inicioDia, finDia] } },
            attributes: ["idAlumno"]
          });

          const alumnosConAsistencia = new Set(asistenciasDia.map(a => a.idAlumno));

          for (const idAlumno of idsAlumnos) {
            if (!alumnosConAsistencia.has(idAlumno)) {
              faltasAInsertar.push({
                idAlumno,
                idGrupo,
                fechaHora: current.set({ hour: 12 }).toJSDate(),
                estado: "Falta",
                latitud: null,
                longitud: null,
                precision: null
              });
            }
          }
        }
      }

      current = current.plus({ days: 1 });
    }

    if (faltasAInsertar.length > 0) {
      await Asistencia.bulkCreate(faltasAInsertar).catch(() => {});
    }
  }

  /** -----------------------------------------------------
   *  🔹 Registro de asistencia normal (GPS / validación horario)
   * ----------------------------------------------------- */
  static async registrarAsistencia({ idAlumno, idGrupo, latitud, longitud, precision = null, fechaHora }) {

    const parsed = fechaHora
      ? DateTime.fromISO(fechaHora, { zone: TIMEZONE })
      : DateTime.now().setZone(TIMEZONE);

    if (!parsed.isValid) {
      return { ok:false, exito:false, mensaje:"Fecha inválida", estadoFinal:"Error" };
    }

    const inicio = parsed.startOf("day").toJSDate();
    const fin = parsed.endOf("day").toJSDate();

    const asistenciaExistente = await Asistencia.findOne({
      where: { idAlumno, idGrupo, fechaHora:{ [Op.between]:[inicio, fin] } }
    });

    if (asistenciaExistente && asistenciaExistente.estado !== "Falta") {
      return {
        ok:false,
        exito:false,
        mensaje:"Ya registraste asistencia para esta clase el día de hoy.",
        estadoFinal:"Duplicada",
        asistencia: asistenciaExistente
      };
    }

    // ✔ Primero horario
    const evalHorario = await ScheduleService.isWithinSchedule(idGrupo, parsed);

    if (!evalHorario.ok) {
      return {
        ok:false,
        exito:false,
        mensaje: evalHorario.detail, // <-- ESTA ES LA CORRECCIÓN IMPORTANTE
        estadoFinal:"Fuera de horario",
        asistencia:null
      };
    }

    // ✔ Segundo ubicación
    const validUbic = await UbicacionService.validarUbicacionAula(idGrupo, latitud, longitud);

    if (!validUbic.ok) {
      return {
        ok:false,
        exito:false,
        mensaje: validUbic.mensaje || "Estás fuera del rango del aula",
        estadoFinal:"Fuera de rango",
        asistencia:null
      };
    }

    const estado = evalHorario.estadoSugerido || "Presente";

    // ✔ Recupero falta si existía
    if (asistenciaExistente && asistenciaExistente.estado === "Falta") {
      asistenciaExistente.estado = estado;
      asistenciaExistente.latitud = latitud;
      asistenciaExistente.longitud = longitud;
      asistenciaExistente.precision = precision;
      asistenciaExistente.fechaHora = parsed.toJSDate();
      await asistenciaExistente.save();

      return { ok:true, exito:true, mensaje:`Asistencia recuperada (${estado})`, asistencia: asistenciaExistente, estadoFinal: estado };
    }

    const asistencia = await Asistencia.create({
      fechaHora: parsed.toJSDate(),
      estado,
      latitud,
      longitud,
      precision,
      idAlumno,
      idGrupo
    });

    return { ok:true, exito:true, mensaje:`Asistencia registrada (${estado})`, asistencia, estadoFinal: estado };
  }

  /** -----------------------------------------------------
   *  🔹 Registro manual desde panel docente
   * ----------------------------------------------------- */
  static async registrarManual({ idAlumno, idGrupo, fechaStr, nuevoEstado }) {
    const fecha = DateTime.fromISO(fechaStr, { zone: TIMEZONE });
    const inicioDia = fecha.startOf("day").toJSDate();
    const finDia = fecha.endOf("day").toJSDate();

    let asistencia = await Asistencia.findOne({
      where: { idAlumno, idGrupo, fechaHora:{ [Op.between]:[inicioDia, finDia] } }
    });

    if (asistencia) {
      asistencia.estado = nuevoEstado;
      await asistencia.save();
    } else {
      asistencia = await Asistencia.create({
        idAlumno,
        idGrupo,
        fechaHora: fecha.toJSDate(),
        estado: nuevoEstado
      });
    }

    return { ok:true, asistencia };
  }

  /** -----------------------------------------------------
   *  🔹 Reporte por día (panel maestro)
   * ----------------------------------------------------- */
  static async obtenerListaAsistencia(idGrupo, fechaStr) {
    const fecha = DateTime.fromISO(fechaStr, { zone: TIMEZONE });

    await this._rellenarFaltas(idGrupo, fecha, fecha);

    const inicioDia = fecha.startOf("day").toJSDate();
    const finDia = fecha.endOf("day").toJSDate();

    const inscripciones = await Inscripcion.findAll({
      where: { idGrupo, activo: true },
      include: [{
        model: Alumno,
        include: [{ model: Usuario, attributes:["nombre","email"] }]
      }]
    });

    const asistenciasRaw = await Asistencia.findAll({
      where: {
        idGrupo,
        fechaHora:{ [Op.between]:[inicioDia, finDia] }
      }
    });

    const asistenciasLimpias = this._filtrarMejorAsistencia(asistenciasRaw);
    const map = new Map(asistenciasLimpias.map(a => [a.idAlumno, a]));

    const lista = inscripciones.map(ins => {
      const alumno = ins.Alumno;
      const usuario = alumno.Usuario;
      const asistencia = map.get(alumno.idAlumno);

      return {
        idAlumno: alumno.idAlumno,
        matricula: alumno.matricula,
        nombre: usuario.nombre,
        email: usuario.email,
        estado: asistencia ? asistencia.estado : "Pendiente",
        hora: asistencia ? DateTime.fromJSDate(asistencia.fechaHora).toFormat("HH:mm") : "-",
        metodo: asistencia ? (asistencia.latitud ? "GPS" : "Manual") : "-"
      };
    });

    return lista.sort((a,b)=> a.nombre.localeCompare(b.nombre));
  }

  /** -----------------------------------------------------
   *  🔹 Perfil alumno (dashboard estudiante)
   * ----------------------------------------------------- */
  static async getResumenAlumno(idUsuarioInput) {
    const alumno = await Alumno.findOne({ where:{ idUsuario:idUsuarioInput } });
    if (!alumno) return [];

    const inscripciones = await Inscripcion.findAll({
      where: { idAlumno: alumno.idAlumno, activo:true },
      include:[{ model: Clase, include:[{ model: Maestro, include:[{ model:Usuario }] }] }]
    });

    const inicio = DateTime.fromISO("2025-01-01", { zone: TIMEZONE });
    const hoy = DateTime.now().setZone(TIMEZONE);

    const resumen = await Promise.all(
      inscripciones.map(async ins => {
        const clase = ins.Clase;
        await this._rellenarFaltas(clase.idGrupo, inicio, hoy);

        const asistenciasRaw = await Asistencia.findAll({
          where:{ idAlumno: alumno.idAlumno, idGrupo: clase.idGrupo }
        });

        const asistenciasFiltradas = this._filtrarMejorAsistencia(asistenciasRaw);

        const total = asistenciasFiltradas.length;
        const efectivas = asistenciasFiltradas.filter(a =>
          ['Presente','Retardo','Justificado','Registrada'].includes(a.estado)).length;

        return {
          id: clase.idGrupo,
          name: clase.nombreMateria,
          instructor: clase.Maestro?.Usuario?.nombre,
          attendance: efectivas,
          totalClasses: total,
          percentage: total > 0 ? Math.round((efectivas/total)*100) : 0
        };
      })
    );
    
    return resumen;
  }

  /** -----------------------------------------------------
   *  🔹 Historial detalle por clase
   * ----------------------------------------------------- */
  static async getHistorialGrupo(idUsuarioInput, idGrupo, inicioStr, finStr) {
    const alumno = await Alumno.findOne({ where:{ idUsuario:idUsuarioInput } });

    if (!alumno) return [];

    const inicio = inicioStr
      ? DateTime.fromISO(inicioStr, { zone: TIMEZONE })
      : DateTime.fromISO("2025-01-01", { zone: TIMEZONE });

    const fin = finStr
      ? DateTime.fromISO(finStr, { zone: TIMEZONE }).endOf("day")
      : DateTime.now().setZone(TIMEZONE);

    await this._rellenarFaltas(idGrupo, inicio, fin);

    const historialRaw = await Asistencia.findAll({
      where:{
        idAlumno: alumno.idAlumno,
        idGrupo,
        fechaHora:{ [Op.between]:[inicio.toJSDate(), fin.toJSDate()] }
      },
      order:[["fechaHora","DESC"]]
    });

    const historico = this._filtrarMejorAsistencia(historialRaw);

    return historico.map(a => ({
      id: a.idAsistencia,
      date: DateTime.fromJSDate(a.fechaHora).toFormat("yyyy-MM-dd"),
      time: DateTime.fromJSDate(a.fechaHora).toFormat("hh:mm a"),
      status: a.estado
    }));
  }

  /** -----------------------------------------------------
   *  🔹 Reporte general por rango de fechas
   * ----------------------------------------------------- */
  static async getReporteRango(idGrupo, inicioStr, finStr) {
    const inicio = DateTime.fromISO(inicioStr, { zone: TIMEZONE });
    const fin = DateTime.fromISO(finStr, { zone: TIMEZONE }).endOf("day");

    await this._rellenarFaltas(idGrupo, inicio, fin);

    const inicioJS = inicio.startOf("day").toJSDate();
    const finJS = fin.toJSDate();

    const inscripciones = await Inscripcion.findAll({
      where:{ idGrupo, activo:true },
      include:[{ model: Alumno, include:[{ model:Usuario, attributes:["nombre", "email"] }] }]
    });

    const asistenciasRaw = await Asistencia.findAll({
      where:{
        idGrupo,
        fechaHora:{ [Op.between]:[inicioJS, finJS] }
      }
    });

    const asistenciasFiltradas = this._filtrarMejorAsistencia(asistenciasRaw);

    const sesionesUnicas = new Set(
      asistenciasFiltradas.map(a => a.fechaHora.toISOString().split("T")[0])
    ).size || 1;

    const reporte = inscripciones.map(ins => {
      const alumno = ins.Alumno;
      const usuario = alumno.Usuario;
      const asistAlumno = asistenciasFiltradas.filter(a => a.idAlumno === alumno.idAlumno);

      const presentes = asistAlumno.filter(a => ['Presente','Registrada'].includes(a.estado)).length;
      const retardos = asistAlumno.filter(a => a.estado === "Retardo").length;
      const justificados = asistAlumno.filter(a => a.estado === "Justificado").length;
      const faltas = asistAlumno.filter(a => a.estado === "Falta").length;

      const efectivos = presentes + retardos + justificados;

      return {
        matricula: alumno.matricula,
        nombre: usuario.nombre,
        presentes,
        retardos,
        faltas,
        justificados,
        porcentaje: sesionesUnicas > 0 ? Math.round((efectivos/sesionesUnicas)*100) : 0
      };
    });

    return {
      totalSesiones: sesionesUnicas,
      alumnos: reporte.sort((a,b)=> a.nombre.localeCompare(b.nombre))
    };
  }
}

export default AsistenciaService;
