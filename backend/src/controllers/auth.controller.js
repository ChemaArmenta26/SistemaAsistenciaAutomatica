import AuthService from "../services/auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await AuthService.login(email, password);
    res.json(data);
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(401).json({ message: error.message });
  }
};