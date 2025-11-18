import Asistencia from "../models/Asistencia.js";
import ScheduleService from "./schedule.service.js";
import { DateTime } from "luxon";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class AsistenciaService {
  /**
   * Registra una asistencia. Latitud y longitud son opcionales hasta que el toro se la rife.
   * Retorna el objeto asistencia creado y el resultado de la validación de horario.
   */
  static async registrarAsistencia({ idAlumno, idGrupo, latitud = null, longitud = null, precision = null, fechaHora = null }) {
  
  // 1. Parsear la fecha correctamente SOLO UNA VEZ
  const parsedDate = fechaHora
    ? DateTime.fromISO(fechaHora, { zone: TIMEZONE })
    : DateTime.now().setZone(TIMEZONE);

  if (!parsedDate.isValid) {
    return {
      asistencia: null,
      validaHorario: {
        ok: false,
        horario: null,
        detail: "Fecha inválida: formato ISO esperado (YYYY-MM-DDTHH:mm:ss)"
      }
    };
  }

  // 2. Validar horario
  const evalHorario = await ScheduleService.isWithinSchedule(idGrupo, parsedDate);

  const estado = evalHorario.ok ? "Registrada" : "Fuera de horario";

  // 3. Guardar usando la MISMA fecha
  const asistencia = await Asistencia.create({
    fechaHora: parsedDate.toJSDate(),
    estado,
    latitud,
    longitud,
    precision,
    idAlumno,
    idGrupo,
  });

  return { asistencia, validaHorario: evalHorario };
}
}

export default AsistenciaService;
