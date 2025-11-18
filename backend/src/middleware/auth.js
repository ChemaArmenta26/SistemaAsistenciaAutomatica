import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header)
    return res.status(401).json({ error: "Token no enviado" });

  const token = header.split(" ")[1]; // "Bearer TOKEN"

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    );

    req.user = decoded; // attach user

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

export default authMiddleware;