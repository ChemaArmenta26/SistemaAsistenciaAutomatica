import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";

class AuthService {
  static async login(email, password) {
    const user = await Usuario.findOne({ where: { email } });
    if (!user) throw new Error("Usuario no encontrado");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Contraseña incorrecta");

    const token = jwt.sign(
      { id: user.idUsuario, rol: user.rol },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "4h" }
    );

    return { 
      token, 
      user: { 
        id: user.idUsuario, 
        nombre: user.nombre, 
        rol: user.rol,
        email: user.email
      } 
    };
  }
}

export default AuthService;