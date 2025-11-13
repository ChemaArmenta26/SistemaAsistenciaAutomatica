import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true },
  password: String,
  rol: { type: String, enum: ["Alumno", "Maestro", "Admin"] },
});

export default mongoose.model("Usuario", usuarioSchema);