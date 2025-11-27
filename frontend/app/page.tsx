"use client"

import { useState } from "react"
import { LoginScreen } from "@/components/screens/login-screen"
import { StudentDashboard } from "@/components/screens/student-dashboard"
import { TeacherDashboard } from "@/components/screens/teacher-dashboard"
import { StudentHistory } from "@/components/screens/student-history"
import { TeacherAttendance } from "@/components/screens/teacher-attendance"

type UserRole = "student" | "teacher" | null
type Screen = "login" | "student-dashboard" | "student-history" | "teacher-dashboard" | "teacher-attendance"

export default function Home() {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [userName, setUserName] = useState("")
  const [navigationParams, setNavigationParams] = useState<any>({})

  const handleLogin = (role: "student" | "teacher", name: string) => {
    setUserRole(role)
    setUserName(name)
    setCurrentScreen(role === "student" ? "student-dashboard" : "teacher-dashboard")
  }

  const handleLogout = () => {
    setUserRole(null)
    setCurrentScreen("login")
    setUserName("")
  }

  const navigateTo = (screen: string, params?: any) => {
    setCurrentScreen(screen as Screen)
    setNavigationParams(params || {})
  }

  return (
    <div className="min-h-screen bg-background">
      {!userRole ? (
        <LoginScreen onLogin={handleLogin} />
      ) : currentScreen === "student-dashboard" ? (
        <StudentDashboard userName={userName} onNavigate={navigateTo} onLogout={handleLogout} />
      ) : currentScreen === "student-history" ? (
        <StudentHistory userName={userName} onNavigate={navigateTo} onLogout={handleLogout} />
      ) : currentScreen === "teacher-dashboard" ? (
        <TeacherDashboard userName={userName} onNavigate={navigateTo} onLogout={handleLogout} />
      ) : (
        <TeacherAttendance userName={userName} onNavigate={navigateTo} onLogout={handleLogout} initialCourseId={navigationParams.courseId} />
      )}
    </div>
  )
}
