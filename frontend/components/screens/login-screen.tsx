"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { loginService } from "@/services/auth.service"
import { toast } from "sonner"

interface LoginScreenProps {
  onLogin: (role: "student" | "teacher", name: string, token: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState<"student" | "teacher">("student")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) 

    if (!email.trim() || !password.trim()) {
      setError("Por favor, ingresa tu correo y contraseña.")
      return
    }

    setLoading(true)

    try {
      const data = await loginService(email, password)
      const { token, user } = data
      
      const userRoleLower = user.rol.toLowerCase()

      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))

      toast.success(`Bienvenido de nuevo, ${user.nombre.split(" ")[0]}`)

      const finalRole = userRoleLower.includes("alumno") ? "student" : "teacher"
      onLogin(finalRole, user.nombre, token)

    } catch (err: any) {
      const msg = err.message || "Error de conexión con el servidor"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-sm">
            IT
          </div>
          <CardTitle className="text-2xl font-bold">ITSON Asistencias</CardTitle>
          <CardDescription>Ingresa tus credenciales institucionales</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Selector de Rol */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
              <Button
                type="button"
                variant={userType === "student" ? "default" : "ghost"}
                onClick={() => setUserType("student")}
                className="w-full rounded-md transition-all"
                disabled={loading}
              >
                Alumno
              </Button>
              <Button
                type="button"
                variant={userType === "teacher" ? "default" : "ghost"}
                onClick={() => setUserType("teacher")}
                className="w-full rounded-md transition-all"
                disabled={loading}
              >
                Maestro
              </Button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-sm font-medium pl-1">Correo Institucional</label>
                <Input
                  type="email"
                  placeholder={userType === "student" ? "id@potros.itson.edu.mx" : "nombre@itson.edu.mx"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium pl-1">Contraseña</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-background/50"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 text-center font-medium bg-red-50 p-3 rounded-md border border-red-100 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-6 text-base" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Validando...
                </span>
              ) : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}