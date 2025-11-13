import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import asistenciaRoutes from "./routes/asistencia.routes.js";
import ubicacionRoutes from "./routes/ubicacion.routes.js";
import { connectDB } from "./config/db.js";

dotenv.config();
connectDB();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/asistencia", asistenciaRoutes);
app.use("/api/ubicacion", ubicacionRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));