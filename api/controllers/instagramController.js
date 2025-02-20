const axios = require('axios');
const { logInfo, logError } = require("../utils/logger");

// Configuración del servidor Python
const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';

exports.processEvent = async (event) => {
    logInfo("📷 Evento de Instagram recibido");
    
    try {
        // Validar que sea un evento de Instagram
        if (event.object !== "instagram") {
            logInfo("No es un evento de Instagram");
            return;
        }

        for (const entry of event.entry) {
            for (const change of entry.changes) {
                // Validar que sea un comentario
                if (change.field === "comments") {
                    const commentData = {
                        platform: 'instagram',
                        content: change.value.text,
                        comment_id: change.value.id,
                        user_id: change.value.from.id,
                        username: change.value.from.username,
                        media_id: change.value.media.id,
                        media_type: change.value.media.media_product_type,
                        timestamp: entry.time
                    };

                    logInfo("💬 Comentario de Instagram detectado:", {
                        user: commentData.username,
                        content: commentData.content
                    });

                    // Enviar al servidor Python
                    const response = await axios.post(
                        `${PYTHON_SERVER_URL}/process-comment`,
                        commentData
                    );

                    if (response.data && response.data.response) {
                        logInfo(`✅ Respuesta del agente: ${response.data.response}`);
                        // Aquí puedes agregar la lógica para responder al comentario en Instagram
                    }
                }
            }
        }
    } catch (error) {
        logError("❌ Error procesando evento de Instagram:", error);
    }
};
