const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    console.log("➡️ GET recibido en /webhook");

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const FACEBOOK_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
    const INSTAGRAM_VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN;

    if (mode && (token === FACEBOOK_VERIFY_TOKEN || token === INSTAGRAM_VERIFY_TOKEN)) {
        console.log("✅ Webhook verificado correctamente.");
        return res.status(200).send(challenge);
    } else {
        console.log("❌ Error de verificación.");
        return res.sendStatus(403);
    }
});

router.post("/", (req, res) => {
    console.log("📩 POST recibido en /webhook");
    console.log("Evento recibido:", JSON.stringify(req.body, null, 2));
    res.status(200).send("EVENT_RECEIVED");
});

module.exports = router;
