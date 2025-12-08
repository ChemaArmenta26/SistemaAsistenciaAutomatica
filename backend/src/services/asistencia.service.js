import { Asistencia, Inscripcion, Alumno, Usuario, Clase, Maestro, Horario, Aula } from "../models/index.js";
import ScheduleService from "./schedule.service.js";
import UbicacionService from "./ubicacion.service.js";
import { DateTime } from "luxon";
import { Op } from "sequelize";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class AsistenciaService {

  // --- LÓGICA CORE: Rellenar huecos de faltas ---
  static async _rellenarFaltas(idGrupo, fechaInicio, fechaFin) {
    const horarios = await Horario.findAll({ where: { idGrupo } });
    if (!horarios.length) return;

    const diasClase = new Set(horarios.map(h => h.diaSemana));

    const inscripciones = await Inscripcion.findAll({
      where: { idGrupo, activo: true },
      attributes: ['idAlumno']
    });
    const idsAlumnos = inscripciones.map(i => i.idAlumno);

    let current = fechaInicio;
    const now = DateTime.now().setZone(TIMEZONE);
    
    // Validamos hasta el momento actual
    const limite = fechaFin < now ? fechaFin : now;
    const faltasAInsertar = [];

    while (current <= limite) {
      const diaSemanaLuxon = current.weekday;
      const diaSemanaModelo = diaSemanaLuxon === 7 ? 0 : diaSemanaLuxon;

      if (diasClase.has(diaSemanaModelo)) {
        let claseYaPaso = true;
        
        // Si es hoy, verificamos si ya pasó la hora de salida
        if (current.hasSame(now, 'day')) {
           const horarioHoy = horarios.find(h => h.diaSemana === diaSemanaModelo);
           if (horarioHoy) {
             const [hFin, mFin] = horarioHoy.horaFin.split(":").map(Number);
             const finClase = current.set({ hour: hFin, minute: mFin });
             
             // Si AHORA es menor que FIN DE CLASE, todavía no es falta.
             if (now < finClase) claseYaPaso = false;
           }
        }

        if (claseYaPaso) {
            const inicioDia = current.startOf('day').toJSDate();
            const finDia = current.endOf('day').toJSDate();

            const asistenciasDia = await Asistencia.findAll({
              where: {
                idGrupo,
                fechaHora: { [Op.between]: [inicioDia, finDia] }
              },
              attributes: ['idAlumno']
            });

            const alumnosConAsistencia = new Set(asistenciasDia.map(a => a.idAlumno));

            for (const idAlumno of idsAlumnos) {
              if (!alumnosConAsistencia.has(idAlumno)) {
                faltasAInsertar.push({
                  idAlumno,
                  idGrupo,
                  fechaHora: current.set({ hour: 12 }).toJSDate(),
                  estado: 'Falta',
                  latitud: null, longitud: null, precision: null
                });
              }
            }
        }
      }
      current = current.plus({ days: 1 });
    }

    if (faltasAInsertar.length > 0) {
      await Asistencia.bulkCreate(faltasAInsertar);
    }
  }

  // --- 1. LISTA DEL MAESTRO (Aquí se refleja la asistencia diaria) ---
  static async obtenerListaAsistencia(idGrupo, fechaStr) {
    const fecha = DateTime.fromISO(fechaStr, { zone: TIMEZONE });
    
    // Si la clase ya acabó hace 1 min, esto genera las faltas automáticamente.
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

      const asistenciasRegistradas = await Asistencia.findAll({
        where: {
          idGrupo,
          fechaHora: { [Op.between]: [inicioDia, finDia] }
        }
      });

      const asistenciaMap = new Map();
      asistenciasRegistradas.forEach(a => asistenciaMap.set(a.idAlumno, a));

      const listaFinal = inscripciones.map(ins => {
        const alumno = ins.Alumno;
        const usuario = alumno.Usuario;
        const asistencia = asistenciaMap.get(alumno.idAlumno);

        return {
          idAlumno: alumno.idAlumno,
          matricula: alumno.matricula,
          email: usuario.email,
          nombre: usuario.nombre,
          // Si existe asistencia (incluso 'Falta' generada), se muestra. Si no, Pendiente.
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

  // --- 2. HISTORIAL DEL ALUMNO ---
  static async getHistorialGrupo(idUsuarioInput, idGrupo, fechaInicioStr, fechaFinStr) {
    try {
      const alumno = await Alumno.findOne({ where: { idUsuario: idUsuarioInput } });
      if (!alumno) return [];

      const inicioDefault = DateTime.fromISO("2025-01-01", { zone: TIMEZONE });
      const finDefault = DateTime.now().setZone(TIMEZONE);

      const fechaInicio = fechaInicioStr ? DateTime.fromISO(fechaInicioStr, { zone: TIMEZONE }) : inicioDefault;
      const fechaFin = fechaFinStr ? DateTime.fromISO(fechaFinStr, { zone: TIMEZONE }).endOf('day') : finDefault;

      // IMPORTANTE: Sincronizar faltas en el rango solicitado
      await this._rellenarFaltas(idGrupo, fechaInicio, fechaFin);

      const historial = await Asistencia.findAll({
        where: { 
            idAlumno: alumno.idAlumno, 
            idGrupo,
            fechaHora: { [Op.between]: [fechaInicio.toJSDate(), fechaFin.toJSDate()] }
        },
        order: [['fechaHora', 'DESC']]
      });

      return historial.map(a => ({
        id: a.idAsistencia,
        date: DateTime.fromJSDate(a.fechaHora).setZone(TIMEZONE).toFormat("yyyy-MM-dd"),
        time: DateTime.fromJSDate(a.fechaHora).setZone(TIMEZONE).toFormat("hh:mm a"),
        status: a.estado
      }));

    } catch (error) {
      console.error("Error historial grupo:", error);
      throw error;
    }
  }

  // --- 3. REPORTE EN PDF ---
  static async getReporteRango(idGrupo, fechaInicioStr, fechaFinStr) {
    const fechaInicio = DateTime.fromISO(fechaInicioStr, { zone: TIMEZONE });
    const fechaFin = DateTime.fromISO(fechaFinStr, { zone: TIMEZONE }).endOf('day');

    try {
      // IMPORTANTE: Sincronizar faltas antes de generar reporte
      await this._rellenarFaltas(idGrupo, fechaInicio, fechaFin);

      const fechaInicioJS = fechaInicio.startOf('day').toJSDate();
      const fechaFinJS = fechaFin.toJSDate();

      const inscripciones = await Inscripcion.findAll({
        where: { idGrupo, activo: true },
        include: [{
          model: Alumno,
          include: [{ model: Usuario, attributes: ['nombre', 'email'] }]
        }]
      });

      const asistencias = await Asistencia.findAll({
        where: {
          idGrupo,
          fechaHora: { [Op.between]: [fechaInicioJS, fechaFinJS] }
        },
        order: [['fechaHora', 'ASC']]
      });

      const sesionesUnicas = new Set(asistencias.map(a => a.fechaHora.toISOString().split('T')[0])).size;
      const totalSesiones = sesionesUnicas === 0 ? 1 : sesionesUnicas;

      const reporte = inscripciones.map(ins => {
        const alumno = ins.Alumno;
        const usuario = alumno.Usuario;
        const asistenciasAlumno = asistencias.filter(a => a.idAlumno === alumno.idAlumno);

        const presentes = asistenciasAlumno.filter(a => ['Presente', 'Registrada'].includes(a.estado)).length;
        const retardos = asistenciasAlumno.filter(a => a.estado === 'Retardo').length;
        const justificados = asistenciasAlumno.filter(a => a.estado === 'Justificado').length;
        const faltas = asistenciasAlumno.filter(a => a.estado === 'Falta').length;
        
        const totalRegistrosAlumno = asistenciasAlumno.length; 
        const baseCalculo = totalRegistrosAlumno > 0 ? totalRegistrosAlumno : 1; 

        const asistenciaEfectiva = presentes + retardos + justificados; 
        const porcentaje = Math.round((asistenciaEfectiva / baseCalculo) * 100);

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

  // Solo asegúrate de que registrarAsistencia siga validando ubicación/horario.
  static async registrarAsistencia({ idAlumno, idGrupo, latitud, longitud, precision = null, fechaHora }) {
      const parsedDate = fechaHora ? DateTime.fromISO(fechaHora, { zone: TIMEZONE }) : DateTime.now().setZone(TIMEZONE);
      if (!parsedDate.isValid) return { exito: false, mensaje: "Fecha inválida", estadoFinal: "Error", asistencia: null };

      const inicioDia = parsedDate.startOf('day').toJSDate();
      const finDia = parsedDate.endOf('day').toJSDate();

      const asistenciaExistente = await Asistencia.findOne({
        where: { idAlumno: idAlumno, idGrupo: idGrupo, fechaHora: { [Op.between]: [inicioDia, finDia] } }
      });

      if (asistenciaExistente) return { exito: false, mensaje: "Ya registraste asistencia hoy.", estadoFinal: "Duplicada", asistencia: asistenciaExistente };

      const validacionUbicacion = await UbicacionService.validarUbicacionAula(idGrupo, latitud, longitud);
      if (!validacionUbicacion.ok) return { exito: false, mensaje: validacionUbicacion.mensaje, estadoFinal: "Fuera de rango", asistencia: null };

      const evalHorario = await ScheduleService.isWithinSchedule(idGrupo, parsedDate);
      if (!evalHorario.ok) return { exito: false, mensaje: "Fuera de horario.", estadoFinal: "Fuera de horario", asistencia: null };

      const estado = evalHorario.estadoSugerido;
      const asistencia = await Asistencia.create({ fechaHora: parsedDate.toJSDate(), estado, latitud, longitud, precision, idAlumno, idGrupo });

      return { exito: true, mensaje: `Asistencia registrada (${estado})`, asistencia, estadoFinal: estado };
  }

  static async registrarManual({ idAlumno, idGrupo, fechaStr, nuevoEstado }) {
    const fecha = DateTime.fromISO(fechaStr, { zone: TIMEZONE });
    const inicioDia = fecha.startOf('day').toJSDate();
    const finDia = fecha.endOf('day').toJSDate();
    let asistencia = await Asistencia.findOne({ where: { idAlumno, idGrupo, fechaHora: { [Op.between]: [inicioDia, finDia] } } });
    
    if (asistencia) { asistencia.estado = nuevoEstado; await asistencia.save(); } 
    else { asistencia = await Asistencia.create({ idAlumno, idGrupo, fechaHora: fecha.toJSDate(), estado: nuevoEstado }); }
    return { ok: true, asistencia };
  }

  static async getResumenAlumno(idUsuarioInput) {
      const alumno = await Alumno.findOne({ where: { idUsuario: idUsuarioInput } });
      if (!alumno) return [];
      const inscripciones = await Inscripcion.findAll({ where: { idAlumno: alumno.idAlumno, activo: true }, include: [{ model: Clase, include: [{ model: Maestro, include: [{ model: Usuario }] }] }] });
      const FECHA_INICIO = DateTime.fromISO("2025-01-01", { zone: TIMEZONE }); const HOY = DateTime.now().setZone(TIMEZONE);
      
      const resumen = await Promise.all(inscripciones.map(async (ins) => {
        const clase = ins.Clase;
        await this._rellenarFaltas(clase.idGrupo, FECHA_INICIO, HOY);
        const asistencias = await Asistencia.findAll({ where: { idAlumno: alumno.idAlumno, idGrupo: clase.idGrupo } });
        const total = asistencias.length;
        const posit = asistencias.filter(a => ['Presente', 'Retardo', 'Justificado', 'Registrada'].includes(a.estado)).length;
        const late = asistencias.filter(a => a.estado === 'Retardo').length;
        return { id: clase.idGrupo, name: clase.nombreMateria, instructor: clase.Maestro?.Usuario?.nombre, attendance: posit, late: late, totalClasses: total, percentage: total > 0 ? Math.round((posit/total)*100) : 0 };
      }));
      return resumen;
  }
}

export default AsistenciaService;