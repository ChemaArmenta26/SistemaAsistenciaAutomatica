import express from "express";
import { getClasesHoy, getClasesHoyMaestro } from "../controllers/clase.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/hoy/:idAlumno", auth, getClasesHoy);

router.get('/maestro/hoy/:idMaestro', auth, getClasesHoyMaestro);

export default router;