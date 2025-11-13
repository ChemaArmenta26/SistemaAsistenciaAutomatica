"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Users, TrendingUp } from "lucide-react"

interface TeacherDashboardProps {
  userName: string
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export function TeacherDashboard({ userName, onNavigate, onLogout }: TeacherDashboardProps) {
  const myCourses = [
    {
      id: 1,
      name: "Desarrollo Web Avanzado",
      section: "Sección A",
      students: 25,
      avgAttendance: 87,
      schedule: "Lunes, Miércoles, Viernes 10:00 AM",
    },
    {
      id: 2,
      name: "Base de Datos II",
      section: "Sección B",
      students: 22,
      avgAttendance: 92,
      schedule: "Martes, Jueves 12:00 PM",
    },
    {
      id: 3,
      name: "Seguridad Informática",
      section: "Sección A",
      students: 20,
      avgAttendance: 85,
      schedule: "Lunes, Miércoles 2:00 PM",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="teacher" />

      <main className="max-w-2xl mx-auto p-4 pb-20">
        <div className="space-y-4">
          {/* Welcome Section */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle>Bienvenido, {userName}</CardTitle>
              <CardDescription>Gestiona tus cursos y asistencias</CardDescription>
            </CardHeader>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total de Estudiantes</span>
                </div>
                <div className="text-2xl font-bold">67</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-xs text-muted-foreground">Asistencia Promedio</span>
                </div>
                <div className="text-2xl font-bold">88%</div>
              </CardContent>
            </Card>
          </div>

          {/* My Courses */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Mis Cursos</h2>
            {myCourses.map((course) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:border-primary/50 transition-colors border-l-4 border-l-primary"
              >
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{course.name}</h3>
                      <p className="text-sm text-muted-foreground">{course.section}</p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {course.students} alumnos
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{course.schedule}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      <span className="font-medium text-primary">{course.avgAttendance}%</span>
                      <span className="text-muted-foreground ml-1">Asistencia Promedio</span>
                    </div>
                  </div>
                  <Button onClick={() => onNavigate("teacher-attendance")} size="sm" className="w-full">
                    Ver Asistencias
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
