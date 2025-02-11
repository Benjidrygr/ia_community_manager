const express = require("express");
const bodyParser = require("express").json;
const dotenv = require("dotenv");

dotenv.config(); 

const webhookRoutes = require("./api/routes/webhooks");

const app = express();
app.use(bodyParser());

app.use("/webhooks", webhookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
