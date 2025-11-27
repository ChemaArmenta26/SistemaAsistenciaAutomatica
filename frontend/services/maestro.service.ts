const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface TeacherClassItem {
  id: number;
  name: string;
  room: string;
  time: string;
  horaInicioRaw: string;
}

export interface StudentAttendanceItem {
  idAlumno: number;
  matricula: string;
  nombre: string;
  email: string;
  estado: "Presente" | "Retardo" | "Falta" | "Pendiente" | "Justificado";
  hora: string;
  metodo: string;
}

// Obtener las clases de un maestro para una fecha específica
export const getTeacherClassesByDateService = async (teacherId: number, date: string): Promise<TeacherClassItem[]> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay sesión activa.");

  const response = await fetch(`${API_URL}/clases/maestro/${teacherId}/${date}`, {
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Cache-Control": "no-cache"
    }
  });
  
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Error al cargar cursos");
  return result.data;
};

// Obtener la lista de asistencia de un grupo y fecha específica
export const getGroupAttendanceListService = async (idGrupo: number, fecha: string): Promise<StudentAttendanceItem[]> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay sesión activa.");

  const response = await fetch(`${API_URL}/asistencia/lista/${idGrupo}/${fecha}`, {
    headers: { 
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache"
    }
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Error al cargar lista");
  return result.data;
};

// Actualizar manualmente la asistencia (Justificar, corregir retardo, etc)
export const updateManualAttendanceService = async (data: { idAlumno: number, idGrupo: number, fecha: string, estado: string }) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No hay sesión.");
  
    const response = await fetch(`${API_URL}/asistencia/manual`, {
      method: "PUT",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Error al actualizar");
    return result;
  };