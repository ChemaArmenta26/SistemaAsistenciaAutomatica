import ClaseService from "../services/clase.service.js";

export async function getClasesHoy(req, res) {
  try {
    const { idAlumno } = req.params;

    if (!idAlumno) {
      return res.status(400).json({ error: "Falta el ID del alumno" });
    }

    const clases = await ClaseService.getClasesHoyAlumno(idAlumno);

    return res.status(200).json({
      ok: true,
      data: clases
    });

  } catch (error) {
    return res.status(500).json({ error: "Error al obtener las clases" });
  }
}