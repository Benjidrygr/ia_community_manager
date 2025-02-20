const express = require("express");
const cors = require("cors");
require("dotenv").config();

const webhookRoutes = require("./api/routes/webhooks"); // Importamos el webhook
const app = express();
const PORT = process.env.PORT || 10000; // Render usa 10000 por defecto

// Middleware
app.use(cors());
app.use(express.json()); // Asegura que el body de las peticiones POST sea procesado

// Logs generales para cualquier petición
app.use((req, res, next) => {
    console.log(`🔹 Nueva solicitud: ${req.method} ${req.url}`);
    next();
});

// **Rutas**
app.use("/webhook", webhookRoutes); // Usa el archivo de webhooks

// **Iniciar servidor**
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
