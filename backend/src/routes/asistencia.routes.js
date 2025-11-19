import express from "express";
import { register } from "../controllers/asistencia.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use((req, res, next) => {
    next();
});

// Ruta protegida con JWT
router.post("/", auth, register);


export default router;