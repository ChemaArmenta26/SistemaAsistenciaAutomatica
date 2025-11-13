import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Maestro from "./Maestro.js";
import Aula from "./Aula.js";

const Clase = sequelize.define("Clase", {
  idGrupo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombreMateria: DataTypes.STRING,
  periodo: DataTypes.STRING,
});

Clase.belongsTo(Maestro, { foreignKey: "idMaestro" });
Clase.belongsTo(Aula, { foreignKey: "idAula" });

export default Clase;
