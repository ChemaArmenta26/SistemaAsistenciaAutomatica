/**
 * PRUEBAS CONSULTA DE HORARIO (CP-SCH)
 */

import { jest } from "@jest/globals";

jest.unstable_mockModule("../services/clase.service.js", () => ({
  default: {
    getHorarioMaestro: jest.fn((id) => {
      if (id === 1) return Promise.resolve([{ materia: "BD", dia: 1 }]);
      return Promise.resolve([]);
    }),
  },
}));

const { getHorarioMaestro } = await import("../controllers/clase.controller.js");
const express = (await import("express")).default;
const request = (await import("supertest")).default;

const app = express();
app.get("/api/horario", (req, res) => getHorarioMaestro(req, res));

// CP-SCH-01 Maestro con horario
test("CP-SCH-01 Ver mi horario docente", async () => {
  const req = { user: { id: 1 } };
  const res = { json: jest.fn() };

  await getHorarioMaestro(req, res);
  expect(res.json.mock.calls[0][0].data.length).toBe(1);
});

// CP-SCH-02 Maestro sin carga
test("CP-SCH-02 Sin carga académica", async () => {
  const req = { user: { id: 99 } };
  const res = { json: jest.fn(), status: jest.fn(() => res) };

  await getHorarioMaestro(req, res);
  expect(res.json.mock.calls[0][0].data.length).toBe(0);
});
