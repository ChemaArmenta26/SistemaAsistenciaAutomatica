interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: "Alumno" | "Maestro";
  };
}

export const loginService = async (email: string, password: string): Promise<LoginResponse> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  console.log("API_URL:", API_URL);
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
        const text = await response.text(); 
        console.error("Respuesta NO es JSON:", text);
        throw new Error("El servidor devolvió HTML en lugar de datos. Revisa la URL.");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al iniciar sesión");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};