import { Clase, Alumno, Aula, Horario, Maestro, Usuario, Asistencia } from "../models/index.js";
import { DateTime } from "luxon";
import { Op } from "sequelize";

const TIMEZONE = process.env.TZ || "America/Hermosillo";
const PERIODO_ACTUAL = "ENE-MAY 2025";

class ClaseService {
  
  static async getClasesHoyAlumno(idUsuario) {
    const now = DateTime.now().setZone(TIMEZONE);
    const diaHoy = now.weekday === 7 ? 0 : now.weekday; 
    
    const inicioDia = now.startOf('day').toJSDate();
    const finDia = now.endOf('day').toJSDate();

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

  static async getClasesHoyMaestro(idUsuarioInput) {
    const now = DateTime.now().setZone(TIMEZONE);
    const diaHoy = now.weekday === 7 ? 0 : now.weekday;  

    try {

      const maestro = await Maestro.findOne({
        where: { idUsuario: idUsuarioInput }
      });

      if (!maestro) return [];

      const clases = await Clase.findAll({
        where: { 
            idMaestro: maestro.idMaestro,
            periodo: PERIODO_ACTUAL
        },
        include: [
          { model: Aula, attributes: ['nombreAula', 'idAula'] },
          {
            model: Horario,
            required: true,
            where: { diaSemana: diaHoy },
            attributes: ['horaInicio', 'horaFin']
          }
        ]
      });

      return clases.map(c => {
        const horario = c.Horarios[0];
        return {
          id: c.idGrupo,
          name: c.nombreMateria,
          room: c.Aula?.nombreAula || "Sin Aula",
          time: `${horario.horaInicio.slice(0, 5)} - ${horario.horaFin.slice(0, 5)}`,
          horaInicioRaw: horario.horaInicio
        };
      }).sort((a, b) => a.horaInicioRaw.localeCompare(b.horaInicioRaw));

    } catch (error) {
      console.error("Error en getClasesHoyMaestro:", error);
      throw error;
    }
  }


}

export default ClaseService;