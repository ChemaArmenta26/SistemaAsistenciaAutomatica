"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface LoginScreenProps {
  onLogin: (role: "student" | "teacher", name: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState<"student" | "teacher">("student")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      const name = email.split("@")[0]
      onLogin(userType, name)
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
              >
                Alumno
              </Button>
              <Button
                type="button"
                variant={userType === "teacher" ? "default" : "outline"}
                onClick={() => setUserType("teacher")}
                className="w-full"
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
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" size="lg">
              Iniciar Sesión
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Prueba: estudiante@itson.edu.mx / cualquier contraseña
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
