import AsistenciaService from "../services/asistencia.service.js";
import { Alumno } from "../models/index.js"; // <--- Necesario para buscar el ID real

// 1. REGISTRAR ASISTENCIA (Blindado)
export const register = async (req, res) => {
  try {
    const { idGrupo, latitud, longitud, precision } = req.body;

    // --- SEGURIDAD CRÍTICA ---
    // Ignoramos el req.body.idAlumno porque el frontend puede equivocarse.
    // Obtenemos el ID del usuario directamente del token de sesión.
    const idUsuarioLogueado = req.user.id; 

    // Buscamos el perfil de Alumno asociado a este Usuario
    const alumnoReal = await Alumno.findOne({ where: { idUsuario: idUsuarioLogueado } });

    if (!alumnoReal) {
        return res.status(404).json({ ok: false, message: "No se encontró el perfil de alumno para este usuario." });
    }

    // Llamamos al servicio usando el ID VERIFICADO (alumnoReal.idAlumno)
    const result = await AsistenciaService.registrarAsistencia({
      idAlumno: alumnoReal.idAlumno, 
      idGrupo,
      latitud,
      longitud,
      precision,
      fechaHora: new Date().toISOString() // Usamos hora del servidor
    });

    if (!result.exito) {
      // Si es duplicada devolvemos 200 para no generar error en frontend, si es otro error devolvemos 400
      const status = result.estadoFinal === "Duplicada" ? 200 : 400;
      return res.status(status).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error("Error en register controller:", error);
    res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
};

// 2. OBTENER LISTA (Para el maestro)
export const getListaAsistencia = async (req, res) => {
  try {
    const { idGrupo } = req.params;
    const { fecha } = req.query; // Formato YYYY-MM-DD

    if (!fecha) {
      return res.status(400).json({ message: "Se requiere la fecha" });
    }

    const lista = await AsistenciaService.obtenerListaAsistencia(idGrupo, fecha);
    res.json(lista);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la lista" });
  }
};

// 3. ACTUALIZAR MANUALMENTE (Maestro)
export const updateAsistenciaManual = async (req, res) => {
  try {
    const { idAlumno, idGrupo, fecha, estado } = req.body;
    
    const result = await AsistenciaService.registrarManual({ 
        idAlumno, 
        idGrupo, 
        fechaStr: fecha, 
        nuevoEstado: estado 
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar asistencia" });
  }
};

// 4. RESUMEN ALUMNO (Dashboard Alumno)
export const getResumenAlumno = async (req, res) => {
    try {
        const idUsuario = req.user.id; // ID del token
        const resumen = await AsistenciaService.getResumenAlumno(idUsuario);
        res.json({ ok: true, data: resumen });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error obteniendo resumen" });
    }
};

// 5. HISTORIAL GRUPO (Detalle Materia Alumno)
export const getHistorialGrupo = async (req, res) => {
  try {
    const { idGrupo } = req.params;
    const { fechaInicio, fechaFin } = req.query; 

    // Pasamos req.user.id para que el servicio busque al alumno correcto
    const historial = await AsistenciaService.getHistorialGrupo(req.user.id, idGrupo, fechaInicio, fechaFin);
    res.json({ ok: true, data: historial });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
};

// 6. REPORTE PDF (Maestro)
export const getReporteAsistencias = async (req, res) => {
  try {
    const { idGrupo } = req.params;
    const { fechaInicio, fechaFin } = req.query;

    if (!idGrupo || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Faltan parámetros: idGrupo, fechaInicio, fechaFin" });
    }

    const reporte = await AsistenciaService.getReporteRango(idGrupo, fechaInicio, fechaFin);

    res.json({
      ok: true,
      data: reporte
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error al generar el reporte" });
  }
};