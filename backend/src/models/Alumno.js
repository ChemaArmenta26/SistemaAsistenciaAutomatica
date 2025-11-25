import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Alumno = sequelize.define("Alumno", {
  idAlumno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  matricula: { type: DataTypes.STRING, allowNull: false, unique: true  },
  idUsuario: { type: DataTypes.INTEGER, allowNull: false }

});

export default Alumno;