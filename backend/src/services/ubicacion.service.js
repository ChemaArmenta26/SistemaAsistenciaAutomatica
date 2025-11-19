import Clase from "../models/Clase.js";
import Aula from "../models/Aula.js";

class UbicacionService {

  /**
   * Convierte grados a radianes
   */
  static toRad(value) {
    return (value * Math.PI) / 180;
  }

  /**
   * Calcula la distancia en metros entre dos coordenadas usando Haversine
   */
  static calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c; // Distancia en metros
    
    return distancia;
  }

  /**
   * Valida si el alumno está dentro del rango del aula asignada al grupo
   */
  static async validarUbicacionAula(idGrupo, latAlumno, lonAlumno) {
    try {
      // 1. Buscar el Grupo (Clase) y su Aula asociada
      const grupo = await Clase.findByPk(idGrupo, {
        include: [{ model: Aula }] 
      });

      if (!grupo) throw new Error("Grupo no encontrado");
      if (!grupo.Aula) throw new Error("El grupo no tiene un aula asignada");

      const { latitud: latAula, longitud: lonAula, radioPermitido } = grupo.Aula;

      // 2. Calcular distancia
      const distancia = this.calcularDistancia(latAlumno, lonAlumno, latAula, lonAula);

      // 3. Validar contra el radio permitido
      const esValido = distancia <= radioPermitido;

      return {
        ok: esValido,
        distancia: parseFloat(distancia.toFixed(2)),
        radioPermitido,
        mensaje: esValido ? "Ubicación válida" : `Estás a ${distancia.toFixed(1)}m del aula (máximo ${radioPermitido}m).`
      };

    } catch (error) {
      return { ok: false, distancia: null, mensaje: error.message };
    }
  }
}

export default UbicacionService;