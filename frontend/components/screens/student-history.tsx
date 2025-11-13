"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { ChevronLeft, CheckCircle, X } from "lucide-react"

interface StudentHistoryProps {
  userName: string
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export function StudentHistory({ userName, onNavigate, onLogout }: StudentHistoryProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  const subjects = [
    {
      id: 1,
      name: "Desarrollo Web Avanzado",
      instructor: "Dr. García López",
      attendance: 18,
      absences: 2,
      percentage: 90,
    },
    {
      id: 2,
      name: "Base de Datos II",
      instructor: "Ing. Martínez",
      attendance: 20,
      absences: 0,
      percentage: 100,
    },
    {
      id: 3,
      name: "Seguridad Informática",
      instructor: "Lic. Ramírez",
      attendance: 17,
      absences: 3,
      percentage: 85,
    },
  ]

  const attendanceRecords = [
    { date: "2024-11-08", status: "presente", time: "10:05 AM" },
    { date: "2024-11-07", status: "presente", time: "10:02 AM" },
    { date: "2024-11-06", status: "presente", time: "10:15 AM" },
    { date: "2024-11-05", status: "ausente", time: "-" },
    { date: "2024-11-04", status: "presente", time: "10:00 AM" },
    { date: "2024-11-01", status: "presente", time: "10:08 AM" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="student" />

      <main className="max-w-2xl mx-auto p-4 pb-20">
        <Button variant="ghost" size="sm" onClick={() => onNavigate("student-dashboard")} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>

        <h1 className="text-2xl font-bold mb-6">Historial de Asistencias</h1>

        {!selectedSubject ? (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <Card
                key={subject.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedSubject(subject.name)}
              >
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">{subject.instructor}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{subject.percentage}%</div>
                      <div className="text-xs text-muted-foreground">
                        {subject.attendance} presentes, {subject.absences} ausentes
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${subject.percentage}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSubject(null)} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Atrás a Materias
            </Button>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>{selectedSubject}</CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-2">
              {attendanceRecords.map((record, idx) => (
                <Card key={idx} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {record.status === "presente" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">{record.date}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.status === "presente" ? "Presente" : "Ausente"}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{record.time}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
