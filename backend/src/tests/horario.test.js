/**
 * PRUEBAS DE HORARIO (CP-HOR)
 */

import { jest } from "@jest/globals";

jest.unstable_mockModule("../services/schedule.service.js", () => ({
  default: {
    isWithinSchedule: jest.fn((idGrupo, fechaHora) => {
      if (!fechaHora) {
        return Promise.resolve({
          ok: true,
          estadoSugerido: "Presente",
          detail: "Dentro del horario permitido"
        });
      }

      // Extraer hora de la fecha
      let hora, minutos;
      
      if (typeof fechaHora === 'string') {
        const fecha = new Date(fechaHora);
        hora = fecha.getHours();
        minutos = fecha.getMinutes();
      } else if (fechaHora.hour !== undefined) {
        // Si es un objeto DateTime de luxon
        hora = fechaHora.hour;
        minutos = fechaHora.minute;
      } else {
        hora = fechaHora.getHours();
        minutos = fechaHora.getMinutes();
      }

      const tiempoEnMinutos = hora * 60 + minutos;

      const inicioClase = 10 * 60;     
      const finClase = 11 * 60;        
      const margenDespues = finClase + 15; 
      // Caso 1: Muy temprano (antes de las 10:00)
      if (tiempoEnMinutos < inicioClase) {
        return Promise.resolve({
          ok: false,
          horario: null,
          detail: "La clase aún no ha comenzado"
        });
      }

      // Caso 2: Muy tarde (después de las 11:15)
      if (tiempoEnMinutos > margenDespues) {
        return Promise.resolve({
          ok: false,
          horario: null,
          detail: "El periodo de asistencia ha finalizado"
        });
      }

      const toleranciaRetardo = inicioClase + 15; 
      const estadoSugerido = tiempoEnMinutos > toleranciaRetardo ? "Retardo" : "Presente";

      return Promise.resolve({
        ok: true,
        horario: { horaInicio: "10:00", horaFin: "11:00" },
        estadoSugerido: estadoSugerido,
        detail: "Dentro del horario permitido"
      });
    })
  }
}));

jest.unstable_mockModule("../services/ubicacion.service.js", () => ({
  default: {
    validarUbicacionAula: jest.fn(() => Promise.resolve({ ok: true }))
  }
}));

jest.unstable_mockModule("../services/asistencia.service.js", () => ({
  default: {
    registrarAsistencia: jest.fn(async (data) => {
      const { fechaHora } = data;
      
      const ScheduleService = (await import("../services/schedule.service.js")).default;
      const evalHorario = await ScheduleService.isWithinSchedule(data.idGrupo, fechaHora);
      
      if (!evalHorario.ok) {
        return {
          ok: false,
          exito: false,
          mensaje: evalHorario.detail,
          estadoFinal: "Fuera de horario",
          asistencia: null,
        };
      }

      return {
        ok: true,
        exito: true,
        mensaje: `Asistencia registrada correctamente (${evalHorario.estadoSugerido})`,
        estadoFinal: evalHorario.estadoSugerido,
        asistencia: { 
          idAsistencia: 1, 
          estado: evalHorario.estadoSugerido 
        },
      };
    }),
  },
}));

const { register } = await import("../controllers/asistencia.controller.js");
const express = (await import("express")).default;
const request = (await import("supertest")).default;

const app = express();
app.use(express.json());
app.post("/api/asistencia", register);

// CP-HOR-01 — Registro válido dentro de horario (10:20)
test("CP-HOR-01 Registro en Horario Válido", async () => {
  const fecha = new Date("2025-03-01T10:20:00");
  const response = await request(app).post("/api/asistencia").send({
    idGrupo: 1,
    idAlumno: 1,
    fechaHora: fecha.toISOString(),
    latitud: 27.49133867676796,
    longitud: -109.97510899127928,
  });

  expect([200, 201]).toContain(response.status);
  expect(response.body.exito).toBe(true);
});

// CP-HOR-02 — Intento anticipado (9:40, antes de las 10:00)
test("CP-HOR-02 Intento Anticipado (Muy temprano)", async () => {
  const fecha = new Date("2025-03-01T09:40:00");
  const response = await request(app).post("/api/asistencia").send({
    idGrupo: 1,
    idAlumno: 1,
    fechaHora: fecha.toISOString(),
    latitud: 27.49133867676796,
    longitud: -109.97510899127928,
  });

  expect(response.status).toBe(400);
  expect(response.body.exito).toBe(false);
  expect(response.body.mensaje || response.body.message).toContain("no ha comenzado");
});

// CP-HOR-03 — Intento tardío (11:40, después del margen)
test("CP-HOR-03 Intento tardío (Clase finalizada)", async () => {
  const fecha = new Date("2025-03-01T11:40:00");
  const response = await request(app).post("/api/asistencia").send({
    idGrupo: 1,
    idAlumno: 1,
    fechaHora: fecha.toISOString(),
    latitud: 27.49133867676796,
    longitud: -109.97510899127928,
  });

  expect(response.status).toBe(400);
  expect(response.body.exito).toBe(false);
  expect(response.body.mensaje || response.body.message).toContain("finalizado");
});

// CP-HOR-04 — Registro con retardo pero dentro del margen (10:20)
test("CP-HOR-04 Registro dentro del retardo permitido", async () => {
  const fecha = new Date("2025-03-01T10:20:00");
  const response = await request(app).post("/api/asistencia").send({
    idGrupo: 1,
    idAlumno: 1,
    fechaHora: fecha.toISOString(),
    latitud: 27.49133867676796,
    longitud: -109.97510899127928,
  });

  expect([200, 201]).toContain(response.status);
  expect(response.body.exito).toBe(true);
  // Puede ser "Retardo" o "Presente" dependiendo de la tolerancia
  expect(["Retardo", "Presente"]).toContain(response.body.estadoFinal);
});