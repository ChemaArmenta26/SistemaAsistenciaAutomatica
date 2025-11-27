const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface StudentSubjectStats {
  id: number;
  name: string;
  instructor: string;
  attendance: number; 
  late: number;       
  percentage: number; 
}

export interface AttendanceRecord {
  id: number;
  date: string;     
  time: string;       
  status: string;     
}

export const getStudentStatsService = async (): Promise<StudentSubjectStats[]> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay sesión activa.");

  const response = await fetch(`${API_URL}/asistencia/alumno/resumen`, {
    headers: { 
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache"
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || "Error al cargar el resumen de asistencias");
  }
  
  return result.data;
};

export const getSubjectHistoryService = async (groupId: number): Promise<AttendanceRecord[]> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay sesión activa.");

  const response = await fetch(`${API_URL}/asistencia/alumno/historial/${groupId}`, {
    headers: { 
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache"
    }
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Error al cargar el historial de la materia");
  }

  return result.data;
};