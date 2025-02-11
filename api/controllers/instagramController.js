const { logInfo } = require("../utils/logger");

exports.processEvent = (event) => {
    logInfo("📷 Evento de Instagram recibido:", event);

    // Procesar eventos de Instagram (comentarios, menciones, etc.)
    event.entry.forEach((entry) => {
        logInfo(`📌 Entrada de Instagram: ${entry.id}, Tiempo: ${entry.time}`);
    });
};
