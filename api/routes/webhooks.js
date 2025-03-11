const express = require("express");
const router = express.Router();
const axios = require('axios');
const { respondToComment, cleanResponse } = require('../utils/facebook');
const { logInfo, logError } = require("../utils/logger");

// Configuraciones
const BOT_PAGE_NAME = "CoPrinter SAC";
const MAX_RESPONSE_LENGTH = 300;
const COMMENT_THRESHOLD = 5 * 60 * 1000; // 5 minutos

function truncateResponse(response) {
    if (response.length <= MAX_RESPONSE_LENGTH) {
        return response;
    }
    const truncated = response.substring(0, MAX_RESPONSE_LENGTH);
    const lastPeriod = truncated.lastIndexOf('.');
    return lastPeriod > 0 ? response.substring(0, lastPeriod + 1).trim() : truncated.substring(0, 297) + "...";
}

function isRecentComment(createdTime) {
    const commentTime = new Date(createdTime).getTime();
    const currentTime = new Date().getTime();
    return (currentTime - commentTime) <= COMMENT_THRESHOLD;
}

router.post('/', async (req, res) => {
    try {
        if (req.body.object === 'page') {
            logInfo("📘 Evento de Facebook recibido");
            
            for (const entry of req.body.entry) {
                for (const change of entry.changes) {
                    if (change.value.item === 'comment' && change.value.verb === 'add') {
                        // Verificar si el comentario es reciente
                        if (!isRecentComment(change.value.created_time)) {
                            logInfo("⏰ Ignorando comentario antiguo:", change.value.message);
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
                            commentId: change.value.comment_id
                        };

                        logInfo("💬 Comentario nuevo:", commentData);

                        try {
                            const iaResponse = await axios.post('http://localhost:8000/process-comment', commentData);
                            
                            if (iaResponse.data && iaResponse.data.response) {
                                let response = cleanResponse(iaResponse.data.response);
                                
                                if (response.length > MAX_RESPONSE_LENGTH) {
                                    logInfo(`⚠️ Respuesta excede ${MAX_RESPONSE_LENGTH} caracteres`);
                                    response = truncateResponse(response);
                                }
                                
                                logInfo(`✅ Enviando respuesta: ${response}`);
                                await respondToComment(commentData.commentId, response);
                                logInfo('✅ Respuesta enviada a Facebook');
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
