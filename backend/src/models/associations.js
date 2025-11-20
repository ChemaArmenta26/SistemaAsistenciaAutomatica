import Usuario from "./Usuario.js";
import Maestro from "./Maestro.js";
import Alumno from "./Alumno.js";
import Aula from "./Aula.js";
import Clase from "./Clase.js";
import Horario from "./Horario.js";
import Asistencia from "./Asistencia.js";
import Inscripcion from "./Inscripcion.js";

// Usuario → Maestro / Alumno
Usuario.hasOne(Maestro, { foreignKey: "idUsuario" });
Maestro.belongsTo(Usuario, { foreignKey: "idUsuario" });

Usuario.hasOne(Alumno, { foreignKey: "idUsuario" });
Alumno.belongsTo(Usuario, { foreignKey: "idUsuario" });

// Maestro → ClaseGrupo
Maestro.hasMany(Clase, { foreignKey: "idMaestro" });
Clase.belongsTo(Maestro, { foreignKey: "idMaestro" });

// Aula → ClaseGrupo
Aula.hasMany(Clase, { foreignKey: "idAula" });
Clase.belongsTo(Aula, { foreignKey: "idAula" });

// ClaseGrupo → Horario
Clase.hasMany(Horario, { foreignKey: "idGrupo" });
Horario.belongsTo(Clase, { foreignKey: "idGrupo" });

// Alumno → Asistencia
Alumno.hasMany(Asistencia, { foreignKey: "idAlumno" });
Asistencia.belongsTo(Alumno, { foreignKey: "idAlumno" });

// ClaseGrupo → Asistencia
Clase.hasMany(Asistencia, { foreignKey: "idGrupo" });
Asistencia.belongsTo(Clase, { foreignKey: "idGrupo" });

// Un Alumno tiene muchas Clases (a través de Inscripcion)
Alumno.belongsToMany(Clase, { through: Inscripcion, foreignKey: "idAlumno" });

// Una Clase tiene muchos Alumnos (a través de Inscripcion)
Clase.belongsToMany(Alumno, { through: Inscripcion, foreignKey: "idGrupo" });

// Relaciones directas para consultas complejas
Inscripcion.belongsTo(Alumno, { foreignKey: "idAlumno" });
Inscripcion.belongsTo(Clase, { foreignKey: "idGrupo" });
Clase.hasMany(Inscripcion, { foreignKey: "idGrupo" });
Alumno.hasMany(Inscripcion, { foreignKey: "idAlumno" });

export default function setupAssociations() {
  return true;
}
