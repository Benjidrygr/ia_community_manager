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

router.post('/', async (req, res) => {
    try {
        // Verificación del webhook de Facebook
        if (req.body.object === 'page') {
            logInfo("📘 Evento de Facebook recibido");
            
            for (const entry of req.body.entry) {
                for (const change of entry.changes) {
                    if (change.value.item === 'comment' && change.value.verb === 'add') {
                        const commentData = {
                            content: change.value.message,
                            username: change.value.from.name,
                            commentId: change.value.comment_id
                        };

                        // Verificar si el comentario es de nuestra página
                        if (commentData.username === BOT_PAGE_NAME) {
                            logInfo("🤖 Ignorando comentario de la página:", commentData);
                            continue; // Saltar este comentario
                        }

                        logInfo("💬 Comentario detectado:", commentData);

                        try {
                            // Enviar al servidor de IA
                            const iaResponse = await axios.post('http://localhost:8000/process-comment', commentData);
                            
                            if (iaResponse.data && iaResponse.data.response) {
                                // Limpiar la respuesta
                                const cleanedResponse = cleanResponse(iaResponse.data.response);
                                logInfo(`✅ Respuesta limpia: ${cleanedResponse}`);
                                
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
