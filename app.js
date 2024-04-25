const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const whatsappRoutes = require('./modules/whatsapp');
const fileRoutes = require('./modules/fileOperations');
const sessionRoutes = require('./modules/session')
const mail = require('./modules/mail');


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Asociar las rutas de WhatsApp, correo y operaciones de archivo
app.use('/whatsapp', whatsappRoutes);
app.use('/archivo', fileRoutes);
app.use('/session', sessionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
