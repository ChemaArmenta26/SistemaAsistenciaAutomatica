const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const registrarAsistenciaService = async (data: {
  idAlumno: number;
  idGrupo: number;
  latitud: number;
  longitud: number;
  precision: number;
}) => {
  const token = localStorage.getItem("token");
  
  if (!token) throw new Error("No hay sesión activa.");

  try {
    const response = await fetch(`${API_URL}/asistencia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || result.mensaje || "Error al registrar asistencia");
    }

    return result;
  } catch (error) {
    throw error;
  }
};