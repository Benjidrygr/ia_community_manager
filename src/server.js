require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Importamos el webhook desde /api/webhooks.js
const webhooks = require("./api/webhooks");

// Ruta para los webhooks de Meta (Facebook e Instagram)
app.use("/webhook", webhooks);

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("🚀 Servidor funcionando correctamente en Render!");
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});

