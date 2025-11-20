import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Inscripcion = sequelize.define("Inscripcion", {
  idInscripcion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "Inscripciones",
  timestamps: true
});

export default Inscripcion;