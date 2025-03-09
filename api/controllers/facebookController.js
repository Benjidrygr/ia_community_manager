const axios = require('axios');
const { logInfo, logError } = require("../utils/logger");
const { respondToComment, cleanResponse } = require('../utils/facebook');

// Configuración del servidor de IA
const IA_SERVER_URL = process.env.IA_SERVER_URL || 'https://ia-community-manager.onrender.com';

exports.processEvent = async (event) => {
    logInfo("📘 Evento de Facebook recibido");
    logInfo(`🔗 Usando servidor IA: ${IA_SERVER_URL}`);
    
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
                        media_id: change.value.post?.id
                    };

                    logInfo("💬 Comentario de Facebook detectado:", {
                        user: commentData.username,
                        content: commentData.content,
                        comment_id: commentData.comment_id
                    });

                    try {
                        logInfo(`🚀 Enviando comentario al servidor IA: ${IA_SERVER_URL}/process-comment`);
                        
                        // Enviar al servidor de IA
                        const iaResponse = await axios.post(
                            `${IA_SERVER_URL}/process-comment`,
                            commentData
                        );

                        logInfo("📩 Respuesta recibida del servidor IA:", iaResponse.data);

                        if (iaResponse.data && iaResponse.data.response) {
                            // Limpiar la respuesta (eliminar el contenido <think>)
                            const cleanedResponse = cleanResponse(iaResponse.data.response);
                            logInfo(`✅ Respuesta limpia del agente: ${cleanedResponse}`);

                            // Enviar respuesta a Facebook
                            await respondToComment(commentData.comment_id, cleanedResponse);
                            logInfo('✅ Respuesta enviada a Facebook');
                        } else {
                            logError("❌ La respuesta del servidor IA no tiene el formato esperado:", iaResponse.data);
                        }
                    } catch (error) {
                        logError("❌ Error procesando respuesta:", {
                            message: error.message,
                            response: error.response?.data,
                            status: error.response?.status
                        });
                    }
                }
            }
        }
    } catch (error) {
        logError("❌ Error procesando evento de Facebook:", {
            message: error.message,
            stack: error.stack
        });
    }
};
