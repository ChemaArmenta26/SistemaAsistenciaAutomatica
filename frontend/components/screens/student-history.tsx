"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { ChevronLeft, CheckCircle, X, AlertCircle, FileCheck, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    getStudentStatsService,
    getSubjectHistoryService,
    type AttendanceRecord
} from "@/services/student.service"

export interface StudentSubjectStats {
    id: number;
    name: string;
    instructor: string;
    attendance: number;
    late: number;
    totalClasses?: number; 
    percentage: number;
}

interface StudentHistoryProps {
    userName: string
    onNavigate: (screen: string, params?: any) => void
    onLogout: () => void
}

export function StudentHistory({ userName, onNavigate, onLogout }: StudentHistoryProps) {
    const [subjects, setSubjects] = useState<StudentSubjectStats[]>([])
    const [loadingSubjects, setLoadingSubjects] = useState(true)

    const [selectedSubject, setSelectedSubject] = useState<StudentSubjectStats | null>(null)
    const [history, setHistory] = useState<AttendanceRecord[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    const [startDate, setStartDate] = useState("2025-01-01")
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoadingSubjects(true)
                const data = await getStudentStatsService()
                setSubjects(data as unknown as StudentSubjectStats[])
            } catch (error: any) {
                toast.error("Error al cargar estadísticas", { description: error.message })
            } finally {
                setLoadingSubjects(false)
            }
        }
        fetchStats()
    }, [])

    const fetchHistory = async (subjectId: number, start: string, end: string) => {
        setLoadingHistory(true)
        try {
            const records = await getSubjectHistoryService(subjectId, start, end)
            setHistory(records)
        } catch (error: any) {
            toast.error("Error al cargar historial", { description: error.message })
        } finally {
            setLoadingHistory(false)
        }
    }

    const handleSubjectClick = (subject: StudentSubjectStats) => {
        setSelectedSubject(subject)
        fetchHistory(subject.id, startDate, endDate)
    }

    const handleFilterClick = () => {
        if (selectedSubject) {
            fetchHistory(selectedSubject.id, startDate, endDate)
        }
    }

    const handleBackToSubjects = () => {
        setSelectedSubject(null)
        setHistory([])
    }

    const renderStatusIcon = (status: string) => {
        const s = status.toLowerCase()
        if (s === 'presente' || s === 'registrada') return <CheckCircle className="w-5 h-5 text-green-600" />
        if (s === 'retardo') return <AlertCircle className="w-5 h-5 text-orange-500" />
        if (s === 'justificado') return <FileCheck className="w-5 h-5 text-blue-500" />
        return <X className="w-5 h-5 text-red-600" />
    }

    return (
        <div className="min-h-screen bg-background">
            <Header userName={userName} onLogout={onLogout} role="student" />

            <main className="max-w-2xl mx-auto p-4 pb-20">
                <Button variant="ghost" size="sm" onClick={() => onNavigate("student-dashboard")} className="mb-4">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Volver al Inicio
                </Button>

                <h1 className="text-2xl font-bold mb-6">Historial Académico</h1>

                {!selectedSubject ? (
                    <div className="space-y-3">
                        {loadingSubjects ? (
                            <div className="text-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                <p className="text-sm text-muted-foreground mt-2">Cargando materias...</p>
                            </div>
                        ) : subjects.length === 0 ? (
                            <div className="text-center p-8 border rounded-lg bg-muted/20">
                                <p>No hay registros de asistencia aún.</p>
                            </div>
                        ) : (
                            subjects.map((subject) => {
                                const total = subject.totalClasses || 0;
                                const attended = subject.attendance;
                                const absences = total > 0 ? total - attended : 0;

                                return (
                                    <Card
                                        key={subject.id}
                                        className="cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.99]"
                                        onClick={() => handleSubjectClick(subject)}
                                    >
                                        <CardContent className="pt-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 pr-2">
                                                    <h3 className="font-semibold text-foreground">{subject.name}</h3>
                                                    <p className="text-sm text-muted-foreground mb-2">{subject.instructor}</p>

                                                    {/* AQUÍ ESTÁ EL CAMBIO VISUAL SOLICITADO */}
                                                    <div className="flex items-center gap-3 text-xs font-medium">
                                                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                                                            {attended} Asistencias
                                                        </span>
                                                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100">
                                                            {absences} Faltas
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className={`text-xl font-bold ${subject.percentage < 80 ? 'text-red-500' : 'text-primary'}`}>
                                                        {subject.percentage}%
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wide">
                                                        Promedio
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full bg-secondary/30 h-2 rounded-full mt-3 overflow-hidden">
                                                <div
                                                    className={`h-full ${subject.percentage < 80 ? 'bg-red-500' : 'bg-primary'}`}
                                                    style={{ width: `${subject.percentage}%` }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Button variant="outline" size="sm" onClick={handleBackToSubjects} className="mb-2">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Ver otras materias
                        </Button>

                        <Card className="border-primary/20 bg-primary/5 shadow-sm">
                            <CardHeader className="py-4">
                                <CardTitle className="text-lg">{selectedSubject.name}</CardTitle>
                                <div className="text-sm text-muted-foreground flex gap-4">
                                    <span>Prof. {selectedSubject.instructor}</span>
                                </div>
                            </CardHeader>
                        </Card>

                        <div className="flex flex-col sm:flex-row gap-3 bg-muted/30 p-3 rounded-lg border">
                            <div className="flex-1">
                                <span className="text-xs text-muted-foreground font-medium ml-1">Desde</span>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-background h-9"
                                />
                            </div>
                            <div className="flex-1">
                                <span className="text-xs text-muted-foreground font-medium ml-1">Hasta</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-background h-9"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleFilterClick} disabled={loadingHistory} className="w-full sm:w-auto h-9">
                                    {loadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                                    Filtrar
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {loadingHistory ? (
                                <div className="text-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground mt-2">Buscando registros...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center border-2 border-dashed rounded-lg p-8">
                                    <p className="text-muted-foreground">No hay asistencias en este rango de fechas.</p>
                                </div>
                            ) : (
                                history.map((record, idx) => (
                                    <Card key={`${record.id}-${idx}`} className="border-l-4 border-l-primary/50 hover:bg-muted/10 transition-colors">
                                        <CardContent className="pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {renderStatusIcon(record.status)}
                                                <div>
                                                    <div className="font-medium capitalize">
                                                        {new Date(record.date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground capitalize">
                                                        {record.status}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground/80">
                                                {record.time}
                                            </span>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}