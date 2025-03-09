const express = require("express");
const router = express.Router();
const { verifyWebhook } = require("../controllers/webhookController");
const { processEvent } = require("../controllers/facebookController");

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

// Procesar eventos de Facebook
router.post('/facebook', async (req, res) => {
    try {
        await processEvent(req.body);
        res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).send('Error procesando webhook');
    }
});

module.exports = router;
