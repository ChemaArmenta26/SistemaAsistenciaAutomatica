import { Asistencia, Inscripcion, Alumno, Usuario, Clase, Maestro }  from "../models/index.js";
import ScheduleService from "./schedule.service.js";
import UbicacionService from "./ubicacion.service.js";
import { DateTime } from "luxon";
import { Op } from "sequelize";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class AsistenciaService {

  static async registrarAsistencia({ idAlumno, idGrupo, latitud, longitud, precision = null, fechaHora}) {

    // Parsear fecha y zona horaria
    const parsedDate = fechaHora
      ? DateTime.fromISO(fechaHora, { zone: TIMEZONE })
      : DateTime.now().setZone(TIMEZONE);

    if (!parsedDate.isValid) {
      return {
        exito: false,
        mensaje: "Fecha inválida",
        estadoFinal: "Error",
        asistencia: null
      };
    }

    // Obtener el inicio (00:00:00) y fin (23:59:59) del día actual en la zona horaria correcta
    const inicioDia = parsedDate.startOf('day').toJSDate();
    const finDia = parsedDate.endOf('day').toJSDate();

    const asistenciaExistente = await Asistencia.findOne({
      where: {
        idAlumno: idAlumno,
        idGrupo: idGrupo,
        fechaHora: {
          [Op.between]: [inicioDia, finDia] // Busca entre inicio y fin del día
        }
      }
    });

    if (asistenciaExistente) {
      return {
        exito: false,
        mensaje: "Ya registraste asistencia para esta clase el día de hoy.",
        estadoFinal: "Duplicada",
        asistencia: asistenciaExistente
      };
    }

    // Validar Ubicación
    const validacionUbicacion = await UbicacionService.validarUbicacionAula(idGrupo, latitud, longitud);

    if (!validacionUbicacion.ok) {
      return {
        exito: false,
        mensaje: validacionUbicacion.mensaje,
        estadoFinal: "Fuera de rango",
        asistencia: null
      };
    }

    // Validar horario 
    const evalHorario = await ScheduleService.isWithinSchedule(idGrupo, parsedDate);

    if (!evalHorario.ok) {
      return {
        exito: false,
        mensaje: "No es hora de clase o ya terminó el periodo de asistencia.",
        estadoFinal: "Fuera de horario",
        asistencia: null
      };
    }

    // Determinar estado (Registrada o Retardo)
    const estado = evalHorario.estadoSugerido;

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
      mensaje: `Asistencia registrada correctamente (${estado})`,
      asistencia,
      estadoFinal: estado
    };
  }

  static async obtenerListaAsistencia(idGrupo, fechaStr) {
    const fecha = DateTime.fromISO(fechaStr, { zone: TIMEZONE });

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

  static async registrarManual({ idAlumno, idGrupo, fechaStr, nuevoEstado }) {
    const fecha = DateTime.fromISO(fechaStr, { zone: TIMEZONE });
    const inicioDia = fecha.startOf('day').toJSDate();
    const finDia = fecha.endOf('day').toJSDate();

    try {
      let asistencia = await Asistencia.findOne({
        where: {
          idAlumno,
          idGrupo,
          fechaHora: { [Op.between]: [inicioDia, finDia] }
        }
      });

      if (asistencia) {
        asistencia.estado = nuevoEstado;
        asistencia.latitud = null; 
        asistencia.longitud = null;
        asistencia.precision = null;
        await asistencia.save();
      } else {
        asistencia = await Asistencia.create({
          idAlumno,
          idGrupo,
          fechaHora: fecha.toJSDate(),
          estado: nuevoEstado,
          latitud: null, 
          longitud: null,
          precision: null
        });
      }

      return { ok: true, asistencia };
    } catch (error) {
      console.error("Error en registrarManual:", error);
      throw error;
    }
  }

  static async getResumenAlumno(idUsuarioInput) {
    try {
      const alumno = await Alumno.findOne({ where: { idUsuario: idUsuarioInput } });
      if (!alumno) return [];

      const inscripciones = await Inscripcion.findAll({
        where: { idAlumno: alumno.idAlumno, activo: true },
        include: [{
            model: Clase,
            include: [{ 
                model: Maestro, 
                include: [{ model: Usuario, attributes: ['nombre'] }] 
            }]
        }]
      });

      const resumen = await Promise.all(inscripciones.map(async (ins) => {
        const clase = ins.Clase;
        
        const asistencias = await Asistencia.findAll({
            where: { idAlumno: alumno.idAlumno, idGrupo: clase.idGrupo }
        });

        const totalRegistros = asistencias.length;
        
        const totalPositivas = asistencias.filter(a => 
            ['Presente', 'Retardo', 'Justificado', 'Registrada'].includes(a.estado)
        ).length;

        const totalRetardos = asistencias.filter(a => a.estado === 'Retardo').length;
        
        let porcentaje = 0;
        
        if (totalRegistros > 0) {
            porcentaje = Math.round((totalPositivas / totalRegistros) * 100);
        }

        return {
            id: clase.idGrupo,
            name: clase.nombreMateria,
            instructor: clase.Maestro?.Usuario?.nombre || "Sin Asignar",
            attendance: totalPositivas, 
            late: totalRetardos,        
            totalClasses: totalRegistros, 
            percentage: porcentaje     
        };
      }));

      return resumen;
    } catch (error) {
      console.error("Error resumen alumno:", error);
      throw error;
    }
  }

  static async getHistorialGrupo(idUsuarioInput, idGrupo) {
    try {
      const alumno = await Alumno.findOne({ where: { idUsuario: idUsuarioInput } });
      if (!alumno) return [];

      const historial = await Asistencia.findAll({
        where: { idAlumno: alumno.idAlumno, idGrupo },
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

}

export default AsistenciaService;