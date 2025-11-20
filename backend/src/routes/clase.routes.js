import express from "express";
import { getClasesHoy } from "../controllers/clase.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/hoy/:idAlumno", auth, getClasesHoy);

export default router;