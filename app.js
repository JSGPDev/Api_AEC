const express = require('express');
const nodemailer = require('nodemailer');
const qrcodet = require('qrcode-terminal');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs').promises; // Importa el módulo 'fs' para operaciones de archivo
require('dotenv').config();

const app = express();
// Middleware para analizar el cuerpo de las solicitudes entrantes como JSON
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-one"
    }),
    puppeteer: {
        headless: true,
    },
    webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
});

client.initialize();

let qrCodeUrl = '';

client.on('qr', async (qr) => {
    qrcodet.generate(qr, { small: true })
    try {
        qrCodeUrl = await qrcode.toDataURL(qr);
    } catch (err) {
        console.error('Error generando QR: ', err);
    }
});

client.on('authenticated', (session) => {
    console.log('WHATSAPP WEB => Authenticated');
});

client.on('ready', () => {
    console.log('WhatsApp Web está listo');
});

client.on('message', message => {
    if (message.body === 'hola') {
        client.sendMessage(message.from, 'hola :)')
    }
});

let transporter = nodemailer.createTransport({
    service: 'Gmail', // Puedes cambiarlo por otros servicios como 'hotmail', 'yahoo', etc.
    auth: {
        user: process.env.MAILER_MAIL, // Tu dirección de correo electrónico
        pass: process.env.MAILER_PASS // Tu contraseña de correo electrónico
    }
});

let mailOptions = {
    from: 'tu_correo@gmail.com', // Quién envía el correo electrónico
    to: 'destinatario@example.com', // Quién recibe el correo electrónico
    subject: 'Asunto del correo', // Asunto del correo electrónico
    text: 'Contenido del correo electrónico' // Contenido del correo electrónico en texto sin formato
    // O puedes usar 'html' para enviar contenido en HTML
    // html: '<h1>Contenido del correo electrónico en HTML</h1>'
};


//estructura para enviar el mail
/*transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Correo electrónico enviado: ' + info.response);
    }
});*/

app.get('/qr-code', (req, res) => {
    if (qrCodeUrl !== '') {
        res.send(`<img src="${qrCodeUrl}" alt="QR Code">`);
    } else {
        res.status(500).send('Error generando QR');
    }
});

// Ruta para crear un archivo JSON
app.post('/crear-archivo', async (req, res) => {
    const { nombreArchivo, contenido } = req.body;

    try {
        // Escribe el contenido en el archivo
        await fs.writeFile(`./data/${nombreArchivo}.json`, JSON.stringify(contenido));
        res.send('Archivo creado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear el archivo');
    }
});

// Ruta para editar un archivo JSON existente
app.put('/editar-archivo', async (req, res) => {
    const { nombreArchivo, nuevoContenido } = req.body;
    if (nombreArchivo === "Credentials") {
        res.status(403).send('No tienes permisos para modificar este archivo');
        return;
    }
    try {
        // Lee el archivo existente
        const archivo = await fs.readFile(`./data/${nombreArchivo}.json`, 'utf-8');
        // Parsea el contenido JSON del archivo
        const contenidoExistente = JSON.parse(archivo);
        // Fusiona el nuevo contenido con el existente
        const contenidoActualizado = { ...contenidoExistente, ...nuevoContenido };
        // Escribe el contenido actualizado en el archivo
        await fs.writeFile(`./data/${nombreArchivo}.json`, JSON.stringify(contenidoActualizado));
        res.send('Archivo editado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al editar el archivo');
    }
});

app.put('/modificar-valor', async (req, res) => {
    const { nombreArchivo, clave, nuevoValor } = req.body;

    try {
        // Lee el archivo JSON existente
        const archivo = await fs.readFile(`./data/${nombreArchivo}.json`, 'utf-8');
        const contenido = JSON.parse(archivo);

        // Modifica el valor de la clave específica
        contenido[clave] = nuevoValor;

        // Escribe el contenido modificado de vuelta al archivo
        await fs.writeFile(`./data/${nombreArchivo}.json`, JSON.stringify(contenido));
        res.send('Valor modificado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al modificar el valor');
    }
});

// Ruta para eliminar un archivo JSON
app.delete('/eliminar-archivo', async (req, res) => {
    const { nombreArchivo } = req.body;

    try {
        // Elimina el archivo JSON
        await fs.unlink(`./data/${nombreArchivo}.json`);
        res.send('Archivo eliminado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar el archivo');
    }
});

// Puerto en el que el servidor escuchará las solicitudes
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
