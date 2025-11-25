import AsistenciaService from "../services/asistencia.service.js";

export async function register(req, res) {
  try {
    const { idAlumno, idGrupo, latitud, longitud, precision, fechaHora } = req.body;
    if (!idAlumno || !idGrupo) {
      return res.status(400).json({ error: "Faltan campos: idAlumno y idGrupo son requeridos" });
    }

    const result = await AsistenciaService.registrarAsistencia({ idAlumno, idGrupo, latitud, longitud, precision, fechaHora });

    if (result.exito) {
        return res.status(201).json({
            ok: true,
            message: result.mensaje, 
            asistencia: result.asistencia,
            estado: result.estadoFinal,
        });
    } else {
       return res.status(400).json({
            ok: false,
            error: result.mensaje,
            asistencia: result.asistencia,
            estado: result.estadoFinal 
        });
    }
  } catch (err) {
    console.error("Error registrar asistencia:", err);
    return res.status(500).json({ error: "Error interno al registrar asistencia" });
  }
}

export const getListaAsistencia = async (req, res) => {
  try {
    const { idGrupo, fecha } = req.params;

    if (!idGrupo || !fecha) {
      return res.status(400).json({ error: "Faltan parámetros: idGrupo y fecha son requeridos" });
    }
    
    const lista = await AsistenciaService.obtenerListaAsistencia(idGrupo, fecha);
    
    res.json({
      ok: true,
      data: lista
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error al obtener lista de asistencia" });
  }
};

export const updateAsistenciaManual = async (req, res) => {
  try {
    const { idAlumno, idGrupo, fecha, estado } = req.body;

    if (!idAlumno || !idGrupo || !fecha || !estado) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    
    const resultado = await AsistenciaService.registrarManual({
      idAlumno, 
      idGrupo, 
      fechaStr: fecha, 
      nuevoEstado: estado
    });

    res.json({
      ok: true,
      message: "Asistencia actualizada manualmente",
      data: resultado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error al actualizar asistencia manual" });
  }
};
