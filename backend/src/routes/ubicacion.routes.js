import express from "express";
import { ubi } from "../controllers/ubicacion.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use((req, res, next) => {
    console.log(">>> Entrando al router de ubi:", req.method, req.url);
    next();
});

// Ruta protegida con JWT
router.post("/ubicacion", auth, ubi);

export default router;