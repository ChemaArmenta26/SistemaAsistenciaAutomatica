import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Clase = sequelize.define("Clase", {
  idGrupo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombreMateria: DataTypes.STRING,
  periodo: DataTypes.STRING,
  idMaestro: { type: DataTypes.INTEGER, allowNull: false },
  idAula: { type: DataTypes.INTEGER, allowNull: false },
});

export default Clase;