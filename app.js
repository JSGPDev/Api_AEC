const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const app = express();
const whatsappRoutes = require('./modules/whatsapp');
const fileRoutes = require('./modules/fileOperations');
const sessionRoutes = require('./modules/session')
const pricesRoutes = require('./modules/prices');
const cors = require("cors");
const fs = require('fs').promises;

app.use(cors())
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Asociar las rutas de WhatsApp, correo y operaciones de archivo
app.use('/whatsapp', whatsappRoutes);
app.use('/archivo', fileRoutes);
app.use('/session', sessionRoutes);
app.use('/prices', pricesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    await checkSessions();
    setInterval(checkSessions, 2 * 60 * 60 * 1000);
});

const checkSessions = async () => {
    try {
        // Leer y parsear el archivo JSON
        const data = await fs.readFile('./data/session.json', 'utf-8');
        const sessions = JSON.parse(data);

        // Obtener la hora actual
        const now = new Date();

        // Recorrer las sesiones
        for (let key in sessions) {
            const sessionTime = new Date(sessions[key].hora);

            // Calcular la diferencia de tiempo en milisegundos
            const diff = now - sessionTime;
            const fourHoursInMs = 4 * 60 * 60 * 1000;

            // Si la diferencia es mayor a cuatro horas, eliminar la entrada
            if (diff > fourHoursInMs) {
                delete sessions[key];
            }
        }

        // Guardar el objeto actualizado de vuelta en el archivo JSON
        await fs.writeFile('./data/session.json', JSON.stringify(sessions, null, 2), 'utf-8');
        console.log('Sesiones verificadas y actualizadas.');
    } catch (error) {
        console.error('Error al verificar las sesiones:', error);
    }
}