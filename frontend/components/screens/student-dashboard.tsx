"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header" 
import { CheckCircle, Clock, MapPin, RefreshCw, AlertTriangle, CalendarDays, AlertCircle, FileCheck, XCircle, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { obtenerUbicacion } from "@/utils/geolocation"
import { registrarAsistenciaService } from "@/services/asistencia.service"
import { getClassesTodayService, type ClassItem } from "@/services/clases.service"

interface StudentDashboardProps {
  userName: string
  onNavigate: (screen: string, params?: any) => void
  onLogout: () => void
}

export function StudentDashboard({ userName, onNavigate, onLogout }: StudentDashboardProps) {
  const [studentId, setStudentId] = useState<number | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null)
  
  // ESTADO VISUAL: Guarda qué botones están verdes/rojos localmente
  const [localStatusUpdates, setLocalStatusUpdates] = useState<{[key: number]: string}>({})

  const loadData = async () => {
    setLocalStatusUpdates({})
    setFetchError(null)
    setClasses([]) 
    
    try {
      setLoadingClasses(true)

      const userStr = localStorage.getItem("user")
      if (!userStr) throw new Error("Sesión no encontrada")
      
      const user = JSON.parse(userStr)
      const currentId = user.id
      setStudentId(currentId)

      const data = await getClassesTodayService(currentId)
      setClasses(data)

    } catch (err: any) {
      console.error(err)
      setFetchError(err.message || "No se pudo cargar tu horario.")
      // Si no hay sesión, sacarlo al login
      if (err.message === "Sesión no encontrada") onLogout()
    } finally {
      setLoadingClasses(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userName])


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
      loading: 'Verificando ubicación y horario...',
      
      success: (data: any) => {
        const nuevoEstado = data.estadoFinal || data.asistencia?.estado || 'Registrada';
        setLocalStatusUpdates(prev => ({ ...prev, [classId]: nuevoEstado }))
        setTimeout(() => loadData(), 1000)
        return data.message || data.mensaje || `¡Asistencia Registrada!`
      },

      error: (err: any) => {
        const msg = (err.message || "").toLowerCase();

        // CASO 1: Ubicación
        if (msg.includes("lejos") || msg.includes("rango") || msg.includes("ubicación")) {
            return (
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-base flex items-center">
                        📍 Ubicación Incorrecta
                    </span>
                    <span className="text-sm">
                        No estás en el aula correspondiente. Acércate más e intenta de nuevo.
                    </span>
                </div>
            );
        }

        // CASO 2: Horario
        if (msg.includes("horario") || msg.includes("hora")) {
            return (
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-base flex items-center">
                        🕒 Fuera de Horario
                    </span>
                    <span className="text-sm">
                        La clase no está activa en este momento. Revisa tu horario.
                    </span>
                </div>
            );
        }

        // CASO 3: Duplicado
        if (msg.includes("ya registraste") || msg.includes("duplicada")) {
             return "✅ Ya has registrado tu asistencia el día de hoy.";
        }

        // CASO 4: Permisos GPS
        if (msg.includes("permiso") || msg.includes("denied") || msg.includes("geolocalización")) {
            return (
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-base">🌍 GPS Desactivado</span>
                    <span className="text-sm">
                        Necesitas dar permiso de ubicación a tu navegador para registrar asistencia.
                    </span>
                </div>
            );
        }

        return err.message || "No se pudo registrar la asistencia.";
      },
      finally: () => {
        setLoadingActionId(null)
      }
    })
  }

  const getStatusStyles = (status: string | null) => {
    const s = status?.toLowerCase() || '';

    if (s === 'registrada' || s === 'presente') return { 
        cardBorder: 'border-green-500 bg-green-50/30 shadow-sm', 
        btnVariant: "default" as const, 
        btnClass: 'bg-green-600 hover:bg-green-700 text-white opacity-100 cursor-not-allowed',
        icon: <CheckCircle className="w-5 h-5 mr-2" />,
        text: 'Asistencia Registrada'
    };

    if (s === 'retardo') return { 
        cardBorder: 'border-orange-400 bg-orange-50/40', 
        btnVariant: "default" as const,
        btnClass: 'bg-orange-500 hover:bg-orange-600 text-white opacity-100 cursor-not-allowed',
        icon: <AlertCircle className="w-5 h-5 mr-2" />,
        text: 'Registrado con Retardo'
    };
    
    if (s === 'justificado') return {
        cardBorder: 'border-blue-400 bg-blue-50/40', 
        btnVariant: "default" as const,
        btnClass: 'bg-blue-500 hover:bg-blue-600 text-white opacity-100 cursor-not-allowed',
        icon: <FileCheck className="w-5 h-5 mr-2" />,
        text: 'Asistencia Justificada'
    };

    if (s === 'falta' || s === 'ausente') return {
        cardBorder: 'border-red-500 bg-red-50/30', 
        btnVariant: "destructive" as const,
        btnClass: 'opacity-100 cursor-not-allowed',
        icon: <XCircle className="w-5 h-5 mr-2" />,
        text: 'Falta Registrada'
    };

     return { 
        cardBorder: 'hover:border-primary/50 hover:shadow-md', 
        btnVariant: "default" as const,
        btnClass: '',
        icon: <Clock className="w-4 h-4 mr-2" />,
        text: 'Registrar Asistencia'
    };
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} role="student" />

      <main className="max-w-2xl mx-auto p-4 pb-20">
        <div className="space-y-6">
          
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
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
                  
                  <Button variant="outline" size="sm" onClick={() => onNavigate("student-history")}>
                    <BookOpen className="w-4 h-4 mr-2"/> Historial
                  </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Tus Clases de Hoy</h2>
              <Button variant="ghost" size="sm" onClick={loadData} disabled={loadingClasses}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loadingClasses ? 'animate-spin' : ''}`} /> 
                Actualizar
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
              // Priorizamos la actualización local (instantánea) sobre la de la BD
              const currentStatus = localStatusUpdates[cls.id] || cls.attendanceStatus;
              
              const styles = getStatusStyles(currentStatus);
              const isLoading = loadingActionId === cls.id;
              
              // Bloqueamos el botón si ya tiene estado o si está cargando
              const isActionDisabled = !!currentStatus || isLoading;
              
              return (
                <Card 
                    key={cls.id} 
                    className={`transition-all duration-300 ${styles.cardBorder}`}
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
                      className={`w-full font-medium transition-all shadow-sm ${styles.btnClass}`}
                      variant={styles.btnVariant}
                      size="lg"
                      disabled={isActionDisabled}
                    >
                      {isLoading ? (
                        <>Verificando ubicación...</>
                      ) : (
                        <>
                          {styles.icon} {styles.text}
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