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
