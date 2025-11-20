import Horario from "../models/Horario.js";
import { DateTime } from "luxon";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class ScheduleService {

  static async isWithinSchedule(idGrupo, fechaHora = null) {
    let now;

    if (fechaHora) {
      now = DateTime.fromISO(fechaHora, { zone: TIMEZONE });
      if (!now.isValid) {
        return {
          ok: false,
          horario: null,
          detail: "Fecha inválida: formato ISO esperado (YYYY-MM-DDTHH:mm:ss)"
        };
      }
    } else {
      now = DateTime.now().setZone(TIMEZONE);
    }

    const diaSemana = now.weekday === 7 ? 0 : now.weekday;

    const horarios = await Horario.findAll({
      where: { idGrupo, diaSemana }
    });

    if (!horarios.length) {
      return {
        ok: false,
        horario: null,
        detail: "No hay horarios definidos para este grupo en este día"
      };
    }

    const nowMinutes = now.hour * 60 + now.minute;

    for (const h of horarios) {
      const [hIni, mIni] = h.horaInicio.split(":").map(Number);
      const [hFin, mFin] = h.horaFin.split(":").map(Number);

      const inicioMin = hIni * 60 + mIni;
      const finMin = hFin * 60 + mFin;
      const margen = h.margenDespuesMin ?? 15; // Margen para cerrar asistencia
      
      // Ventana total permitida
      const ventanaFin = finMin + margen;

      if (nowMinutes >= inicioMin && nowMinutes <= ventanaFin) {
        
        // Lógica para determinar si es Retardo
        const TOLERANCIA_RETARDO = 15; 
        let estadoCalculado = "Registrada";

        if (nowMinutes > (inicioMin + TOLERANCIA_RETARDO)) {
            estadoCalculado = "Retardo";
        }

        return {
          ok: true,
          horario: h,
          estadoSugerido: estadoCalculado,
          detail: "Dentro del horario permitido"
        };
      }
    }

    // Si termina el ciclo y no entró en ningún if, está fuera de rango
    return {
      ok: false,
      horario: null,
      detail: "Fuera del horario permitido"
    };
  }
}

export default ScheduleService;