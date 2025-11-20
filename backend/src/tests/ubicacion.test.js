/**
 * ======================================================
 * PRUEBAS DE REGISTRO DE ASISTENCIA (CP-REG)
 * ======================================================
 * Aquí se valida el proceso de registro de asistencia.
 */

import { jest } from "@jest/globals";

// Variable que simula si el alumno ya registró asistencia hoy
let yaRegistrado = false;

// MOCK del servicio real
jest.unstable_mockModule("../services/asistencia.service.js", () => ({
  default: {
    registrarAsistencia: jest.fn((data) => {
      const { latitud, longitud, fechaHora } = data;

      // Caso: fuera de horario
      if (fechaHora === "fuera_de_horario") {
        return Promise.resolve({
          exito: false,
          mensaje: "Fuera de horario",
          estadoFinal: "Fuera de horario",
          asistencia: null,
        });
      }

      // Caso: ubicación correcta
      if (latitud === 27.49133867676796 && longitud === -109.97510899127928) {

        // Caso: duplicidad
        if (yaRegistrado) {
          return Promise.resolve({
            exito: false,
            mensaje: "Ya has registrado tu asistencia hoy",
            estadoFinal: "Duplicado",
            asistencia: null,
          });
        }

        // Primer registro exitoso
        yaRegistrado = true;
        return Promise.resolve({
          exito: true,
          mensaje: "Asistencia registrada correctamente",
          estadoFinal: "Registrada",
          asistencia: { idAsistencia: 1, estado: "Registrada" },
        });
      }

      // Caso: fuera de rango
      return Promise.resolve({
        exito: false,
        mensaje: "Fuera de rango",
        estadoFinal: "Fuera de rango",
        asistencia: null,
      });
    }),
  },
}));

// Controlador real
const { register } = await import("../controllers/asistencia.controller.js");
const express = (await import("express")).default;
const cors = (await import("cors")).default;
const request = (await import("supertest")).default;

// App para pruebas
const app = express();
app.use(cors());
app.use(express.json());
app.post("/api/asistencia", register);

describe("Pruebas de Registro de Asistencia (CP-REG)", () => {

  // Se reinicia el flag antes de cada prueba
  beforeEach(() => {
    yaRegistrado = false;
  });

  // CP-REG-01: Registro exitoso
  test("CP-REG-01: Registro Exitoso", async () => {
    const response = await request(app).post("/api/asistencia").send({
      idAlumno: 1,
      idGrupo: 1,
      latitud: 27.49133867676796,
      longitud: -109.97510899127928,
    });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
  });

  // CP-REG-02: Fallo por horario
  test("CP-REG-02: Fallo por Horario", async () => {
    const response = await request(app).post("/api/asistencia").send({
      idAlumno: 1,
      idGrupo: 1,
      latitud: 27.49133867676796,
      longitud: -109.97510899127928,
      fechaHora: "fuera_de_horario",
    });

    expect(response.status).toBe(400);
  });

  // CP-REG-03: Ubicación fuera de rango
  test("CP-REG-03: Fallo por Ubicación", async () => {
    const response = await request(app).post("/api/asistencia").send({
      idAlumno: 1,
      idGrupo: 1,
      latitud: 27.497,
      longitud: -109.93,
    });

    expect(response.status).toBe(400);
  });

  // CP-REG-04: Debe FALLAR intencionalmente (regex incorrecto)
  test("CP-REG-04: Duplicidad de Registro", async () => {

    // Registro exitoso
    await request(app).post("/api/asistencia").send({
      idAlumno: 1,
      idGrupo: 1,
      latitud: 27.49133867676796,
      longitud: -109.97510899127928,
    });

    // Segundo registro: debe fallar
    const segunda = await request(app).post("/api/asistencia").send({
      idAlumno: 1,
      idGrupo: 1,
      latitud: 27.49133867676796,
      longitud: -109.97510899127928,
    });

    const mensaje = segunda.body.error || segunda.body.mensaje || "";

    // Esta prueba da error :)
    expect(mensaje.toLowerCase()).toMatch(/duplicado|ya registro/);
  });
});
