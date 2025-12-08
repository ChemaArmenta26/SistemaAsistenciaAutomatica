export interface Coordenadas {
    latitud: number;
    longitud: number;
    presicion: number;
}

export const obtenerUbicacion = (): Promise<Coordenadas> => {
    return new Promise((resolve, reject) => {
        
        // --- MODO PRUEBAS: DESCOMENTAR ESTO PARA SIMULAR ESTAR EN EL AULA ---
        resolve({
            latitud: 27.4499,  
            longitud: -109.9135,
            presicion: 10, // Simulamos una precisión perfecta de 10 metros
        });
        return; 
        // -------------------------------------------------------------------

        if (!navigator.geolocation) {
            reject(new Error("Geolocalización no es soportada por este navegador."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Muestra en consola qué tan mala es la precisión real
                console.log("📡 Precisión del GPS:", position.coords.accuracy, "metros");
                
                resolve({
                    latitud: position.coords.latitude,
                    longitud: position.coords.longitude,
                    presicion: position.coords.accuracy,
                });
            },
            (error) => {
                let mensaje = "Error desconocido de ubicación.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        mensaje = "Necesitas permitir la ubicación para registrar asistencia.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        mensaje = "No se pudo obtener la ubicación.";
                        break;
                    case error.TIMEOUT:
                        mensaje = "Se agotó el tiempo esperando el GPS.";
                        break;
                }
                reject(new Error(mensaje));
            },
            { 
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 0 
            }
        );
    });
}