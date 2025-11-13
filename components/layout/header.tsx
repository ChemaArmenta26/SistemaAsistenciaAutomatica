"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface HeaderProps {
  userName: string
  onLogout: () => void
  role: "student" | "teacher"
}

export function Header({ userName, onLogout, role }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            IT
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">ITSON</p>
            <p className="text-xs font-semibold">{role === "student" ? "Alumno" : "Maestro"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{role === "student" ? "Estudiante" : "Docente"}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
