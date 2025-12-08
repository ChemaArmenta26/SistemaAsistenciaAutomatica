"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Download, Search, FileText } from "lucide-react"
import { getReporteAsistenciaService, type ReporteData } from "@/services/maestro.service"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: number | null
  courseName: string
}

export function ReportModal({ isOpen, onClose, courseId, courseName }: ReportModalProps) {
  // Fechas por defecto: Inicio de mes y hoy
  const today = new Date().toISOString().split('T')[0]
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReporteData | null>(null)

  // 1. Obtener datos para la vista previa
  const handlePreview = async () => {
    if (!courseId) return
    setLoading(true)
    setReportData(null) // Limpiar datos anteriores

    try {
        const data = await getReporteAsistenciaService(courseId, startDate, endDate)
        setReportData(data)
        if (data.alumnos.length === 0) {
            toast.info("No se encontraron registros en este rango de fechas.")
        }
    } catch (error: any) {
        toast.error("Error al cargar vista previa", { description: error.message })
    } finally {
        setLoading(false)
    }
  }

  // 2. Generar PDF usando los datos ya cargados en reportData
  const handleDownloadPDF = () => {
    if (!reportData) return

    try {
      const doc = new jsPDF()

      // Encabezado del PDF
      doc.setFontSize(18)
      doc.text("Reporte de Asistencias", 14, 20)
      
      doc.setFontSize(12)
      doc.text(`Materia: ${courseName}`, 14, 30)
      doc.text(`Periodo: ${startDate} al ${endDate}`, 14, 36)
      doc.text(`Total de Sesiones: ${reportData.totalSesiones}`, 14, 42)

      // Preparar datos para la tabla del PDF
      const tableData = reportData.alumnos.map(alumno => [
        alumno.matricula,
        alumno.nombre,
        alumno.presentes,
        alumno.retardos,
        alumno.faltas,
        alumno.justificados,
        `${alumno.porcentaje}%`
      ])

      autoTable(doc, {
        startY: 50,
        head: [['Matrícula', 'Nombre', 'Pres.', 'Ret.', 'Falt.', 'Just.', '% Asist.']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }, // Azul
        styles: { fontSize: 10 },
      })

      // Pie de página
      const finalY = (doc as any).lastAutoTable.finalY || 50
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text("Generado por Sistema de Asistencia Automática ITSON", 14, finalY + 10)

      doc.save(`Reporte_${courseName.replace(/\s+/g, '_')}_${startDate}.pdf`)
      toast.success("PDF descargado correctamente")
      
    } catch (err) {
        console.error(err)
        toast.error("Error al generar el archivo PDF")
    }
  }

  const handleClose = () => {
      setReportData(null) // Limpiar al cerrar
      onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col"> 
        <DialogHeader>
          <DialogTitle>Reporte de Asistencia - {courseName}</DialogTitle>
          <DialogDescription>
            Selecciona el rango de fechas para visualizar los datos. Si todo es correcto, podrás descargar el PDF.
          </DialogDescription>
        </DialogHeader>
        
        {/* Controles de Filtro */}
        <div className="flex flex-col sm:flex-row gap-4 items-end py-2 bg-muted/10 p-4 rounded-lg border">
            <div className="grid gap-2 w-full sm:w-auto">
              <Label htmlFor="start">Fecha Inicio</Label>
              <Input 
                id="start" 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="grid gap-2 w-full sm:w-auto">
              <Label htmlFor="end">Fecha Fin</Label>
              <Input 
                id="end" 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            <Button onClick={handlePreview} disabled={loading || !courseId} className="w-full sm:w-auto">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Generar Vista Previa
            </Button>
        </div>

        {/* Área de Vista Previa */}
        <div className="flex-1 overflow-hidden border rounded-md min-h-[300px] relative bg-background">
            
            {/* Estado Inicial */}
            {!reportData && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <FileText className="w-12 h-12 opacity-20" />
                    <p>Configura las fechas y haz clic en "Generar Vista Previa"</p>
                </div>
            )}
            
            {/* Cargando */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Procesando asistencias...</p>
                </div>
            )}

            {/* Tabla de Resultados */}
            {reportData && (
                <ScrollArea className="h-full max-h-[50vh]">
                    <div className="p-3 bg-muted/30 border-b flex justify-between items-center sticky top-0 backdrop-blur-sm">
                        <span className="text-sm font-semibold">Resumen del Periodo</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                            Total Sesiones: {reportData.totalSesiones}
                        </span>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Matrícula</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="text-center w-[60px]" title="Asistencias">Pres.</TableHead>
                                <TableHead className="text-center w-[60px]" title="Retardos">Ret.</TableHead>
                                <TableHead className="text-center w-[60px]" title="Faltas">Falt.</TableHead>
                                <TableHead className="text-center w-[60px]" title="Justificaciones">Just.</TableHead>
                                <TableHead className="text-right w-[80px]">Asist. %</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.alumnos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No se encontraron alumnos inscritos o activos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reportData.alumnos.map((alumno) => (
                                    <TableRow key={alumno.matricula}>
                                        <TableCell className="font-mono text-xs font-medium">{alumno.matricula}</TableCell>
                                        <TableCell className="text-sm">{alumno.nombre}</TableCell>
                                        <TableCell className="text-center text-green-600 font-medium bg-green-50/50">{alumno.presentes}</TableCell>
                                        <TableCell className="text-center text-orange-600 font-medium">{alumno.retardos}</TableCell>
                                        <TableCell className="text-center text-red-600 font-bold bg-red-50/50">{alumno.faltas}</TableCell>
                                        <TableCell className="text-center text-blue-600">{alumno.justificados}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-bold ${alumno.porcentaje < 80 ? 'text-red-500' : 'text-green-700'}`}>
                                                {alumno.porcentaje}%
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>Cerrar</Button>
          <Button onClick={handleDownloadPDF} disabled={!reportData} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" /> Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}