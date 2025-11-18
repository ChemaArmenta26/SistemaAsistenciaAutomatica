import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Asistencia = sequelize.define("Asistencia", {
  idAsistencia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idAlumno: { type: DataTypes.INTEGER, allowNull: false },
  idGrupo: { type: DataTypes.INTEGER, allowNull: false },
  fechaHora: { type: DataTypes.DATE, allowNull: false },
  estado: { type: DataTypes.STRING, allowNull: false }, // 'Registrada', 'Fuera de horario', etc.
  latitud: DataTypes.DOUBLE,
  longitud: DataTypes.DOUBLE,
  precision: DataTypes.DOUBLE,
});

export default Asistencia;