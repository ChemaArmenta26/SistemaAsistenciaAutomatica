import { Asistencia, Inscripcion, Alumno, Usuario, Clase, Maestro, Horario, Aula } from "../models/index.js";
import ScheduleService from "./schedule.service.js";
import UbicacionService from "./ubicacion.service.js";
import { DateTime } from "luxon";
import { Op } from "sequelize";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class AsistenciaService {

  // Método auxiliar para limpiar duplicados y priorizar asistencia
  static _filtrarMejorAsistencia(asistencias) {
    const mapa = new Map();

    // Prioridad de estados: Presente/Retardo/Justificado (1) > Falta (0)
    const esPositivo = (estado) => ['Presente', 'Retardo', 'Justificado', 'Registrada'].includes(estado);

    for (const a of asistencias) {
      // Clave única por alumno y día
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

  static async _rellenarFaltas(idGrupo, fechaInicio, fechaFin) {
    const horarios = await Horario.findAll({ where: { idGrupo } });
    if (!horarios.length) return;

    const diasClase = new Set(horarios.map(h => h.diaSemana));
    const inscripciones = await Inscripcion.findAll({
      where: { idGrupo, activo: true },
      attributes: ['idAlumno']
    });
    const idsAlumnos = [...new Set(inscripciones.map(i => i.idAlumno))];

    let current = fechaInicio;
    const now = DateTime.now().setZone(TIMEZONE);
    const limite = fechaFin < now ? fechaFin : now;
    const faltasAInsertar = [];

    while (current <= limite) {
      const diaSemanaLuxon = current.weekday;
      const diaSemanaModelo = diaSemanaLuxon === 7 ? 0 : diaSemanaLuxon;

      if (diasClase.has(diaSemanaModelo)) {
        let claseYaPaso = true;
        if (current.hasSame(now, 'day')) {
           const horarioHoy = horarios.find(h => h.diaSemana === diaSemanaModelo);
           if (horarioHoy) {
             const [hFin, mFin] = horarioHoy.horaFin.split(":").map(Number);
             const finClase = current.set({ hour: hFin, minute: mFin });
             if (now < finClase) claseYaPaso = false;
           }
        }

        if (claseYaPaso) {
            const inicioDia = current.startOf('day').toJSDate();
            const finDia = current.endOf('day').toJSDate();

            const asistenciasDia = await Asistencia.findAll({
              where: { idGrupo, fechaHora: { [Op.between]: [inicioDia, finDia] } },
              attributes: ['idAlumno']
            });

            const alumnosConAsistencia = new Set(asistenciasDia.map(a => a.idAlumno));

            for (const idAlumno of idsAlumnos) {
              if (!alumnosConAsistencia.has(idAlumno)) {
                faltasAInsertar.push({
                  idAlumno, idGrupo,
                  fechaHora: current.set({ hour: 12 }).toJSDate(),
                  estado: 'Falta', latitud: null, longitud: null, precision: null
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

  static async obtenerListaAsistencia(idGrupo, fechaStr) {
    const fecha = DateTime.fromISO(fechaStr, { zone: TIMEZONE });
    await this._rellenarFaltas(idGrupo, fecha, fecha);

    const inicioDia = fecha.startOf('day').toJSDate();
    const finDia = fecha.endOf('day').toJSDate();

    try {
      const inscripciones = await Inscripcion.findAll({
        where: { idGrupo, activo: true },
        include: [{
          model: Alumno,
          include: [{ model: Usuario, attributes: ['nombre', 'email'] }]
        }]
      });

      const asistenciasRaw = await Asistencia.findAll({
        where: { idGrupo, fechaHora: { [Op.between]: [inicioDia, finDia] } }
      });

      const asistenciasLimpias = this._filtrarMejorAsistencia(asistenciasRaw);

      const asistenciaMap = new Map();
      asistenciasLimpias.forEach(a => asistenciaMap.set(a.idAlumno, a));

      const listaFinal = inscripciones.map(ins => {
        const alumno = ins.Alumno;
        const usuario = alumno.Usuario;
        const asistencia = asistenciaMap.get(alumno.idAlumno);

        return {
          idAlumno: alumno.idAlumno,
          matricula: alumno.matricula,
          email: usuario.email,
          nombre: usuario.nombre,
          estado: asistencia ? asistencia.estado : "Pendiente",
          hora: asistencia ? DateTime.fromJSDate(asistencia.fechaHora).setZone(TIMEZONE).toFormat("HH:mm") : "-",
          metodo: asistencia ? (asistencia.latitud ? "GPS" : "Manual") : "-"
        };
      });

      return listaFinal.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (error) {
      console.error("Error en obtenerListaAsistencia:", error);
      throw error;
    }
  }

  static async registrarAsistencia({ idAlumno, idGrupo, latitud, longitud, precision = null, fechaHora }) {
    const parsedDate = fechaHora ? DateTime.fromISO(fechaHora, { zone: TIMEZONE }) : DateTime.now().setZone(TIMEZONE);
    
    if (!parsedDate.isValid) {
      return { exito: false, mensaje: "Fecha inválida", estadoFinal: "Error", asistencia: null };
    }

    const inicioDia = parsedDate.startOf('day').toJSDate();
    const finDia = parsedDate.endOf('day').toJSDate();

    // 1. Validar Duplicidad
    const asistenciaExistente = await Asistencia.findOne({
      where: { idAlumno: idAlumno, idGrupo: idGrupo, fechaHora: { [Op.between]: [inicioDia, finDia] } }
    });

    if (asistenciaExistente) {
       if (asistenciaExistente.estado === 'Falta') {
       } else {
           return { 
               exito: false, 
               mensaje: "Ya registraste asistencia para esta clase el día de hoy.", // Mensaje explícito
               estadoFinal: "Duplicada", 
               asistencia: asistenciaExistente 
           };
       }
    }

    // 2. Validar Ubicación (Con Fallback de mensaje)
    const validacionUbicacion = await UbicacionService.validarUbicacionAula(idGrupo, latitud, longitud);
    if (!validacionUbicacion.ok) {
      return { 
          exito: false, 
          mensaje: validacionUbicacion.mensaje || "Estás demasiado lejos del aula.", 
          estadoFinal: "Fuera de rango", 
          asistencia: null 
      };
    }

    // 3. Validar Horario (Con Fallback de mensaje)
    const evalHorario = await ScheduleService.isWithinSchedule(idGrupo, parsedDate);
    if (!evalHorario.ok) {
      return { 
          exito: false, 
          mensaje: evalHorario.detail || evalHorario.mensaje || "No es hora de clase.", 
          estadoFinal: "Fuera de horario", 
          asistencia: null 
      };
    }

    // 4. Crear o Actualizar Asistencia
    const estado = evalHorario.estadoSugerido || "Presente";

    if (asistenciaExistente && asistenciaExistente.estado === 'Falta') {
        asistenciaExistente.estado = estado;
        asistenciaExistente.latitud = latitud;
        asistenciaExistente.longitud = longitud;
        asistenciaExistente.precision = precision;
        asistenciaExistente.fechaHora = parsedDate.toJSDate();
        await asistenciaExistente.save();
        return { exito: true, mensaje: `Asistencia recuperada (${estado})`, asistencia: asistenciaExistente, estadoFinal: estado };
    }

    const asistencia = await Asistencia.create({
      fechaHora: parsedDate.toJSDate(),
      estado,
      latitud,
      longitud,
      precision,
      idAlumno,
      idGrupo,
    });

    return { 
        exito: true, 
        mensaje: `Asistencia registrada (${estado})`, 
        asistencia, 
        estadoFinal: estado 
    };
  }

  static async registrarManual({ idAlumno, idGrupo, fechaStr, nuevoEstado }) {
    const fecha = DateTime.fromISO(fechaStr, { zone: TIMEZONE });
    const inicioDia = fecha.startOf('day').toJSDate();
    const finDia = fecha.endOf('day').toJSDate();
    
    // Buscar cualquier registro del día (Falta o Presente)
    let asistencia = await Asistencia.findOne({ 
        where: { idAlumno, idGrupo, fechaHora: { [Op.between]: [inicioDia, finDia] } } 
    });
    
    if (asistencia) { 
        // Si existe (aunque sea falta), actualizar
        asistencia.estado = nuevoEstado; 
        await asistencia.save(); 
    } else { 
        // Si no existe, crear uno nuevo
        asistencia = await Asistencia.create({ 
            idAlumno, 
            idGrupo, 
            fechaHora: fecha.toJSDate(), 
            estado: nuevoEstado 
        }); 
    }
    return { ok: true, asistencia };
  }

  static async getResumenAlumno(idUsuarioInput) {
      const alumno = await Alumno.findOne({ where: { idUsuario: idUsuarioInput } });
      if (!alumno) return [];
      const inscripciones = await Inscripcion.findAll({ where: { idAlumno: alumno.idAlumno, activo: true }, include: [{ model: Clase, include: [{ model: Maestro, include: [{ model: Usuario }] }] }] });
      const FECHA_INICIO = DateTime.fromISO("2025-08-18", { zone: TIMEZONE }); const HOY = DateTime.now().setZone(TIMEZONE);
      
      const resumen = await Promise.all(inscripciones.map(async (ins) => {
        const clase = ins.Clase;
        await this._rellenarFaltas(clase.idGrupo, FECHA_INICIO, HOY);
        const asistenciasRaw = await Asistencia.findAll({ 
            where: { idAlumno: alumno.idAlumno, idGrupo: clase.idGrupo }
        });
        
        // Aplicar filtro de prioridad
        const asistenciasLimp = this._filtrarMejorAsistencia(asistenciasRaw);

        const total = asistenciasLimp.length;
        const posit = asistenciasLimp.filter(a => ['Presente', 'Retardo', 'Justificado', 'Registrada'].includes(a.estado)).length;
        const late = asistenciasLimp.filter(a => a.estado === 'Retardo').length;
        return { id: clase.idGrupo, name: clase.nombreMateria, instructor: clase.Maestro?.Usuario?.nombre, attendance: posit, late: late, totalClasses: total, percentage: total > 0 ? Math.round((posit/total)*100) : 0 };
      }));
      return resumen;
  }
  
  static async getHistorialGrupo(idUsuarioInput, idGrupo, fechaInicioStr, fechaFinStr) {
      const alumno = await Alumno.findOne({ where: { idUsuario: idUsuarioInput } });
      if (!alumno) return [];
      const inicioDefault = DateTime.fromISO("2025-08-18", { zone: TIMEZONE });
      const finDefault = DateTime.now().setZone(TIMEZONE);
      const fechaInicio = fechaInicioStr ? DateTime.fromISO(fechaInicioStr, { zone: TIMEZONE }) : inicioDefault;
      const fechaFin = fechaFinStr ? DateTime.fromISO(fechaFinStr, { zone: TIMEZONE }).endOf('day') : finDefault;

      await this._rellenarFaltas(idGrupo, fechaInicio, fechaFin);

      const historialRaw = await Asistencia.findAll({
        where: { idAlumno: alumno.idAlumno, idGrupo, fechaHora: { [Op.between]: [fechaInicio.toJSDate(), fechaFin.toJSDate()] } },
        order: [['fechaHora', 'DESC']]
      });

      // Aplicar filtro de prioridad
      const historialLimp = this._filtrarMejorAsistencia(historialRaw);
      // Re-ordenar por fecha DESC después de filtrar
      historialLimp.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));

      return historialLimp.map(a => ({
        id: a.idAsistencia,
        date: DateTime.fromJSDate(a.fechaHora).setZone(TIMEZONE).toFormat("yyyy-MM-dd"),
        time: DateTime.fromJSDate(a.fechaHora).setZone(TIMEZONE).toFormat("hh:mm a"),
        status: a.estado
      }));
  }

  static async getReporteRango(idGrupo, fechaInicioStr, fechaFinStr) {
    const fechaInicio = DateTime.fromISO(fechaInicioStr, { zone: TIMEZONE });
    const fechaFin = DateTime.fromISO(fechaFinStr, { zone: TIMEZONE }).endOf('day');

    try {
      await this._rellenarFaltas(idGrupo, fechaInicio, fechaFin);

      const fechaInicioJS = fechaInicio.startOf('day').toJSDate();
      const fechaFinJS = fechaFin.toJSDate();

      const inscripciones = await Inscripcion.findAll({
        where: { idGrupo, activo: true },
        include: [{ model: Alumno, include: [{ model: Usuario, attributes: ['nombre', 'email'] }] }]
      });

      const asistenciasRaw = await Asistencia.findAll({
        where: { idGrupo, fechaHora: { [Op.between]: [fechaInicioJS, fechaFinJS] } }
      });

      // Aplicar filtro de prioridad
      const asistenciasFiltradas = this._filtrarMejorAsistencia(asistenciasRaw);

      const sesionesUnicas = new Set(asistenciasFiltradas.map(a => a.fechaHora.toISOString().split('T')[0])).size;
      const totalSesiones = sesionesUnicas === 0 ? 1 : sesionesUnicas;

      const reporte = inscripciones.map(ins => {
        const alumno = ins.Alumno;
        const usuario = alumno.Usuario;
        const asistenciasAlumno = asistenciasFiltradas.filter(a => a.idAlumno === alumno.idAlumno);

        const presentes = asistenciasAlumno.filter(a => ['Presente', 'Registrada'].includes(a.estado)).length;
        const retardos = asistenciasAlumno.filter(a => a.estado === 'Retardo').length;
        const justificados = asistenciasAlumno.filter(a => a.estado === 'Justificado').length;
        const faltas = asistenciasAlumno.filter(a => a.estado === 'Falta').length;
        
        const totalRegistros = asistenciasAlumno.length; 
        const base = totalRegistros > 0 ? totalRegistros : 1; 
        const efectivos = presentes + retardos + justificados; 
        const porcentaje = Math.round((efectivos / base) * 100);

        return {
          matricula: alumno.matricula,
          nombre: usuario.nombre,
          presentes, retardos, faltas, justificados, porcentaje
        };
      });

      return {
        totalSesiones,
        alumnos: reporte.sort((a, b) => a.nombre.localeCompare(b.nombre))
      };

    } catch (error) {
      console.error("Error en reporte rango:", error);
      throw error;
    }
  }
}

export default AsistenciaService;