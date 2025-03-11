const express = require("express");
const router = express.Router();
const axios = require('axios');
const { respondToComment, cleanResponse } = require('../utils/facebook');
const { logInfo, logError } = require("../utils/logger");

// URL del servidor de IA (interno)
const PYTHON_PORT = process.env.PYTHON_SERVER_PORT || 8000;
const IA_SERVER_URL = `http://localhost:${PYTHON_PORT}`;

// Nombre de la página que no debe ser respondida
const BOT_PAGE_NAME = "CoPrinter SAC";
const MAX_RESPONSE_LENGTH = 300;
const COMMENT_THRESHOLD = 5 * 60 * 1000; // 5 minutos en milisegundos

// Función para truncar respuestas largas
function truncateResponse(response) {
    if (response.length <= MAX_RESPONSE_LENGTH) {
        return response;
    }
    
    // Buscar el último punto antes del límite
    const truncated = response.substring(0, MAX_RESPONSE_LENGTH);
    const lastPeriod = truncated.lastIndexOf('.');
    
    if (lastPeriod > 0) {
        return response.substring(0, lastPeriod + 1).trim();
    } else {
        return response.substring(0, MAX_RESPONSE_LENGTH - 3) + "...";
    }
}

// Función para verificar si el comentario es reciente
function isRecentComment(createdTime) {
    const commentTime = new Date(createdTime).getTime();
    const currentTime = new Date().getTime();
    return (currentTime - commentTime) <= COMMENT_THRESHOLD;
}

router.post('/', async (req, res) => {
    try {
        // Verificación del webhook de Facebook
        if (req.body.object === 'page') {
            logInfo("📘 Evento de Facebook recibido");
            
            for (const entry of req.body.entry) {
                for (const change of entry.changes) {
                    if (change.value.item === 'comment' && change.value.verb === 'add') {
                        // Verificar si el comentario es reciente
                        if (!isRecentComment(change.value.created_time)) {
                            logInfo("⏰ Ignorando comentario antiguo:", {
                                created_time: change.value.created_time,
                                message: change.value.message
                            });
                            continue;
                        }

                        const commentData = {
                            content: change.value.message,
                            username: change.value.from.name,
                            commentId: change.value.comment_id,
                            created_time: change.value.created_time
                        };

                        // Verificar si el comentario es de nuestra página
                        if (commentData.username === BOT_PAGE_NAME) {
                            logInfo("🤖 Ignorando comentario de la página:", commentData);
                            continue;
                        }

                        logInfo("💬 Comentario nuevo detectado:", commentData);

                        try {
                            // Enviar al servidor de IA
                            const iaResponse = await axios.post('http://localhost:8000/process-comment', commentData);
                            
                            if (iaResponse.data && iaResponse.data.response) {
                                // Limpiar la respuesta
                                let cleanedResponse = cleanResponse(iaResponse.data.response);
                                
                                // Verificar longitud y truncar si es necesario
                                if (cleanedResponse.length > MAX_RESPONSE_LENGTH) {
                                    logInfo(`⚠️ Respuesta excede ${MAX_RESPONSE_LENGTH} caracteres (${cleanedResponse.length})`);
                                    cleanedResponse = truncateResponse(cleanedResponse);
                                    logInfo(`✂️ Respuesta truncada a: ${cleanedResponse.length} caracteres`);
                                }
                                
                                logInfo(`✅ Respuesta final: ${cleanedResponse}`);
                                
                                // Enviar respuesta a Facebook
                                await respondToComment(commentData.commentId, cleanedResponse);
                                logInfo('✅ Respuesta enviada a Facebook');
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
            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        logError("❌ Error en webhook:", error);
        res.status(500).send('Error procesando webhook');
    }
});

// Verificación del webhook
router.get('/', (req, res) => {
    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            logInfo('✅ WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

module.exports = router;
