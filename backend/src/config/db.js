import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "sistema_asistencia",
  process.env.DB_USER || "postgres", 
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
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
    
    // Sincronizar modelos
    await sequelize.sync({ alter: true });
    console.log("Modelos sincronizados");
    
  } catch (error) {
    console.error("Error conectando a la base de datos:", error);
    throw error;
  }
};

export default sequelize;