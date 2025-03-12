const express = require("express");
const router = express.Router();
const axios = require('axios');
const { respondToComment, cleanResponse } = require('../utils/facebook');
const { logInfo, logError } = require("../utils/logger");

// Configuraciones
const BOT_PAGE_NAME = "CoPrinter SAC";
const MAX_RESPONSE_LENGTH = 300;
const COMMENT_THRESHOLD = 5 * 60 * 1000; // 5 minutos

// Caché simple para comentarios respondidos
const respondedComments = new Set();
// Limpiar caché cada hora para evitar que crezca indefinidamente
setInterval(() => {
    respondedComments.clear();
    logInfo("🧹 Caché de comentarios limpiado");
}, 60 * 60 * 1000);

function truncateResponse(response) {
    if (response.length <= MAX_RESPONSE_LENGTH) {
        return response;
    }
    const truncated = response.substring(0, MAX_RESPONSE_LENGTH);
    const lastPeriod = truncated.lastIndexOf('.');
    return lastPeriod > 0 ? response.substring(0, lastPeriod + 1).trim() : truncated.substring(0, 297) + "...";
}

function isRecentComment(change) {
    // Si no hay created_time, asumimos que es un comentario nuevo
    if (!change.value.created_time) {
        return true;
    }

    const currentTime = new Date().getTime();
    const commentTime = new Date(change.value.created_time).getTime();
    
    logInfo("⏰ Tiempos:", {
        comentario: new Date(commentTime).toISOString(),
        actual: new Date(currentTime).toISOString(),
        diferencia_ms: currentTime - commentTime
    });

    return true; // Temporalmente procesamos todos los comentarios
}

router.post('/', async (req, res) => {
    try {
        if (req.body.object === 'page') {
            logInfo("📘 Evento de Facebook recibido");
            
            for (const entry of req.body.entry) {
                for (const change of entry.changes) {
                    if (change.value.item === 'comment' && change.value.verb === 'add') {
                        const commentId = change.value.comment_id;

                        // Verificar si ya respondimos a este comentario
                        if (respondedComments.has(commentId)) {
                            logInfo("🔄 Comentario ya respondido, ignorando:", commentId);
                            continue;
                        }

                        // Verificar si el comentario es de la página
                        if (change.value.from.name === BOT_PAGE_NAME) {
                            logInfo("🤖 Ignorando comentario de la página");
                            continue;
                        }

                        const commentData = {
                            content: change.value.message,
                            username: change.value.from.name,
                            commentId: commentId
                        };

                        logInfo("💬 Procesando comentario:", commentData);

                        try {
                            const iaResponse = await axios.post('http://localhost:8000/process-comment', commentData);
                            
                            if (iaResponse.data && iaResponse.data.response) {
                                let response = cleanResponse(iaResponse.data.response);
                                
                                if (response.length > MAX_RESPONSE_LENGTH) {
                                    logInfo(`⚠️ Respuesta excede ${MAX_RESPONSE_LENGTH} caracteres`);
                                    response = truncateResponse(response);
                                }
                                
                                logInfo(`✅ Enviando respuesta: ${response}`);
                                await respondToComment(commentId, response);
                                
                                // Marcar el comentario como respondido
                                respondedComments.add(commentId);
                                logInfo('✅ Respuesta enviada y comentario marcado como respondido');
                            }
                        } catch (error) {
                            logError("❌ Error procesando respuesta:", error);
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

router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
            logInfo('✅ WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

module.exports = router;
