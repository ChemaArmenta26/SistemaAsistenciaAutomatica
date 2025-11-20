import sequelize from "./src/config/db.js";

import { 
  Usuario, 
  Maestro, 
  Alumno, 
  Aula, 
  Clase, 
  Horario, 
  Inscripcion 
} from "./src/models/index.js";

import setupAssociations from "./src/models/associations.js";

setupAssociations();

import bcrypt from "bcryptjs";

async function runSeed() {
  try {
    console.log("Sincronizando base de datos...");
   
    // force: true borra todo y lo vuelve a crear
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
      latitud: 27.484065687223406,
      longitud: -109.98914823490362,
      radioPermitido: 50,
    });

    console.log("Aula creada");

    // ============================================================
    // CREAR CLASES / GRUPOS
    // ============================================================

    const clase1 = await Clase.create({
      nombreMateria: "Programación II",
      periodo: "ENE-MAY 2025",
      idMaestro: maestro.idMaestro,
      idAula: aula.idAula,
    });

    const clase2 = await Clase.create({
      nombreMateria: "Programación III",
      periodo: "ENE-MAY 2025",
      idMaestro: maestro.idMaestro,
      idAula: aula.idAula,
    });

    console.log("Clases/Grupos creados");

    // ============================================================
    // CREAR HORARIOS
    // ============================================================

    // Horario para Clase 1: Lunes (1) de 9:00 a 10:30
    await Horario.create({
      idGrupo: clase1.idGrupo,
      diaSemana: 1,          
      horaInicio: "09:00",
      horaFin: "10:30",
      margenDespuesMin: 10,
    });

    await Horario.create({
      idGrupo: clase1.idGrupo,
      diaSemana: 3,          
      horaInicio: "16:00",
      horaFin: "17:00",
      margenDespuesMin: 10,
    });

    await Horario.create({
      idGrupo: clase2.idGrupo,
      diaSemana: 3,          // 3 = Miércoles
      horaInicio: "17:00",
      horaFin: "23:00",
      margenDespuesMin: 10,
    });

    console.log("Horarios creados");

    // ============================================================
    // INSCRIPCIONES (EL PUENTE MÁGICO)
    // ============================================================


    await Inscripcion.create({
        idAlumno: alumno.idAlumno,
        idGrupo: clase1.idGrupo,
        activo: true
    });


    await Inscripcion.create({
        idAlumno: alumno.idAlumno,
        idGrupo: clase2.idGrupo,
        activo: true
    });

    console.log("Alumno inscrito correctamente en ambas clases");

    console.log("\nSEED COMPLETADO CORRECTAMENTE");
    process.exit();

  } catch (err) {
    console.error("Error ejecutando seed:", err);
    process.exit(1);
  }
}

runSeed();