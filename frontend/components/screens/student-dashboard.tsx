"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { CheckCircle, Clock, MapPin, RefreshCw, AlertTriangle, CalendarDays } from "lucide-react"
import { obtenerUbicacion } from "@/utils/geolocation"
import { registrarAsistenciaService } from "@/services/asistencia.service"
import { getClassesTodayService, type ClassItem } from "@/services/clases.service"
import { toast } from "sonner"

interface StudentDashboardProps {
  userName: string
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export function StudentDashboard({ userName, onNavigate, onLogout }: StudentDashboardProps) {
  const [studentId, setStudentId] = useState<number | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: number]: "success" | "error" }>({})

  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = localStorage.getItem("user")
        if (!userStr) return
        const user = JSON.parse(userStr)
        setStudentId(user.id)
        const data = await getClassesTodayService(user.id)
        setClasses(data)
      } catch (err: any) {
        setFetchError(err.message || "No se pudo cargar tu horario.")
        toast.error("Error cargando horario", { description: err.message })
      } finally {
        setLoadingClasses(false)
      }
    }
    loadData()
  }, [])

  const handleCheckAttendance = async (classId: number) => {
    if (!studentId) return toast.error("Error de sesión", { description: "Recarga la página" })

    setLoadingActionId(classId)

    const promesaAsistencia = async () => {

      const coords = await obtenerUbicacion()

      const response = await registrarAsistenciaService({
        idAlumno: studentId,
        idGrupo: classId,
        latitud: coords.latitud,
        longitud: coords.longitud,
        precision: coords.presicion
      })
      return response
    }

    toast.promise(promesaAsistencia(), {
      loading: 'Obteniendo ubicación y validando...',
      success: (data) => {
        setAttendanceStatus(prev => ({ ...prev, [classId]: "success" }))
        return `¡Asistencia Registrada!`
      },
      error: (err) => {
        setAttendanceStatus(prev => ({ ...prev, [classId]: "error" }))
        return `${err.message}` 
      },
      finally: () => {
        setLoadingActionId(null)
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="student" />

      <main className="max-w-2xl mx-auto p-4 pb-20">
        <div className="space-y-6">
          
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                    <CalendarDays className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Hola, {userName.split(" ")[0]}</CardTitle>
                    <CardDescription className="capitalize">
                        {new Date().toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long' })}
                    </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Tus Clases de Hoy</h2>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
              </Button>
            </div>

            {loadingClasses && (
              <div className="text-center py-12 text-muted-foreground space-y-3">
                <div className="animate-spin text-3xl">⏳</div>
                <p>Cargando tu horario...</p>
              </div>
            )}

            {!loadingClasses && fetchError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                    <p className="font-semibold">Hubo un problema</p>
                    <p className="text-sm">{fetchError}</p>
                </div>
              </div>
            )}

            {!loadingClasses && !fetchError && classes.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/30">
                <p className="text-3xl mb-2">😴</p>
                <p className="font-medium">No tienes clases programadas para hoy.</p>
              </div>
            )}

            {!loadingClasses && classes.map((cls) => {
              const isSuccess = attendanceStatus[cls.id] === "success"
              const isError = attendanceStatus[cls.id] === "error"
              const isLoading = loadingActionId === cls.id
              
              return (
                <Card 
                    key={cls.id} 
                    className={`transition-all duration-300 ${
                        isSuccess ? 'border-green-500 bg-green-50/40 shadow-sm' : 
                        isError ? 'border-red-300 bg-red-50/30' : 
                        'hover:border-primary/50 hover:shadow-md'
                    }`}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground leading-tight">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">{cls.instructor}</p>
                      </div>
                      <span className="text-xs font-semibold bg-secondary/10 text-primary px-3 py-1 rounded-full whitespace-nowrap border border-secondary/20">
                        {cls.time}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground mb-5">
                      <MapPin className="w-4 h-4 mr-1.5 text-primary" /> 
                      Aula: <span className="font-semibold ml-1 text-foreground">{cls.room}</span>
                    </div>
                    
                    <Button
                      onClick={() => handleCheckAttendance(cls.id)}
                      className={`w-full font-medium transition-all shadow-sm ${
                        isSuccess ? "bg-green-600 hover:bg-green-700 text-white" : ""
                      }`}
                      variant={isSuccess ? "default" : isError ? "destructive" : "default"}
                      size="lg"
                      disabled={isSuccess || isLoading}
                    >
                      {isLoading ? (
                        <>Verificando ubicación...</>
                      ) : isSuccess ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" /> Asistencia Registrada
                        </>
                      ) : isError ? (
                        <>Reintentar Asistencia</>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-2" /> Registrar Asistencia
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}