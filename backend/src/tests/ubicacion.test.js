/**
 * PRUEBAS DE VALIDACIÓN DE UBICACIÓN
 */

import { jest } from '@jest/globals';

// Variable para controlar si ya se registró asistencia 
let yaRegistrado = false;

jest.unstable_mockModule("../services/asistencia.service.js", () => ({
  default: {
    registrarAsistencia: jest.fn((data) => {
      const { latitud, longitud, fechaHora } = data;

      // Fallo por horario
      if (fechaHora === "fuera_de_horario") {
        return Promise.resolve({
          exito: false,
          mensaje: "Fuera de horario",
          estadoFinal: "Fuera de horario",
          asistencia: null,
        });
      }
      // Caso exitoso la ubicación es correcta
      if (latitud === 27.49133867676796 && longitud === -109.97510899127928) {
        if (yaRegistrado) {
          return Promise.resolve({
            exito: false,
            mensaje: "Ya has registrado tu asistencia hoy",
            estadoFinal: "Duplicado",
            asistencia: null,
          });
        }
        yaRegistrado = true;
        return Promise.resolve({
          exito: true,
          mensaje: "Asistencia registrada correctamente",
          estadoFinal: "Registrada",
          asistencia: {
            idAsistencia: 1,
            estado: "Registrada",
          },
        });
      }

      // Fallo por ubicación
      return Promise.resolve({
        exito: false,
        mensaje: "Fuera de rango",
        estadoFinal: "Fuera de rango",
        asistencia: null,
      });
    }),
  },
}));

const { register } = await import("../controllers/asistencia.controller.js");
const express = (await import("express")).default;
const cors = (await import("cors")).default;
const request = (await import("supertest")).default;

const app = express();
app.use(cors());
app.use(express.json());
app.post("/api/asistencia", register);

describe("Pruebas de Validación de Ubicación", () => {
  beforeEach(() => {
    yaRegistrado = false;
  });

  test("Ubicación dentro del rango permitido", async () => {
    const response = await request(app).post("/api/asistencia").send({
      idAlumno: 1,
      idGrupo: 1,
      latitud: 27.49133867676796,
      longitud: -109.97510899127928,
    });

    console.log("Ubicación válida Response:", response.status, response.body);
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
  });

  test("Ubicación fuera del rango permitido", async () => {
    const response = await request(app).post("/api/asistencia").send({
      idAlumno: 1,
      idGrupo: 1,
      latitud: 27.497,
      longitud: -109.93,
    });

    console.log("Ubicación inválida Response:", response.status, response.body);
    expect(response.status).toBe(400);
  });
});