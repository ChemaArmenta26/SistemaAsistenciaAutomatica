"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { ChevronLeft, Calendar, Clock, MapPin } from "lucide-react"
import { getTeacherScheduleService, type ScheduleItem } from "@/services/maestro.service"
import { toast } from "sonner"

interface TeacherScheduleProps {
  userName: string
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export function TeacherSchedule({ userName, onNavigate, onLogout }: TeacherScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await getTeacherScheduleService()
        setSchedule(data)
      } catch (error) {
        toast.error("Error cargando horario")
      } finally {
        setLoading(false)
      }
    }
    loadSchedule()
  }, [])

  // Días de la semana para las columnas
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  
  // Generar horas para las filas (de 7:00 a 20:00)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  // Función para encontrar clase en un día y hora específicos
  const getClassForSlot = (dayIndex: number, hour: number) => {
    // dayIndex + 1 porque en BD Lunes es 1
    const targetDay = dayIndex + 1 
    
    return schedule.find(c => {
      const startH = parseInt(c.horaInicio.split(":")[0])
      return c.dia === targetDay && startH === hour
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="teacher" />

      <main className="max-w-6xl mx-auto p-4 pb-20">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => onNavigate("teacher-dashboard")}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver al Dashboard
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" /> Mi Horario Semanal
            </h1>
        </div>

        {loading ? (
            <div className="text-center py-20 animate-pulse">Cargando horario...</div>
        ) : (
            <Card className="overflow-hidden border shadow-md">
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Cabecera Días */}
                        <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-muted/50 border-b">
                            <div className="p-3 text-center text-sm font-bold text-muted-foreground border-r">Hora</div>
                            {days.map(day => (
                                <div key={day} className="p-3 text-center text-sm font-bold border-r last:border-r-0">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Cuerpo Horas */}
                        {hours.map(hour => (
                            <div key={hour} className="grid grid-cols-[80px_repeat(6,1fr)] border-b last:border-b-0">
                                {/* Columna Hora */}
                                <div className="p-3 text-center text-xs font-medium text-muted-foreground border-r flex items-center justify-center bg-muted/10">
                                    {`${hour}:00`}
                                </div>

                                {/* Celdas Días */}
                                {days.map((_, dayIndex) => {
                                    const clase = getClassForSlot(dayIndex, hour)
                                    return (
                                        <div key={dayIndex} className="min-h-[80px] p-1 border-r last:border-r-0 relative group">
                                            {clase ? (
                                                <div className="h-full w-full bg-primary/10 border-l-4 border-primary rounded-r-md p-2 flex flex-col justify-between hover:bg-primary/20 transition-colors cursor-default">
                                                    <span className="text-xs font-bold text-primary leading-tight line-clamp-2">
                                                        {clase.materia}
                                                    </span>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <MapPin className="w-3 h-3 text-muted-foreground" />
                                                        <span className="text-[10px] font-semibold text-muted-foreground">
                                                            {clase.aula}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full w-full bg-transparent" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        )}
      </main>
    </div>
  )
}