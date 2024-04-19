const express = require('express');
require('dotenv').config();
const fs = require('fs').promises; // Importa el módulo 'fs' para operaciones de archivo

const app = express();
// Middleware para analizar el cuerpo de las solicitudes entrantes como JSON
app.use(express.json());

const qrcodet = require('qrcode-terminal');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
});

let qrCodeUrl = '';

client.on('qr', async (qr) => {
    qrcodet.generate(qr, { small: true })
    try {
        qrCodeUrl = await qrcode.toDataURL(qr);
    } catch (err) {
        console.error('Error generando QR: ', err);
    }
});

client.on('ready', () => {
    console.log('WhatsApp Web está listo');
});

client.on('message', message => {
    if (message.body === 'hola') {
        client.sendMessage(message.from, 'hola :)')
    }
});

client.initialize();

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
        await fs.writeFile(`${nombreArchivo}.json`, JSON.stringify(contenido));
        res.send('Archivo creado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear el archivo');
    }
});

// Ruta para editar un archivo JSON existente
app.put('/editar-archivo', async (req, res) => {
    const { nombreArchivo, nuevoContenido } = req.body;

    try {
        // Lee el archivo existente
        const archivo = await fs.readFile(`${nombreArchivo}.json`, 'utf-8');
        // Parsea el contenido JSON del archivo
        const contenidoExistente = JSON.parse(archivo);
        // Fusiona el nuevo contenido con el existente
        const contenidoActualizado = { ...contenidoExistente, ...nuevoContenido };
        // Escribe el contenido actualizado en el archivo
        await fs.writeFile(`${nombreArchivo}.json`, JSON.stringify(contenidoActualizado));
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
        const archivo = await fs.readFile(`${nombreArchivo}.json`, 'utf-8');
        const contenido = JSON.parse(archivo);

        // Modifica el valor de la clave específica
        contenido[clave] = nuevoValor;

        // Escribe el contenido modificado de vuelta al archivo
        await fs.writeFile(`${nombreArchivo}.json`, JSON.stringify(contenido));
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
        await fs.unlink(`${nombreArchivo}.json`);
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
