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
          detail: "Fecha inválida"
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
        detail: "No hay horario asignado"
      };
    }

    const nowMinutes = now.hour * 60 + now.minute;

    for (const h of horarios) {
      const [hIni, mIni] = h.horaInicio.split(":").map(Number);
      const [hFin, mFin] = h.horaFin.split(":").map(Number);

      const inicioMin = hIni * 60 + mIni;
      const finMin = hFin * 60 + mFin;

      const margenFin = finMin + (h.margenDespuesMin ?? 15);

      // 🔹 1. Intento anticipado
      if (nowMinutes < inicioMin) {
        return {
          ok: false,
          horario: h,
          detail: "La clase aún no ha comenzado"
        };
      }

      // 🔹 2. Intento tardío más allá del margen
      if (nowMinutes > margenFin) {
        return {
          ok: false,
          horario: h,
          detail: "La clase ha finalizado"
        };
      }

      // 🔹 3. Dentro del horario permitido
      const TOLERANCIA_RETARDO = 15;

      let estadoCalculado = "Presente";

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

    return {
      ok: false,
      horario: null,
      detail: "Fuera del rango permitido"
    };
  }
}

export default ScheduleService;
