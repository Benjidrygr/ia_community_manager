const axios = require('axios');
const { logInfo, logError } = require("../utils/logger");

// Configuración del servidor Python
const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';

exports.processEvent = async (event) => {
    logInfo("📘 Evento de Facebook recibido");
    
    try {
        // Validar que sea un evento de página de Facebook
        if (event.object !== "page") {
            logInfo("No es un evento de página de Facebook");
            return;
        }

        for (const entry of event.entry) {
            for (const change of entry.changes) {
                // Validar que sea un comentario en el feed
                if (change.field === "feed" && 
                    change.value.item === "comment" && 
                    change.value.verb === "add") {
                    
                    const commentData = {
                        platform: 'facebook',
                        content: change.value.message,
                        comment_id: change.value.comment_id,
                        user_id: change.value.from.id,
                        username: change.value.from.name,
                        post_id: change.value.post_id,
                        parent_id: change.value.parent_id,
                        timestamp: change.value.created_time,
                        media_id: change.value.post.id
                    };

                    logInfo("💬 Comentario de Facebook detectado:", {
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
                        // Aquí puedes agregar la lógica para responder al comentario en Facebook
                    }
                }
            }
        }
    } catch (error) {
        logError("❌ Error procesando evento de Facebook:", error);
    }
};
