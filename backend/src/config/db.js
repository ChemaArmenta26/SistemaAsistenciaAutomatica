import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

console.log(`Conectando a base de datos en: ${process.env.DB_HOST || 'localhost'} (Modo Seguro: ${isRemote ? 'ACTIVADO' : 'DESACTIVADO'})`);

export const sequelize = new Sequelize(
  process.env.DB_NAME || "sistema_asistencia",
  process.env.DB_USER || "postgres", 
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    dialectOptions: isRemote ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión a base de datos exitosa");
    
    
    await sequelize.sync({ alter: true });
    console.log("Modelos sincronizados (Forzado para corrección)");

    
  } catch (error) {
    console.error("Error conectando a la base de datos:", error);
  }
};