import Asistencia from "../models/Asistencia.js";
import ScheduleService from "./schedule.service.js";
import UbicacionService from "./ubicacion.service.js";
import { DateTime } from "luxon";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class AsistenciaService {
  
  static async registrarAsistencia({ idAlumno, idGrupo, latitud, longitud, precision = null, fechaHora = null }) {
    
    // Parsear fecha
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

    // Validar Horario
    const evalHorario = await ScheduleService.isWithinSchedule(idGrupo, parsedDate);
    
    if (!evalHorario.ok) {
      return {
        exito: false,
        mensaje: "No es hora de clase o ya terminó el periodo de asistencia.",
        estadoFinal: "Fuera de horario",
        asistencia: null
      };
    }

    const estado = evalHorario.ok ? "Registrada" : "Fuera de horario";

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
      mensaje: "Asistencia registrada correctamente",              
      asistencia,               
      estadoFinal: estado       
    };
  }
}

export default AsistenciaService;