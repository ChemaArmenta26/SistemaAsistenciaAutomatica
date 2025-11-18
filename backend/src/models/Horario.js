  // src/models/Horario.js
  import { DataTypes } from "sequelize";
  import sequelize from "../config/db.js";

  const Horario = sequelize.define("Horario", {
    idHorario: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    idGrupo: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    // día de la semana: 0=domingo, 1=lunes ... 6=sábado
    diaSemana: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      comment: "0=domingo, 1=lunes ... 6=sábado"
    },
    horaInicio: { 
      type: DataTypes.TIME, 
      allowNull: false,
      comment: "Hora exacta de inicio (sin margen antes)"
    },
    horaFin: { 
      type: DataTypes.TIME, 
      allowNull: false 
    },
    margenDespuesMin: { 
      type: DataTypes.INTEGER, 
      defaultValue: 15,
      comment: "Minutos extras permitidos después de horaFin"
    },
  });

  export default Horario;