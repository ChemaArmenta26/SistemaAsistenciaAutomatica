import { Clase, Alumno, Aula, Horario, Maestro, Usuario, Asistencia } from "../models/index.js";
import { DateTime } from "luxon";
import { Op } from "sequelize";

const TIMEZONE = process.env.TZ || "America/Hermosillo";

class ClaseService {
  
  static async getClasesHoyAlumno(idUsuario) {
    const now = DateTime.now().setZone(TIMEZONE);
    const diaHoy = now.weekday === 7 ? 0 : now.weekday; 
    
    const inicioDia = now.startOf('day').toJSDate();
    const finDia = now.endOf('day').toJSDate();

    const PERIODO_ACTUAL = "ENE-MAY 2025"; 

    try {

      const alumno = await Alumno.findOne({
        where: { idUsuario: idUsuario }, 
        include: [
          {
            model: Clase,
            required: true, 
            where: { periodo: PERIODO_ACTUAL },
            include: [
              { model: Aula, attributes: ['nombreAula', 'idAula'] },
              { model: Maestro, include: [{ model: Usuario, attributes: ['nombre'] }] },
              {
                model: Horario,
                required: true,
                where: { diaSemana: diaHoy },
                attributes: ['horaInicio', 'horaFin']
              }
            ],
            through: { attributes: [] } 
          }
        ]
      });

      if (!alumno || !alumno.Clases) {
        return []; 
      }

      const idAlumnoReal = alumno.idAlumno;

      const asistenciasHoy = await Asistencia.findAll({
        where: {
          idAlumno: idAlumnoReal,
          fechaHora: {
            [Op.between]: [inicioDia, finDia]
          }
        },
        attributes: ['idGrupo', 'estado']
      });

      const asistenciaMap = new Map();
      asistenciasHoy.forEach(a => {
        asistenciaMap.set(a.idGrupo, a.estado);
      });

      const clasesFormateadas = alumno.Clases.map(c => {
        const horario = c.Horarios[0]; 
        const estadoActual = asistenciaMap.get(c.idGrupo) || null;

        return {
          id: c.idGrupo,
          name: c.nombreMateria,
          instructor: c.Maestro?.Usuario?.nombre || "Por asignar",
          room: c.Aula?.nombreAula || "Sin Aula",
          horaInicioRaw: horario.horaInicio, 
          time: `${horario.horaInicio.slice(0, 5)} - ${horario.horaFin.slice(0, 5)}`,
          attendanceStatus: estadoActual 
        };
      });

      clasesFormateadas.sort((a, b) => a.horaInicioRaw.localeCompare(b.horaInicioRaw));

      return clasesFormateadas;

    } catch (error) {
      console.error("Error en ClaseService:", error);
      throw error;
    }
  }
}

export default ClaseService;