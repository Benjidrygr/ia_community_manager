const axios = require('axios');
const { logInfo, logError } = require("../utils/logger");

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

                    // Enviar al procesador de Python
                    const response = await axios.post(
                        'http://localhost:8000/process-comment',
                        commentData
                    );

                    if (response.data.response) {
                        logInfo(`✅ Respuesta generada para Instagram: ${response.data.response}`);
                    }
                }
            }
        }
    } catch (error) {
        logError("❌ Error procesando evento de Instagram:", error);
    }
};
