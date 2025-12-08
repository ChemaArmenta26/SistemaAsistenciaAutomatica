/**
 * PRUEBAS DE AUTENTICACIÓN (CP-AUTH)
 * Estas pruebas verifican el correcto funcionamiento :)
 * del login de alumnos y maestros dentro del sistema.
 */
import request from "supertest";
import express from "express";
import cors from "cors";
import authRoutes from "../routes/auth.routes.js";

// Se prepara el servidor para pruebas
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/login", authRoutes);

describe("Pruebas de Autenticación (CP-AUTH)", () => {

  // CP-AUTH-01: Login correcto de un alumno
  test("CP-AUTH-01: Login Exitoso (Alumno)", async () => {
    const response = await request(app).post("/api/login").send({
      email: "alumno1@potros.itson.edu.mx", 
      password: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user.rol).toBe("Alumno");
  });

  // CP-AUTH-02: Login correcto de un maestro
  test("CP-AUTH-02: Login Exitoso (Maestro)", async () => {
    const response = await request(app).post("/api/login").send({
      email: "maestro1@itson.edu.mx", 
      password: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.rol).toBe("Maestro");
  });

  // CP-AUTH-03: Credenciales incorrectas
  test("CP-AUTH-03: Credenciales Inválidas", async () => {
    const response = await request(app).post("/api/login").send({
      email: "falso@test.com",
      password: "0000",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  // CP-AUTH-04: Fallo simulado por valores inválidos
  test("CP-AUTH-04: Fallo de Servicio ITSON (Simulado)", async () => {
    const response = await request(app).post("/api/login").send({
      email: "alumno1@potros.itson.edu.mx",
      password: "", 
    });

    expect([401, 500]).toContain(response.status);
    expect(response.body).toHaveProperty("error");
  });
});