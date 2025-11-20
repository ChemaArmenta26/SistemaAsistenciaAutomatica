"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { CheckCircle, Clock, MapPin, RefreshCw, AlertTriangle } from "lucide-react"
import { obtenerUbicacion } from "@/utils/geolocation"
import { registrarAsistenciaService } from "@/services/asistencia.service"
import { getClassesTodayService, type ClassItem } from "@/services/clases.service"

interface StudentDashboardProps {
  userName: string
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export function StudentDashboard({ userName, onNavigate, onLogout }: StudentDashboardProps) {
  // Estado para guardar el ID del alumno (recuperado del login)
  const [studentId, setStudentId] = useState<number | null>(null)
  
  // Estado para almacenar la lista de materias
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [loadingActionId, setLoadingActionId] = useState<number | null>(null)
  
  // Estado para saber si ya se registró asistencia en cada clase (success/error)
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
        console.error("Error cargando clases:", err)
        setFetchError(err.message || "No se pudo cargar tu horario.")
      } finally {
        setLoadingClasses(false)
      }
    }

    loadData()
  }, [])

  const handleCheckAttendance = async (classId: number) => {
    if (!studentId) return alert("Error de sesión. Por favor recarga la página.")

    setLoadingActionId(classId)

    try {
      console.log("Solicitando ubicación...")
      const coords = await obtenerUbicacion()

      console.log("Enviando asistencia...", coords)
      const response = await registrarAsistenciaService({
        idAlumno: studentId,
        idGrupo: classId,
        latitud: coords.latitud,
        longitud: coords.longitud,
        precision: coords.presicion
      })

      console.log("Respuesta:", response)
      setAttendanceStatus(prev => ({ ...prev, [classId]: "success" }))
      alert(`${response.message}`) 

    } catch (error: any) {
      console.error("Error:", error)
      setAttendanceStatus(prev => ({ ...prev, [classId]: "error" }))
      alert(`${error.message}`)
    } finally {
      setLoadingActionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header con botón de Cerrar Sesión */}
      <Header userName={userName} onLogout={onLogout} role="student" />

      <main className="max-w-2xl mx-auto p-4 pb-20">
        <div className="space-y-6">
          
          {/* Tarjeta de Bienvenida */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 shadow-sm">
            <CardHeader>
              <CardTitle>Hola, {userName.split(" ")[0]}</CardTitle>
              <CardDescription className="capitalize">
                {new Date().toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long' })}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Sección de Lista de Clases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Tus Clases de Hoy</h2>
              {/* Botón para recargar manualmente si hubo error */}
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
              </Button>
            </div>

            {/* Estado: Cargando */}
            {loadingClasses && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="animate-spin text-3xl mb-3">⏳</div>
                <p>Cargando tu horario...</p>
              </div>
            )}

            {/* Estado: Error de conexión */}
            {!loadingClasses && fetchError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                    <p className="font-semibold">Hubo un problema</p>
                    <p className="text-sm">{fetchError}</p>
                </div>
              </div>
            )}

            {/* Estado: Sin clases hoy */}
            {!loadingClasses && !fetchError && classes.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/30">
                <p>No tienes clases programadas para hoy.</p>
              </div>
            )}

            {/* Lista de Tarjetas */}
            {!loadingClasses && classes.map((cls) => {
              const isSuccess = attendanceStatus[cls.id] === "success"
              const isError = attendanceStatus[cls.id] === "error"
              const isLoading = loadingActionId === cls.id
              
              return (
                <Card 
                    key={cls.id} 
                    className={`transition-all duration-300 ${
                        isSuccess ? 'border-green-500 bg-green-50/40 shadow-md' : 
                        isError ? 'border-red-200 bg-red-50/20' : 
                        'hover:border-primary/50 hover:shadow-md'
                    }`}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground leading-tight">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{cls.instructor}</p>
                      </div>
                      <span className="text-xs font-semibold bg-secondary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap border border-secondary/20">
                        {cls.time}
                      </span>
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground mb-5">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary" /> 
                      Aula: <span className="font-medium ml-1 text-foreground">{cls.room}</span>
                    </div>
                    
                    <Button
                      onClick={() => handleCheckAttendance(cls.id)}
                      className={`w-full font-medium transition-all ${
                        isSuccess ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-200 ring-offset-1" : ""
                      }`}
                      variant={isSuccess ? "default" : "default"}
                      size="lg"
                      disabled={isSuccess || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Verificando ubicación...
                        </>
                      ) : isSuccess ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
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
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}