const { logInfo } = require("../utils/logger");

exports.processEvent = (event) => {
    logInfo("📘 Evento de Facebook recibido:", event);
    
    // Aquí puedes procesar mensajes, comentarios, reacciones, etc.
    event.entry.forEach((entry) => {
        logInfo(`📌 Entrada de página: ${entry.id}, Tiempo: ${entry.time}`);
    });
};
