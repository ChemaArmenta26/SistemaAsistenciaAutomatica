"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { ChevronLeft, Download, RefreshCw, User, CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ReportModal } from "@/components/reports/report-modal"
import {
  getTeacherClassesByDateService,
  getGroupAttendanceListService,
  updateManualAttendanceService,
  type StudentAttendanceItem,
  type TeacherClassItem
} from "@/services/maestro.service"

const getLocalDateStr = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 10);
  return localISOTime;
}

interface TeacherAttendanceProps {
  userName: string
  onNavigate: (screen: string, params?: any) => void
  onLogout: () => void
  initialCourseId?: number
}

export function TeacherAttendance({ userName, onNavigate, onLogout, initialCourseId }: TeacherAttendanceProps) {
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr())
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId ? initialCourseId.toString() : "")

  const [courses, setCourses] = useState<TeacherClassItem[]>([])
  const [students, setStudents] = useState<StudentAttendanceItem[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)

  useEffect(() => {
    const loadCoursesForDate = async () => {
      try {
        setLoadingCourses(true);
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const teacherId = user.id;

        const data = await getTeacherClassesByDateService(teacherId, selectedDate)
        setCourses(data)

        if (selectedCourseId) {
          const courseStillExists = data.find(c => c.id.toString() === selectedCourseId);
          if (!courseStillExists) {
            setSelectedCourseId("");
            setStudents([]);
          } else if (initialCourseId && data.some(c => c.id === initialCourseId)) {
            setSelectedCourseId(initialCourseId.toString());
        }
        }
      } catch (e) {
        console.error(e)
        toast.error("Error cargando cursos")
        setCourses([])
      } finally {
        setLoadingCourses(false)
      }
    }
    loadCoursesForDate()
  }, [selectedDate])

  const fetchAttendance = useCallback(async () => {
    if (!selectedCourseId) return;

    setLoadingList(true)
    try {
      const data = await getGroupAttendanceListService(Number(selectedCourseId), selectedDate)
      setStudents(data)
    } catch (error: any) {
      toast.error("Error cargando lista")
    } finally {
      setLoadingList(false)
    }
  }, [selectedCourseId, selectedDate]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchAttendance()
    }
  }, [fetchAttendance])

  // Polling automático (5 seg)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (selectedCourseId && !loadingList) {
        intervalId = setInterval(() => {
            // Solo refrescamos si no estamos editando visualmente a alguien
            if (updatingId === null) {
                getGroupAttendanceListService(Number(selectedCourseId), selectedDate)
                    .then(data => setStudents(data))
                    .catch(e => console.error("Polling error", e));
            }
        }, 5000); 
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [selectedCourseId, selectedDate, loadingList, updatingId]);

  const handleStatusChange = async (student: StudentAttendanceItem) => {
    const statesMap: Record<string, string> = {
      'Pendiente': 'Presente',
      'Presente': 'Retardo',
      'Retardo': 'Falta',
      'Falta': 'Justificado',
      'Justificado': 'Presente'
    }

    const nextState = statesMap[student.estado || 'Pendiente'] || 'Presente';
    setUpdatingId(student.idAlumno)

    // Actualización visual inmediata
    setStudents(prev => prev.map(s => s.idAlumno === student.idAlumno ? { ...s, estado: nextState as any } : s))

    try {
      await updateManualAttendanceService({
        idAlumno: student.idAlumno,
        idGrupo: Number(selectedCourseId),
        fecha: selectedDate,
        estado: nextState
      })
      toast.success("Actualizado")
    } catch (e) {
      toast.error("Error al actualizar")
      fetchAttendance() // Revertir en caso de error de red real
    } finally {
      setUpdatingId(null)
    }
  }

  const presentCount = students.filter((s) => s.estado === "Presente" || s.estado === "Retardo").length
  const absentCount = students.filter((s) => s.estado === "Falta").length
  const percentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0
  const currentCourseName = courses.find(c => c.id.toString() === selectedCourseId)?.name || "Curso";

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="teacher" />

      <main className="max-w-4xl mx-auto p-4 pb-20">
        <Button variant="ghost" size="sm" onClick={() => onNavigate("teacher-dashboard")} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>

        <div className="space-y-6">
          <Card className="shadow-sm border-l-4 border-l-primary">
            <CardHeader className="pb-3 border-b mb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Gestión de Asistencia</span>
                <div className="flex gap-2">
                    {selectedCourseId && (
                        <Button variant="secondary" size="sm" onClick={() => setIsReportOpen(true)}>
                            <Download className="w-3 h-3 mr-2" /> Reporte PDF
                        </Button>
                    )}
                    {selectedCourseId && (
                      <Button variant="outline" size="sm" onClick={fetchAttendance} disabled={loadingList}>
                        <RefreshCw className={`w-3 h-3 mr-2 ${loadingList ? 'animate-spin' : ''}`} /> Actualizar
                      </Button>
                    )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> Fecha de Clase
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">
                    Seleccionar Curso ({courses.length})
                  </label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={loadingCourses}>
                    <SelectTrigger className="w-full h-10 bg-background border-input">
                      <SelectValue placeholder={loadingCourses ? "Cargando..." : courses.length === 0 ? "Sin clases este día" : "Selecciona un curso"} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">No hay clases programadas.</div>
                      ) : (
                        courses.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.time})</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedCourseId && (
            <div className="grid grid-cols-3 gap-3">
              <Card><CardContent className="flex flex-col items-center justify-center p-4"><span className="text-3xl font-bold text-green-600">{presentCount}</span><span className="text-xs font-medium text-muted-foreground uppercase">Asistencias</span></CardContent></Card>
              <Card><CardContent className="flex flex-col items-center justify-center p-4"><span className="text-3xl font-bold text-red-500">{absentCount}</span><span className="text-xs font-medium text-muted-foreground uppercase">Faltas</span></CardContent></Card>
              <Card><CardContent className="flex flex-col items-center justify-center p-4"><span className="text-3xl font-bold text-blue-600">{percentage}%</span><span className="text-xs font-medium text-muted-foreground uppercase">Participación</span></CardContent></Card>
            </div>
          )}

          {selectedCourseId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20 border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><User className="w-4 h-4" /> Listado de Alumnos ({students.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingList ? (
                  <div className="py-12 flex justify-center"><div className="animate-spin text-2xl">⏳</div></div>
                ) : students.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No hay alumnos.</div>
                ) : (
                  <div className="divide-y">
                    {students.map((student) => (
                      <div key={student.idAlumno} className="flex flex-row sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-3">
                        <div className="flex-1"><p className="font-semibold text-sm">{student.nombre}</p><p className="text-xs text-muted-foreground">{student.matricula}</p></div>
                        <button
                          onClick={() => handleStatusChange(student)}
                          className={`w-24 py-1.5 rounded-md text-xs font-bold border transition-all active:scale-95 ${
                            student.estado === "Presente" ? "bg-green-100 text-green-800 border-green-200" :
                            student.estado === "Retardo" ? "bg-orange-100 text-orange-800 border-orange-200" :
                            student.estado === "Falta" ? "bg-red-100 text-red-800 border-red-200" :
                            student.estado === "Justificado" ? "bg-blue-100 text-blue-800 border-blue-200" :
                            "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {updatingId === student.idAlumno ? 
                            <RefreshCw className="w-3 h-3 animate-spin mx-auto" /> : 
                            (student.estado)
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} courseId={selectedCourseId ? Number(selectedCourseId) : null} courseName={currentCourseName} />
      </main>
    </div>
  )
}