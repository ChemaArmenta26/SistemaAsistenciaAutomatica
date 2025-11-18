import express from "express";
import { register } from "../controllers/asistencia.controller.js";
import auth from "../middleware/auth.js";


console.log(">>> asistencia.routes.js cargado");
const router = express.Router();

router.use((req, res, next) => {
    console.log(">>> Entrando al router de asistencia:", req.method, req.url);
    next();
});

// Ruta protegida con JWT
router.post("/asistencia", auth, register);


export default router;