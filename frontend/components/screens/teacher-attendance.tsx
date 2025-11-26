"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { ChevronLeft, Download, RefreshCw, MapPin, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
    getTeacherClassesTodayService, 
    getGroupAttendanceListService, 
    updateManualAttendanceService,
    type StudentAttendanceItem,
    type TeacherClassItem
} from "@/services/maestro.service"

interface TeacherAttendanceProps {
  userName: string
  onNavigate: (screen: string) => void
  onLogout: () => void
  initialCourseId?: number 
}

export function TeacherAttendance({ userName, onNavigate, onLogout, initialCourseId }: TeacherAttendanceProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId ? initialCourseId.toString() : "")
  
  const [courses, setCourses] = useState<TeacherClassItem[]>([])
  const [students, setStudents] = useState<StudentAttendanceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    const loadCourses = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);
            const teacherId = user.id;

            const data = await getTeacherClassesTodayService(teacherId)
            setCourses(data)
            
            if (!initialCourseId && data.length > 0 && !selectedCourseId) {
                setSelectedCourseId(data[0].id.toString())
            }
        } catch (e) { 
            toast.error("Error cargando cursos") 
        }
    }
    loadCourses()
  }, [])

  const fetchAttendance = async () => {
    if (!selectedCourseId) return;
    
    setLoading(true)
    try {
        const data = await getGroupAttendanceListService(Number(selectedCourseId), selectedDate)
        setStudents(data)
    } catch (error: any) {
        toast.error("Error cargando lista de asistencia")
        setStudents([])
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCourseId) {
        fetchAttendance()
    }
  }, [selectedCourseId, selectedDate])

  // Manejar cambio manual de estado
  const handleStatusChange = async (student: StudentAttendanceItem) => {
    const statesMap: Record<string, string> = {
        'Pendiente': 'Presente',
        'Presente': 'Retardo',
        'Retardo': 'Falta',
        'Falta': 'Justificado',
        'Justificado': 'Presente'
    }
    
    const currentState = student.estado || 'Pendiente';
    const nextState = statesMap[currentState] || 'Presente';
    
    setUpdatingId(student.idAlumno)
    try {
        await updateManualAttendanceService({
            idAlumno: student.idAlumno,
            idGrupo: Number(selectedCourseId),
            fecha: selectedDate,
            estado: nextState
        })
        
        setStudents(prev => prev.map(s => 
            s.idAlumno === student.idAlumno ? { ...s, estado: nextState as any, metodo: 'Manual' } : s
        ))
        toast.success(`Estado actualizado a ${nextState}`)
    } catch (e) {
        toast.error("No se pudo actualizar")
    } finally {
        setUpdatingId(null)
    }
  }

  const presentCount = students.filter((s) => s.estado === "Presente" || s.estado === "Retardo").length
  const absentCount = students.filter((s) => s.estado === "Falta").length
  const percentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="teacher" />

      <main className="max-w-4xl mx-auto p-4 pb-20">
        <Button variant="ghost" size="sm" onClick={() => onNavigate("teacher-dashboard")} className="mb-4 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver a Mis Cursos
        </Button>

        <div className="space-y-6">
          {/* Filtros Principales */}
          <Card className="shadow-sm border-l-4 border-l-primary">
            <CardHeader className="pb-3 border-b mb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Gestión de Asistencia</span>
                <Button variant="outline" size="sm" onClick={fetchAttendance} disabled={loading}>
                    <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`}/> Actualizar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Seleccionar Curso</label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cargando cursos..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.time})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Fecha de Clase</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjetas de Estadísticas */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <span className="text-3xl font-bold text-green-600">{presentCount}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">Asistencias</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <span className="text-3xl font-bold text-red-500">{absentCount}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">Faltas</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <span className="text-3xl font-bold text-blue-600">{percentage}%</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">Participación</span>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Estudiantes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="w-4 h-4"/> Listado de Alumnos ({students.length})
              </CardTitle>
              <Button size="sm" variant="outline" disabled title="Próximamente">
                <Download className="w-4 h-4 mr-2" /> Exportar PDF
              </Button>
            </CardHeader>
            
            <CardContent className="p-0">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground space-y-3">
                        <div className="animate-spin text-2xl">⏳</div>
                        <p>Cargando lista de asistencia...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                        <p className="text-4xl mb-2">📭</p>
                        <p>No se encontraron alumnos inscritos en este grupo.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {students.map((student) => (
                        <div key={student.idAlumno} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-3">
                            
                            {/* Información del Alumno */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-sm text-foreground truncate">{student.nombre}</p>
                                    {student.metodo === 'GPS' && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            <MapPin className="w-3 h-3 mr-0.5"/> GPS
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                                    <span>{student.matricula}</span>
                                    <span className="text-slate-300">|</span>
                                    <span>{student.email}</span>
                                </div>
                            </div>
                            
                            {/* Controles de Asistencia */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                <div className="text-xs text-right">
                                    <span className="block text-muted-foreground">Hora Registro</span>
                                    <span className="font-medium text-foreground">{student.hora !== "-" ? student.hora : "--:--"}</span>
                                </div>
                                
                                <button 
                                    onClick={() => handleStatusChange(student)}
                                    disabled={updatingId === student.idAlumno}
                                    className={`w-24 py-1.5 rounded-md text-xs font-bold border shadow-sm transition-all active:scale-95 flex justify-center items-center ${
                                        student.estado === "Presente" ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200" :
                                        student.estado === "Retardo" ? "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200" :
                                        student.estado === "Falta" ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200" :
                                        student.estado === "Justificado" ? "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200" :
                                        "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                                    }`}
                                >
                                    {updatingId === student.idAlumno ? (
                                        <RefreshCw className="w-3 h-3 animate-spin"/>
                                    ) : (
                                        student.estado
                                    )}
                                </button>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}