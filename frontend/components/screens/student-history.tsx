"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { ChevronLeft, CheckCircle, X, AlertCircle, FileCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { 
    getStudentStatsService, 
    getSubjectHistoryService, 
    type StudentSubjectStats, 
    type AttendanceRecord 
} from "@/services/student.service"

interface StudentHistoryProps {
  userName: string
  onNavigate: (screen: string, params?: any) => void
  onLogout: () => void
}

export function StudentHistory({ userName, onNavigate, onLogout }: StudentHistoryProps) {
  const [subjects, setSubjects] = useState<StudentSubjectStats[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  const [selectedSubject, setSelectedSubject] = useState<StudentSubjectStats | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
        try {
            setLoadingSubjects(true)
            const data = await getStudentStatsService()
            setSubjects(data)
        } catch (error: any) {
            toast.error("Error al cargar estadísticas", { description: error.message })
        } finally {
            setLoadingSubjects(false)
        }
    }
    fetchStats()
  }, [])

  const handleSubjectClick = async (subject: StudentSubjectStats) => {
      try {
          setSelectedSubject(subject)
          setLoadingHistory(true)
          const records = await getSubjectHistoryService(subject.id) 
          setHistory(records)
      } catch (error: any) {
          toast.error("Error al cargar historial", { description: error.message })
          setSelectedSubject(null) 
      } finally {
          setLoadingHistory(false)
      }
  }

  const handleBackToSubjects = () => {
      setSelectedSubject(null)
      setHistory([])
  }

  const renderStatusIcon = (status: string) => {
      const s = status.toLowerCase()
      if (s === 'presente' || s === 'registrada') return <CheckCircle className="w-5 h-5 text-green-600" />
      if (s === 'retardo') return <AlertCircle className="w-5 h-5 text-orange-500" />
      if (s === 'justificado') return <FileCheck className="w-5 h-5 text-blue-500" />
      return <X className="w-5 h-5 text-red-600" /> 
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="student" />

      <main className="max-w-2xl mx-auto p-4 pb-20">
        <Button variant="ghost" size="sm" onClick={() => onNavigate("student-dashboard")} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver al Inicio
        </Button>

        <h1 className="text-2xl font-bold mb-6">Historial Académico</h1>

        {/*LISTA DE MATERIAS */}
        {!selectedSubject ? (
          <div className="space-y-3">
            {loadingSubjects ? (
                <div className="text-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Cargando materias...</p>
                </div>
            ) : subjects.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-muted/20">
                    <p>No hay registros de asistencia aún.</p>
                </div>
            ) : (
                subjects.map((subject) => (
                <Card
                    key={subject.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.99]"
                    onClick={() => handleSubjectClick(subject)}
                >
                    <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                        <h3 className="font-semibold text-foreground">{subject.name}</h3>
                        <p className="text-sm text-muted-foreground">{subject.instructor}</p>
                        </div>
                        <div className="text-right shrink-0">
                        <div className={`text-xl font-bold ${subject.percentage < 80 ? 'text-red-500' : 'text-primary'}`}>
                            {subject.percentage}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                             {subject.attendance} ✅ · {subject.late} 🕒
                        </div>
                        </div>
                    </div>
                    {/* Barra de Progreso Visual */}
                    <div className="w-full bg-secondary/30 h-2 rounded-full mt-3 overflow-hidden">
                        <div 
                            className={`h-full ${subject.percentage < 80 ? 'bg-red-500' : 'bg-primary'}`} 
                            style={{ width: `${subject.percentage}%` }} 
                        />
                    </div>
                    </CardContent>
                </Card>
                ))
            )}
          </div>
        ) : (
          /* DETALLE DE HISTORIAL */
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={handleBackToSubjects} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Ver otras materias
            </Button>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">{selectedSubject.name}</CardTitle>
                <div className="text-sm text-muted-foreground flex gap-4">
                    <span>Prof. {selectedSubject.instructor}</span>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-2">
              {loadingHistory ? (
                   <div className="text-center py-10">
                       <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                   </div>
              ) : history.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay asistencias registradas para esta materia.</p>
              ) : (
                  history.map((record, idx) => (
                    <Card key={`${record.id}-${idx}`} className="border-l-4 border-l-primary/50">
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        {renderStatusIcon(record.status)}
                        <div>
                            <div className="font-medium capitalize">
                                {new Date(record.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-sm text-muted-foreground capitalize">
                                {record.status}
                            </div>
                        </div>
                        </div>
                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {record.time}
                        </span>
                    </CardContent>
                    </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}