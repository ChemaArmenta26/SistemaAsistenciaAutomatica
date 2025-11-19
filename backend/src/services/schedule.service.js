import Horario from "../models/Horario.js";
import { DateTime } from "luxon";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class ScheduleService {

  /**
   * Valida si la fecha dada cae dentro del horario de clase del grupo.
   */
  static async isWithinSchedule(idGrupo, fechaHoraInput = null) {

    let now;

    if (!fechaHoraInput) {
      now = DateTime.now().setZone(TIMEZONE);
    } else if (DateTime.isDateTime(fechaHoraInput)) {
    
      now = fechaHoraInput; 
    } else {
      now = DateTime.fromISO(fechaHoraInput, { zone: TIMEZONE });
    }

    if (!now.isValid) {
      return {
        ok: false,
        horario: null,
        detail: "Fecha inválida o formato incorrecto"
      };
    }

    const diaSemana = now.weekday === 7 ? 0 : now.weekday;

    const horarios = await Horario.findAll({
      where: { idGrupo, diaSemana }
    });

    if (!horarios.length) {
      return {
        ok: false,
        horario: null,
        detail: "No hay clases programadas para este grupo hoy."
      };
    }

    // Convertir hora actual a minutos totales desde medianoche
    const nowMinutes = now.hour * 60 + now.minute;

    for (const h of horarios) {
      const [hIni, mIni] = h.horaInicio.split(":").map(Number);
      const [hFin, mFin] = h.horaFin.split(":").map(Number);

      const inicioMin = hIni * 60 + mIni;
      const finMin = hFin * 60 + mFin;
      
      // Márgenes de tolerancia
      const margenDespues = h.margenDespuesMin ?? 15; 
      const margenAntes = 5; 

      const ventanaInicio = inicioMin - margenAntes;
      const ventanaFin = finMin + margenDespues;

      if (nowMinutes >= ventanaInicio && nowMinutes <= ventanaFin) {
        
        return {
          ok: true,
          horario: h,
          detail: "Dentro del horario permitido"
        };
      }
    }

    return {
      ok: false,
      horario: null,
      detail: "Fuera del rango de hora permitido."
    };
  }
}

export default ScheduleService;