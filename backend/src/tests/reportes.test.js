/**
 * PRUEBAS DE REPORTES (CP-REP)
 */

import { jest } from "@jest/globals";

jest.unstable_mockModule("../services/asistencia.service.js", () => ({
  default: {
    getReporteRango: jest.fn((grupo, inicio, fin) => {
      if (inicio === "2099-01-01") return Promise.resolve({ alumnos: [] });
      return Promise.resolve({
        alumnos: [
          { nombre: "Juan", porcentaje: 90 },
          { nombre: "Ana", porcentaje: 75 },
        ],
      });
    }),
  },
}));

const { getReporteAsistencias } = await import("../controllers/asistencia.controller.js");
const express = (await import("express")).default;
const request = (await import("supertest")).default;

const app = express();
app.get("/api/reporte/:idGrupo", getReporteAsistencias);

// CP-REP-01 Generar reporte PDF con datos
test("CP-REP-01 Generar reporte con datos", async () => {
  const response = await request(app).get(
    "/api/reporte/1?fechaInicio=2025-01-01&fechaFin=2025-01-31"
  );
  expect(response.status).toBe(200);
  expect(response.body.data.alumnos.length).toBe(2);
});

// CP-REP-02 Reporte sin datos
test("CP-REP-02 Reporte sin datos", async () => {
  const response = await request(app).get(
    "/api/reporte/1?fechaInicio=2099-01-01&fechaFin=2099-01-31"
  );
  expect(response.status).toBe(200);
  expect(response.body.data.alumnos.length).toBe(0);
});
