import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, sequelize } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import asistenciaRoutes from "./routes/asistencia.routes.js";
import ubicacionRoutes from "./routes/ubicacion.routes.js";
import associations from "./models/associations.js";
import claseRoutes from "./routes/clase.routes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/login", authRoutes);
app.use("/api/asistencia", asistenciaRoutes);
app.use("/api/ubicacion", ubicacionRoutes);
app.use("/api/clases", claseRoutes);

// Ruta de prueba (Health Check)
app.get("/", (req, res) => {
  res.json({ 
    message: "API del Sistema de Asistencia funcionando 🚀",
    endpoints: {
      login: "/api/login",
      asistencia: "/api/asistencia", 
      ubicacion: "/api/ubicacion",
      clases: "/api/clases/hoy/id"
    }
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Inicializar servidor
const startServer = async () => {
  try {
    await connectDB();
    
    associations();

    await sequelize.sync({ alter: true });
    console.log("Tablas sincronizadas con alter: true");
    
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`Escuchando en todas las interfaces (0.0.0.0)`);
    });
    
  } catch (error) {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();