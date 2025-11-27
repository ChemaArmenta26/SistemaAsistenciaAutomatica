"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Users, Clock, MapPin, ArrowRight } from "lucide-react"
import { getTeacherClassesByDateService, type TeacherClassItem } from "@/services/maestro.service"
import { toast } from "sonner"

interface TeacherDashboardProps {
  userName: string
  onNavigate: (screen: string, params?: any) => void
  onLogout: () => void
}

const getLocalDateStr = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 10);
  return localISOTime;
}

export function TeacherDashboard({ userName, onNavigate, onLogout }: TeacherDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr())
  const [classes, setClasses] = useState<TeacherClassItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          toast.error("No hay sesión de usuario");
          return;
        }
        const user = JSON.parse(userStr);
        const teacherId = user.id;

        const data = await getTeacherClassesByDateService(teacherId, selectedDate)
        setClasses(data)
      } catch (err: any) {
        toast.error("Error al cargar tus cursos")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="teacher" />

      <main className="max-w-3xl mx-auto p-4 pb-20">
        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle>Bienvenido, {userName}</CardTitle>
              <CardDescription>Gestiona tus cursos y asistencias de hoy</CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Tus Cursos de Hoy
            </h2>

            {loading ? (
              <div className="text-center py-10 text-muted-foreground animate-pulse">Cargando cursos...</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                <p className="text-xl mb-2">📅</p>
                <p>No tienes clases asignadas para hoy.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {classes.map((course) => (
                  <Card
                    key={course.id}
                    className="hover:border-primary/50 transition-all border-l-4 border-l-primary shadow-sm"
                  >
                    <CardContent className="pt-6">
                      <div className="mb-4">
                        <h3 className="font-bold text-lg leading-tight mb-1">{course.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" /> Aula: {course.room}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed">
                        <div className="flex items-center gap-1.5 text-sm font-medium bg-secondary/10 px-2 py-1 rounded text-primary">
                          <Clock className="w-3.5 h-3.5" /> {course.time}
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 cursor-pointer"
                          onClick={() => onNavigate("teacher-attendance", { courseId: course.id })}>
                          Ver Lista <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}