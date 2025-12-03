import express from "express";
import { getClasesHoy, getClasesPorFechaMaestro, getHorarioMaestro } from "../controllers/clase.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/hoy/:idAlumno", auth, getClasesHoy);

router.get('/maestro/:idMaestro/:fecha', auth, getClasesPorFechaMaestro);

router.get('/maestro/horario', auth, getHorarioMaestro);

export default router;