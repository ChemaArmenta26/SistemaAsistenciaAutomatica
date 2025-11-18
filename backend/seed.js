// seed.js
import sequelize from "./src/config/db.js";

// MODELOS
import Usuario from "./src/models/Usuario.js";
import Maestro from "./src/models/Maestro.js";
import Alumno from "./src/models/Alumno.js";
import Aula from "./src/models/Aula.js";
import Clase from "./src/models/Clase.js";
import Horario from "./src/models/Horario.js";
import setupAssociations from "./src/models/associations.js";
setupAssociations();

import bcrypt from "bcryptjs";

async function runSeed() {
  try {
    console.log("Sincronizando base de datos...");
    await sequelize.sync({ force: true });

    // ============================================================
    // CREAR USUARIOS
    // ============================================================

    const passwordAlumno = await bcrypt.hash("123456", 10);
    const passwordMaestro = await bcrypt.hash("123456", 10);

    const alumnoUser = await Usuario.create({
      nombre: "José Pérez",
      email: "alumno@itson.edu.mx",
      password: passwordAlumno,
      rol: "Alumno",
    });

    const maestroUser = await Usuario.create({
      nombre: "Dr. Juan López",
      email: "maestro@itson.edu.mx",
      password: passwordMaestro,
      rol: "Maestro",
    });

    console.log("Usuarios creados");

    // ============================================================
    // CREAR ALUMNO Y MAESTRO
    // ============================================================

    const alumno = await Alumno.create({
      idUsuario: alumnoUser.idUsuario,
      matricula: "2233004455",
    });

    const maestro = await Maestro.create({
      idUsuario: maestroUser.idUsuario,
      especialidad: "Ingeniería en Software",
    });

    console.log("Alumno y Maestro creados");

    // ============================================================
    // CREAR AULA
    // ============================================================

    const aula = await Aula.create({
      nombreAula: "B-204",
      latitud: 27.493200,
      longitud: -109.933700,
      radioPermitido: 20.0,
    });

    console.log("Aula creada");

    // ============================================================
    // CREAR CLASE / GRUPO
    // ============================================================

    const clase = await Clase.create({
      nombreMateria: "Programación II",
      periodo: "ENE-MAY 2025",
      idMaestro: maestro.idMaestro,
      idAula: aula.idAula,
    });

    console.log("Clase/Grupo creado");

    // ============================================================
    // CREAR HORARIO (lunes 9:00 a 10:30)
    // ============================================================

    await Horario.create({
      idGrupo: clase.idGrupo,
      diaSemana: 1,          // 1 = Lunes
      horaInicio: "09:00",
      horaFin: "10:30",
      margenDespuesMin: 15,
    });

    console.log("Horario creado");

    console.log("\nSEED COMPLETADO CORRECTAMENTE");
    process.exit();

  } catch (err) {
    console.error("Error ejecutando seed:", err);
    process.exit(1);
  }
}

runSeed();