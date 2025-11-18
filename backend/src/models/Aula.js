import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Aula = sequelize.define("Aula", {
  idAula: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombreAula: DataTypes.STRING,
  latitud: DataTypes.DOUBLE,
  longitud: DataTypes.DOUBLE,
  radioPermitido: { type: DataTypes.DOUBLE, defaultValue: 15.0 },
});

export default Aula;
