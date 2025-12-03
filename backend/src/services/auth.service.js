import { Usuario } from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class AuthService {
  static async login(email, password) {
    // 1. Validación de campos vacíos
    if (!email || !password) {
      throw new Error("Por favor ingresa correo y contraseña.");
    }

    // 2. Buscar usuario
    const user = await Usuario.findOne({ where: { email } });
    if (!user) {
      throw new Error("El correo ingresado no está registrado."); // Mensaje específico
    }

    // 3. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("La contraseña es incorrecta."); // Mensaje específico
    }

    // 4. Generar Token
    const token = jwt.sign(
      { id: user.idUsuario, rol: user.rol },
      process.env.JWT_SECRET || "secreto_super_seguro",
      { expiresIn: "1d" }
    );

    return { 
        token, 
        user: { 
            id: user.idUsuario, 
            nombre: user.nombre, 
            email: user.email, 
            rol: user.rol 
        } 
    };
  }
}

export default AuthService;