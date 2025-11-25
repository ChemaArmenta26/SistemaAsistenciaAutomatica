import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Maestro = sequelize.define("Maestro", {
  idMaestro: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  matriculaEmpleado: { type: DataTypes.STRING, allowNull: false, unique: true },
  idUsuario: { type: DataTypes.INTEGER, allowNull: false }
});

export default Maestro;