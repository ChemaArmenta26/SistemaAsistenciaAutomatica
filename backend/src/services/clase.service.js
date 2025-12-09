import { Clase, Alumno, Aula, Horario, Maestro, Usuario, Asistencia } from "../models/index.js";
import AsistenciaService from "./asistencia.service.js"; 
import { DateTime } from "luxon";
import { Op } from "sequelize";

const TIMEZONE = process.env.TZ || "America/Hermosillo";
const PERIODO_ACTUAL = "AGO-DIC 2025";

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

      // Sincronizar faltas para las clases de hoy
      for (const clase of alumno.Clases) {
          await AsistenciaService._rellenarFaltas(clase.idGrupo, now, now);
      }

      const idAlumnoReal = alumno.idAlumno;

      // Volvemos a consultar las asistencias (ahora ya incluirán las faltas recién generadas)
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

  static async getClasesPorFechaMaestro(idUsuarioInput, fechaStr) {
    const fechaBusqueda = fechaStr 
        ? DateTime.fromISO(fechaStr, { zone: TIMEZONE }) 
        : DateTime.now().setZone(TIMEZONE);

    if (!fechaBusqueda.isValid) throw new Error("Fecha inválida");

    let diaSemana = fechaBusqueda.weekday;
    // Ajuste de luxon (1-7) a modelo (0-6) si es necesario, 
    if (diaSemana === 7) diaSemana = 0; 

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
            where: { diaSemana: diaSemana }, 
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
      console.error("Error en getClasesPorFechaMaestro:", error);
      throw error;
    }
  }


  static async getHorarioMaestro(idUsuario) {
    try {
      const maestro = await Maestro.findOne({ where: { idUsuario } });
      if (!maestro) throw new Error("Maestro no encontrado");

      // Obtenemos todas las clases del periodo actual
      const clases = await Clase.findAll({
        where: { 
            idMaestro: maestro.idMaestro, 
            periodo: "AGO-DIC 2025"
        },
        include: [
          { model: Aula, attributes: ['nombreAula'] },
          { model: Horario, attributes: ['diaSemana', 'horaInicio', 'horaFin'] }
        ]
      });

      const horarioFlat = [];
      clases.forEach(c => {
        c.Horarios.forEach(h => {
          horarioFlat.push({
            id: c.idGrupo,
            materia: c.nombreMateria,
            aula: c.Aula ? c.Aula.nombreAula : "Sin Aula",
            dia: h.diaSemana, // 1=Lunes, 2=Martes...
            horaInicio: h.horaInicio.slice(0, 5), // "07:00"
            horaFin: h.horaFin.slice(0, 5)        // "08:00"
          });
        });
      });

      // Ordenar por día y hora
      return horarioFlat.sort((a, b) => a.dia - b.dia || a.horaInicio.localeCompare(b.horaInicio));

    } catch (error) {
      console.error("Error getHorarioMaestro:", error);
      throw error;
    }
  }
}

export default ClaseService;