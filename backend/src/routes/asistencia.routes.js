import express from "express";
import { register, getListaAsistencia, updateAsistenciaManual, getResumenAlumno, getHistorialGrupo } from "../controllers/asistencia.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use((req, res, next) => {
    next();
});

router.post("/", auth, register);

router.get('/lista/:idGrupo/:fecha', auth, getListaAsistencia);
router.put('/manual', auth, updateAsistenciaManual);
router.get('/alumno/resumen', auth, getResumenAlumno);
router.get('/alumno/historial/:idGrupo', auth, getHistorialGrupo);

export default router;