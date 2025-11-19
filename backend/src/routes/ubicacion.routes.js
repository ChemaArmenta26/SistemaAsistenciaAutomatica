import express from "express";
import { ubi } from "../controllers/ubicacion.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use((req, res, next) => {
    next();
});

// Ruta protegida con JWT
router.post("/", auth, ubi);

export default router;