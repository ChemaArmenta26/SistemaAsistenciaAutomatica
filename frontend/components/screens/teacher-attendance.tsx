"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { ChevronLeft, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TeacherAttendanceProps {
  userName: string
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export function TeacherAttendance({ userName, onNavigate, onLogout }: TeacherAttendanceProps) {
  const [selectedDate, setSelectedDate] = useState("2024-11-08")
  const [selectedCourse, setSelectedCourse] = useState("Desarrollo Web Avanzado")

  const attendanceData = [
    { id: 1, name: "Juan Pérez García", enrollment: "20210234", status: "presente", time: "10:05" },
    { id: 2, name: "María López Rodríguez", enrollment: "20210235", status: "presente", time: "10:02" },
    { id: 3, name: "Carlos Sánchez Martínez", enrollment: "20210236", status: "ausente", time: "-" },
    { id: 4, name: "Ana Gómez Flores", enrollment: "20210237", status: "presente", time: "10:12" },
    { id: 5, name: "Roberto Díaz Ruiz", enrollment: "20210238", status: "presente", time: "10:08" },
    { id: 6, name: "Laura Fernández Cruz", enrollment: "20210239", status: "presente", time: "10:00" },
    { id: 7, name: "David Morales Ramos", enrollment: "20210240", status: "ausente", time: "-" },
    { id: 8, name: "Sofia García López", enrollment: "20210241", status: "presente", time: "10:04" },
  ]

  const presentCount = attendanceData.filter((s) => s.status === "presente").length
  const absentCount = attendanceData.length - presentCount
  const percentage = Math.round((presentCount / attendanceData.length) * 100)

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="teacher" />

      <main className="max-w-4xl mx-auto p-4 pb-20">
        <Button variant="ghost" size="sm" onClick={() => onNavigate("teacher-dashboard")} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Atrás a Cursos
        </Button>

        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registros de Asistencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Curso</label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Desarrollo Web Avanzado">Desarrollo Web Avanzado</SelectItem>
                      <SelectItem value="Base de Datos II">Base de Datos II</SelectItem>
                      <SelectItem value="Seguridad Informática">Seguridad Informática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-primary">{presentCount}</div>
                <div className="text-xs text-muted-foreground">Presentes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-destructive">{absentCount}</div>
                <div className="text-xs text-muted-foreground">Ausentes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-accent">{percentage}%</div>
                <div className="text-xs text-muted-foreground">Asistencia</div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Alumnos ({attendanceData.length})</CardTitle>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendanceData.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.enrollment}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{student.time}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          student.status === "presente"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                        }`}
                      >
                        {student.status === "presente" ? "Presente" : "Ausente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
