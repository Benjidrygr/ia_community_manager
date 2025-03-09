const express = require("express");
const router = express.Router();
const { verifyWebhook, handleWebhookEvent } = require("../controllers/webhookController");
const axios = require('axios');
const { respondToComment, cleanResponse } = require('../utils/facebook');

// URL del servidor de IA
const IA_SERVER_URL = process.env.IA_SERVER_URL || 'http://localhost:8000';

router.get("/", verifyWebhook);
router.post("/", handleWebhookEvent);

router.post('/facebook', async (req, res) => {
    try {
        // Verificación del webhook de Facebook
        if (req.body.object === 'page') {
            for (const entry of req.body.entry) {
                for (const change of entry.changes) {
                    if (change.value.item === 'comment' && change.value.verb === 'add') {
                        const commentData = {
                            content: change.value.message,
                            username: change.value.from.name,
                            commentId: change.value.comment_id
                        };

                        console.log('📝 Comentario recibido:', commentData);

                        // Enviar al servidor de IA
                        const iaResponse = await axios.post(`${IA_SERVER_URL}/process-comment`, commentData);
                        
                        if (iaResponse.data.response) {
                            // Limpiar la respuesta
                            const cleanedResponse = cleanResponse(iaResponse.data.response);
                            console.log('🤖 Respuesta limpia:', cleanedResponse);
                            
                            // Enviar respuesta a Facebook
                            await respondToComment(commentData.commentId, cleanedResponse);
                        }
                    }
                }
            }
            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).send('Error procesando webhook');
    }
});

// Verificación del webhook
router.get('/facebook', (req, res) => {
    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

module.exports = router;
