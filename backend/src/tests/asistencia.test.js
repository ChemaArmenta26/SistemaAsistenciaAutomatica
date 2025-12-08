/**
 * PRUEBAS DE REGISTRO DE ASISTENCIA (CP-REG)
 * Aquí se valida el proceso de registro de asistencia.
 */

import { jest } from '@jest/globals';

// Variable que simula si el alumno ya registró asistencia hoy
let yaRegistrado = false;

// IMPORTANTE: El mock debe mockear AMBOS servicios
jest.unstable_mockModule("../services/schedule.service.js", () => ({
  default: {
    isWithinSchedule: jest.fn((idGrupo, fechaHora) => {
      // Si fechaHora es el string especial, falla por horario
      if (fechaHora && fechaHora.toISO && fechaHora.toISO() === "fuera_de_horario") {
        return Promise.resolve({
          ok: false,
          horario: null,
          detail: "Fuera de horario"
        });
      }
      // Si es el string literal (antes de parsearse)
      if (fechaHora === "fuera_de_horario") {
        return Promise.resolve({
          ok: false,
          horario: null,
          detail: "Fuera de horario"
        });
      }
      // Por defecto, horario válido
      return Promise.resolve({
        ok: true,
        estadoSugerido: "Registrada",
        detail: "Dentro del horario permitido"
      });
    })
  }
}));

jest.unstable_mockModule("../services/ubicacion.service.js", () => ({
  default: {
    validarUbicacionAula: jest.fn((idGrupo, lat, lon) => {
      // Coordenadas válidas
      if (lat === 27.49133867676796 && lon === -109.97510899127928) {
        return Promise.resolve({ ok: true });
      }
      // Coordenadas inválidas
      return Promise.resolve({ 
        ok: false, 
        mensaje: "Fuera de rango" 
      });
    })
  }
}));

jest.unstable_mockModule("../services/asistencia.service.js", () => ({
  default: {
    registrarAsistencia: jest.fn((data) => {
      const { latitud, longitud, fechaHora } = data;

      // ORDEN DE VALIDACIÓN: Horario -> Ubicación -> Duplicidad

      // 1. Validar horario primero
      if (fechaHora === "fuera_de_horario") {
        return Promise.resolve({
          ok: false,
          exito: false,
          mensaje: "Fuera de horario",
          estadoFinal: "Fuera de horario",
          asistencia: null,
        });
      }

      // 2. Validar ubicación
      if (latitud !== 27.49133867676796 || longitud !== -109.97510899127928) {
        return Promise.resolve({
          ok: false,
          exito: false,
          mensaje: "Fuera de rango",
          estadoFinal: "Fuera de rango",
          asistencia: null,
        });
      }

      // 3. Validar duplicidad
      if (yaRegistrado) {
        return Promise.resolve({
          ok: false,
          exito: false,
          mensaje: "Ya has registrado tu asistencia hoy",
          estadoFinal: "Duplicado",
          asistencia: null,
        });
      }

      // 4. Registro exitoso
      yaRegistrado = true;
      return Promise.resolve({
        ok: true,
        exito: true,
        mensaje: "Asistencia registrada correctamente",
        estadoFinal: "Registrada",
        asistencia: { idAsistencia: 1, estado: "Registrada" },
      });
    }),
  },
}));

// Importaciones dinámicas DESPUÉS de los mocks
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

    console.log("CP-REG-01 Response:", response.status, response.body);
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

    console.log("CP-REG-02 Response:", response.status, response.body);
    expect(response.status).toBe(400);
    expect(response.body.exito).toBe(false);
  });

  // CP-REG-03: Ubicación fuera de rango
  test("CP-REG-03: Fallo por Ubicación", async () => {
    const response = await request(app).post("/api/asistencia").send({
      idAlumno: 1,
      idGrupo: 1,
      latitud: 27.497,
      longitud: -109.93,
    });

    console.log("CP-REG-03 Response:", response.status, response.body);
    expect(response.status).toBe(400);
    expect(response.body.estadoFinal).toBe("Fuera de rango");
  });

  /// CP-REG-04: Duplicidad de Registro
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

    console.log("CP-REG-04 Response:", segunda.status, segunda.body);
    expect(segunda.status).toBe(400);
    const mensaje = segunda.body.error || segunda.body.mensaje || "";
    expect(mensaje.toLowerCase()).toContain("ya has registrado");
  });
});