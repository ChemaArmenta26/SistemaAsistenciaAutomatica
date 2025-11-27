import express from "express";
import { getClasesHoy, getClasesPorFechaMaestro } from "../controllers/clase.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/hoy/:idAlumno", auth, getClasesHoy);

router.get('/maestro/:idMaestro/:fecha', auth, getClasesPorFechaMaestro);

export default router;