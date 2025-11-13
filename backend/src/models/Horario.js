// src/models/Horario.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import ClaseGrupo from "./ClaseGrupo.js";

const Horario = sequelize.define("Horario", {
  idHorario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idGrupo: { type: DataTypes.INTEGER, allowNull: false },
  diaSemana: { type: DataTypes.INTEGER, allowNull: false },
  horaInicio: { type: DataTypes.TIME, allowNull: false },
  horaFin: { type: DataTypes.TIME, allowNull: false },
});

Horario.belongsTo(ClaseGrupo, { foreignKey: "idGrupo" });
ClaseGrupo.hasMany(Horario, { foreignKey: "idGrupo" });

export default Horario;
