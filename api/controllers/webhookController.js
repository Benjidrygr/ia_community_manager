const { logInfo, logError } = require("../utils/logger");
const facebookController = require("./facebookController");
const instagramController = require("./instagramController");

exports.verifyWebhook = (req, res) => {
    logInfo(`Solicitud GET recibida: ${req.url}`);

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const FACEBOOK_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
    const INSTAGRAM_VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN;

    if (mode && (token === FACEBOOK_VERIFY_TOKEN || token === INSTAGRAM_VERIFY_TOKEN)) {
        logInfo("✅ Webhook verificado correctamente.");
        return res.status(200).send(challenge);
    } else {
        logError("❌ Error de verificación del webhook.");
        return res.sendStatus(403);
    }
};

exports.handleWebhookEvent = (req, res) => {
    logInfo("📩 Evento recibido:", req.body);

    if (!req.body || typeof req.body !== "object") {
        logError("❌ El cuerpo de la solicitud POST es inválido.");
        return res.status(400).send("Invalid request body");
    }

    // Verificar si el evento proviene de Facebook o Instagram
    if (req.body.object === "page") {
        facebookController.processEvent(req.body);
    } else if (req.body.object === "instagram") {
        instagramController.processEvent(req.body);
    } else {
        logError("❌ Evento desconocido recibido.");
        return res.status(400).send("Evento no reconocido");
    }

    res.status(200).send("EVENT_RECEIVED");
};
