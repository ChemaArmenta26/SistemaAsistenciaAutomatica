/**
 * PRUEBAS DE GESTIÓN (CP-GEST-01 y CP-GEST-02)
 */

import { jest } from "@jest/globals";

jest.unstable_mockModule("../services/asistencia.service.js", () => ({
  default: {
    obtenerListaAsistencia: jest.fn((idGrupo, fecha) => {
      if (fecha === "2025-03-02") return Promise.resolve([]);
      return Promise.resolve([
        { nombre: "Juan", estado: "Presente" },
        { nombre: "Ana", estado: "Falta" },
      ]);
    }),
  },
}));

const { getListaAsistencia } = await import("../controllers/asistencia.controller.js");
const express = (await import("express")).default;
const request = (await import("supertest")).default;

const app = express();
app.use(express.json());
app.get("/api/asistencia/lista/:idGrupo/:fecha", getListaAsistencia);

// 🔹 CP-GEST-01 Lista de asistencia válida
test("CP-GEST-01 Visualizar lista de asistencia", async () => {
  const response = await request(app).get("/api/asistencia/lista/1/2025-02-04");
  expect(response.status).toBe(200);
  expect(response.body.data.length).toBe(2);
});

// 🔹 CP-GEST-02 Día sin clase
test("CP-GEST-02 Visualizar día sin clase", async () => {
  const response = await request(app).get("/api/asistencia/lista/1/2025-03-02");
  expect(response.status).toBe(200);
  expect(response.body.data.length).toBe(0);
});
