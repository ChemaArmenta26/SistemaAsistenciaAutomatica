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

export const getClasesHoyMaestro = async (req, res) => {
  try {
    const { idMaestro } = req.params;

    if (!idMaestro) {
      return res.status(400).json({ error: "Falta el ID del maestro" });
    }
    const clases = await ClaseService.getClasesHoyMaestro(idMaestro);
    
    res.json({
      ok: true,
      data: clases
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error al obtener clases del maestro" });
  }
};