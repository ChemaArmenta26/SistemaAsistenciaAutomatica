import sequelize from "./src/config/db.js";
import bcrypt from "bcryptjs";
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

const NOMBRES = ["Juan", "Maria", "Pedro", "Ana", "Luis", "Sofia", "Carlos", "Lucia", "Jorge", "Elena", "Miguel", "Fernanda", "David", "Valentina", "Jose", "Camila", "Daniel", "Isabella", "Andres", "Mariana"];
const APELLIDOS = ["Garcia", "Rodriguez", "Lopez", "Martinez", "Gonzalez", "Perez", "Sanchez", "Romero", "Diaz", "Torres", "Ruiz", "Vargas", "Castro", "Ramos", "Flores", "Acosta", "Silva", "Mendez", "Gutierrez", "Morales"];
const MATERIAS = ["Ingeniería de Software", "Base de Datos", "Redes", "Sistemas Operativos", "Prog. Web", "IA", "Cálculo", "Álgebra", "Física", "Ética", "Estructura de Datos", "UX/UI", "Seguridad", "Gestión", "IoT", "Big Data", "Cloud", "Móviles", "DevOps", "Calidad"];

const getFixedElement = (arr, index) => arr[index % arr.length];

async function runSeed() {
  try {
    console.log("🔄 Sincronizando base de datos (FORCE: TRUE)...");
    await sequelize.sync({ force: true });

    const passwordHash = await bcrypt.hash("123456", 10);

    // 1. AULAS
    console.log("Creando 5 Aulas...");
    const aulas = await Aula.bulkCreate([
        { nombreAula: "B-201", latitud: 27.4840, longitud: -109.9891, radioPermitido: 50 },
        { nombreAula: "LV-100", latitud: 27.4499, longitud: -109.9135, radioPermitido: 50 },
        { nombreAula: "C-304", latitud: 27.45002, longitud: -109.91277, radioPermitido: 50 },
        { nombreAula: "A-101", latitud: 27.4850, longitud: -109.9880, radioPermitido: 50 },
        { nombreAula: "Lab-D", latitud: 27.4842, longitud: -109.9900, radioPermitido: 50 },
    ]);

    // 2. MAESTROS
    console.log("Creando 10 Maestros...");
    const maestros = [];
    for (let i = 0; i < 10; i++) {
        const nombre = `${getFixedElement(NOMBRES, i)} ${getFixedElement(APELLIDOS, i)}`;
        const email = `maestro${i+1}@itson.edu.mx`;
        
        const user = await Usuario.create({
            nombre,
            email,
            password: passwordHash,
            rol: "Maestro"
        });

        const maestro = await Maestro.create({
            idUsuario: user.idUsuario,
            matriculaEmpleado: `EMP${2000 + i}`,
            especialidad: "Docencia General"
        });
        maestros.push(maestro);
    }

    // 3. ALUMNOS
    console.log("Creando 50 Alumnos...");
    const alumnos = [];
    for (let i = 0; i < 50; i++) {
        const nombre = `${getFixedElement(NOMBRES, i + 5)} ${getFixedElement(APELLIDOS, i + 10)} ${getFixedElement(APELLIDOS, i)}`;
        const email = `alumno${i+1}@potros.itson.edu.mx`;
        
        const user = await Usuario.create({
            nombre,
            email,
            password: passwordHash,
            rol: "Alumno"
        });

        const alumno = await Alumno.create({
            idUsuario: user.idUsuario,
            matricula: `00000${1000 + i}` 
        });
        alumnos.push(alumno);
    }

    // 4. CLASES Y HORARIOS
    console.log("Creando 20 Clases base...");
    const clases = [];
    
    for (let i = 0; i < 20; i++) {
        const maestro = maestros[i % maestros.length];
        const aula = aulas[i % aulas.length];
        const materia = MATERIAS[i % MATERIAS.length];

        const clase = await Clase.create({
            nombreMateria: materia,
            periodo: "ENE-MAY 2025",
            idMaestro: maestro.idMaestro,
            idAula: aula.idAula
        });
        clases.push(clase);

        const dia1 = (i % 2 === 0) ? 1 : 2; 
        const dia2 = dia1 + 2;
        const horaBase = 7 + Math.floor(i / 2); 
        
        const hIni = `${horaBase.toString().padStart(2,'0')}:00`;
        const hFin = `${(horaBase+1).toString().padStart(2,'0')}:50`;

        await Horario.create({ idGrupo: clase.idGrupo, diaSemana: dia1, horaInicio: hIni, horaFin: hFin });
        await Horario.create({ idGrupo: clase.idGrupo, diaSemana: dia2, horaInicio: hIni, horaFin: hFin });
    }

    // 5. INSCRIPCIONES MASIVAS
    console.log("Inscribiendo alumnos...");
    for (let i = 0; i < alumnos.length; i++) {
        const alumno = alumnos[i];

        for (let j = 0; j < 4; j++) {
            const claseIndex = (i + (j * 5)) % clases.length;
            const clase = clases[claseIndex];

            await Inscripcion.create({
                idAlumno: alumno.idAlumno,
                idGrupo: clase.idGrupo,
                activo: true
            });
        }
    }

    console.log("\nSEED COMPLETADO EXITOSAMENTE");
    process.exit();

  } catch (err) {
    console.error("Error fatal en seed:", err);
    process.exit(1);
  }
}

runSeed();