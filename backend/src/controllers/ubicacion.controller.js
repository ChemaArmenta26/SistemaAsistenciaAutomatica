import UbicacionService from "../services/ubicacion.service.js";

export async function ubi(req, res) {
  try {
    const { idAlumno, idGrupo, latitud, longitud } = req.body;

    if (!idAlumno || !idGrupo) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const result = await UbicacionService.validarUbicacionAula(
      idGrupo,
      latitud,
      longitud
    );

    if (result.ok) {
      return res.status(200).json({
        ok: true,
        mensaje: result.mensaje,
        distancia: result.distancia,
        radioPermitido: result.radioPermitido
      });
    }

    return res.status(400).json({
      ok: false,
      mensaje: result.mensaje,
      distancia: result.distancia
    });

  } catch (err) {
    console.error("Error al validar ubicación:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
