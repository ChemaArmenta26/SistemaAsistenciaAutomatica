"use client"

import { useState, useEffect } from "react"
import { LoginScreen } from "@/components/screens/login-screen"
import { StudentDashboard } from "@/components/screens/student-dashboard"
import { TeacherDashboard } from "@/components/screens/teacher-dashboard"
import { TeacherAttendance } from "@/components/screens/teacher-attendance"
import { StudentHistory } from "@/components/screens/student-history"
import { TeacherSchedule } from "@/components/screens/teacher-schedule"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState("login")
  const [user, setUser] = useState<any>(null)

  // 1. Cargar sesión al inicio
  useEffect(() => {
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
        
        // Redirección automática si ya hay sesión
        if (userData.rol === "Maestro") {
          setCurrentScreen("teacher-dashboard")
        } else {
          setCurrentScreen("student-dashboard")
        }
      } catch (e) {
        handleLogout()
      }
    }
  }, [])

  // 2. Funciones de Navegación
  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setCurrentScreen("login")
  }

  // Actualizar el estado del usuario inmediatamente después del login
  const handleLoginSuccess = () => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
        setUser(JSON.parse(userStr))
    }
  }

  // 3. Renderizado de Pantallas
  const renderScreen = () => {
    switch (currentScreen) {
      case "login":
        return (
          <LoginScreen 
            onNavigate={(screen) => {
                handleLoginSuccess() 
                handleNavigate(screen)
            }} 
          />
        )

      // --- ALUMNO ---
      case "student-dashboard":
        return (
          <StudentDashboard
            userName={user?.nombre || "Estudiante"}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      case "student-history":
        return (
          <StudentHistory
            userName={user?.nombre || "Estudiante"}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )

      // --- MAESTRO ---
      case "teacher-dashboard":
        return (
          <TeacherDashboard
            userName={user?.nombre || "Maestro"}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      case "teacher-attendance":
        return (
          <TeacherAttendance
            userName={user?.nombre || "Maestro"}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      case "teacher-schedule":
        return (
          <TeacherSchedule
            userName={user?.nombre || "Maestro"}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )

      default:
        return <div className="flex h-screen items-center justify-center">Cargando...</div>
    }
  }

  return (
    <main className="min-h-screen bg-background font-sans antialiased">
      {renderScreen()}
    </main>
  )
}