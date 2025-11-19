"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { loginService } from "@/services/auth.service"

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

    if (!email || !password) {
      setError("Por favor, completa todos los campos.")
      return
    }

    setLoading(true)

    try {
      const data = await loginService(email, password)
      const { token, user } = data

      console.log(data)

      const userRoleLower = user.rol.toLowerCase()
      const uiRole = userType === "student" ? "alumno" : "maestro"

      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))

      const finalRole = userRoleLower.includes("alumno") ? "student" : "teacher"
      onLogin(finalRole, user.nombre, token)

    } catch (err: any) {
      console.error(err)
      setError(err.message || "Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
            IT
          </div>
          <CardTitle className="text-2xl">ITSON Asistencias</CardTitle>
          <CardDescription>Sistema de Pase de Lista Automatizado</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={userType === "student" ? "default" : "outline"}
                onClick={() => setUserType("student")}
                className="w-full"
                disabled={loading}
              >
                Alumno
              </Button>
              <Button
                type="button"
                variant={userType === "teacher" ? "default" : "outline"}
                onClick={() => setUserType("teacher")}
                className="w-full"
                disabled={loading}
              >
                Maestro
              </Button>
            </div>

            <div className="space-y-3 pt-4">
              <div>
                <label className="text-sm font-medium">Correo Institucional</label>
                <Input
                  type="email"
                  placeholder="usuario@itson.edu.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contraseña</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            {/* Botón Submit con estado Loading */}
            <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
              {loading ? "Validando..." : "Iniciar Sesión"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Asegúrate de usar tus credenciales institucionales.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
