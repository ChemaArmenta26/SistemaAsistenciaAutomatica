const API_URL = process.env.NEXT_PUBLIC_API_URL; 

export interface ClassItem {
  id: number;
  name: string;
  instructor: string;
  room: string;
  time: string;
  horaInicioRaw?: string;
  attended: boolean;
  attendanceStatus: 'Registrada' | 'Retardo' | null; 
}

export const getClassesTodayService = async (studentId: number): Promise<ClassItem[]> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay sesión activa.");

  try {
    const response = await fetch(`${API_URL}/clases/hoy/${studentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Error al obtener clases");
    }

    return result.data; 
  } catch (error) {
    console.error(error);
    throw error;
  }
};