const axios = require('axios');
const { logInfo, logError } = require("../utils/logger");

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
                        user_name: change.value.from.name,
                        post_id: change.value.post_id,
                        parent_id: change.value.parent_id,
                        created_time: change.value.created_time,
                        permalink: change.value.post.permalink_url
                    };

                    logInfo("💬 Comentario de Facebook detectado:", {
                        user: commentData.user_name,
                        content: commentData.content
                    });

                    // Enviar al procesador de Python
                    const response = await axios.post(
                        'http://localhost:8000/process-comment',
                        commentData
                    );

                    if (response.data.response) {
                        logInfo(`✅ Respuesta generada para Facebook: ${response.data.response}`);
                    }
                }
            }
        }
    } catch (error) {
        logError("❌ Error procesando evento de Facebook:", error);
    }
};
