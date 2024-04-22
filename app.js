const express = require('express');
const app = express();
const whatsappRoutes = require('./modules/whatsapp');
const mail = require('./modules/mail');
const fileRoutes = require('./modules/fileOperations');

app.use(express.json());

// Asociar las rutas de WhatsApp, correo y operaciones de archivo
app.use('/whatsapp', whatsappRoutes);
app.use('/archivo', fileRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
