import express from "express";
import { register, getListaAsistencia, updateAsistenciaManual } from "../controllers/asistencia.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use((req, res, next) => {
    next();
});

router.post("/", auth, register);

router.get('/lista/:idGrupo/:fecha', auth, getListaAsistencia);

router.put('/manual', auth, updateAsistenciaManual);

export default router;