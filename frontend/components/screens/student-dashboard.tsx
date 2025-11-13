"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { CheckCircle, Clock } from "lucide-react"

interface StudentDashboardProps {
  userName: string
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export function StudentDashboard({ userName, onNavigate, onLogout }: StudentDashboardProps) {
  const [attendanceChecked, setAttendanceChecked] = useState(false)

  const currentClasses = [
    { id: 1, name: "Desarrollo Web Avanzado", instructor: "Dr. García López", time: "10:00 AM", room: "Lab 201" },
    { id: 2, name: "Base de Datos II", instructor: "Ing. Martínez", time: "12:00 PM", room: "Aula 105" },
  ]

  const handleCheckAttendance = () => {
    setAttendanceChecked(true)
    setTimeout(() => setAttendanceChecked(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="student" />

      <main className="max-w-2xl mx-auto p-4 pb-20">
        <div className="space-y-4">
          {/* Welcome Section */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle>Bienvenido, {userName}</CardTitle>
              <CardDescription>Hoy es {new Date().toLocaleDateString("es-MX")}</CardDescription>
            </CardHeader>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-primary">18</div>
                <div className="text-xs text-muted-foreground">Presentes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-accent">2</div>
                <div className="text-xs text-muted-foreground">Faltas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-secondary">90%</div>
                <div className="text-xs text-muted-foreground">Asistencia</div>
              </CardContent>
            </Card>
          </div>

          {/* Current Classes */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Clases de Hoy</h2>
            {currentClasses.map((cls) => (
              <Card key={cls.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">{cls.instructor}</p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{cls.time}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">Aula: {cls.room}</div>
                  <Button
                    onClick={handleCheckAttendance}
                    className="w-full"
                    variant={attendanceChecked ? "outline" : "default"}
                  >
                    {attendanceChecked ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Asistencia Registrada
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Registrar Asistencia
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2 pt-4">
            <Button variant="secondary" onClick={() => onNavigate("student-history")} className="w-full justify-center">
              Ver Historial Completo
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
