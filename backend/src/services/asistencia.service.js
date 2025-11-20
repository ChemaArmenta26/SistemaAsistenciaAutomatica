import Asistencia from "../models/Asistencia.js";
import ScheduleService from "./schedule.service.js";
import UbicacionService from "./ubicacion.service.js";
import { DateTime } from "luxon";
import { Op } from "sequelize";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class AsistenciaService {
  
  static async registrarAsistencia({ idAlumno, idGrupo, latitud, longitud, precision = null, fechaHora = null }) {
    
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
    const estado = evalHorario.estadoSugerido || "Registrada";

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
}

export default AsistenciaService;