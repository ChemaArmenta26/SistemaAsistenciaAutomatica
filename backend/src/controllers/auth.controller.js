import AuthService from "../services/auth.service.js";

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const token = await AuthService.login(email, password);
    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}