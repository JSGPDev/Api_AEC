const express = require('express');
const router = express.Router();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodet = require('qrcode-terminal');
const qrcode = require('qrcode');
const fs = require('fs').promises;

const chatBot = require('./whatsaapBot.js');

let diccionarioUsuarios = {};

let qrCodeUrl = '';
let logged = false;
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

client.on('qr', async (qr) => {
    //qrcodet.generate(qr, { small: true });
    try {
        qrCodeUrl = await qrcode.toDataURL(qr);
    } catch (err) {
        console.error('Error generating QR: ', err);
    }
});

client.on('authenticated', async () => {
    console.log('WHATSAPP WEB => Authenticated');
    logged = true;
});

client.on('ready', async () => {
    console.log('WhatsApp Web is ready');
    try {
        const number = getWhatsAppNumber();
        console.log('WhatsApp number in use:', number);

        // Read the existing file
        const filePath = './data/data.json';
        const existingFile = await fs.readFile(filePath, 'utf-8');

        // Parse the JSON content of the existing file
        const existingContent = JSON.parse(existingFile);

        // Update the specific field
        existingContent.contact.Whatsapp = number.slice(2);

        // Write the updated content to the file
        await fs.writeFile(filePath, JSON.stringify(existingContent, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error obtaining user information:', error);
    }
});

client.on('disconnected', async (reason) => {
    console.log('The client is disconnected:', reason);
    logged = false;
    client.info = null;
    client.initialize();
    console.log('Session destroyed successfully');
});

client.on('message', async message => {
    let chatId = message.from;
    let phoneNumber = chatId.split('@')[0];

    // Verificar si el número ya está registrado en el diccionario
    if (!diccionarioUsuarios[phoneNumber]) {
        // Si no está, agregar al diccionario
        diccionarioUsuarios[phoneNumber] = new chatBot(phoneNumber);
        //client.sendMessage(chatId, `Hola :) Tu número es ${phoneNumber} y has sido registrado.`);
    }

    const respons = diccionarioUsuarios[phoneNumber].handleUserResponse(message.body)
    // Usar la función handleResponse del chatBot para el usuario específico
    client.sendMessage(chatId, respons);
    if (message.body.trim().toLowerCase() === 'adios') {
        delete diccionarioUsuarios[phoneNumber];
    }
});


const getWhatsAppNumber = () => {
    try {
        const userInfo = client.info;
        if (userInfo && userInfo.wid) {
            return userInfo.wid.user;
        }
        return null;
    } catch (error) {
        console.error('Error obtaining user information:', error);
        return null;
    }
};

async function getProfilePicUrl(session) {
    try {
        if (!session || !session.wid) {
            throw new Error('Session is not defined or invalid');
        }
        const contact = await client.getContactById(session.wid._serialized);
        return contact.getProfilePicUrl();
    } catch (error) {
        console.error('Error obtaining profile picture:', error);
        return null;
    }
}

router.get('/qr-code', async (req, res) => {
    try {
        if (client.info || logged) {
            const session = client.info;
            const profilePicUrl = await getProfilePicUrl(session);
            res.send({ "status": "logged", "img": `<img src="${profilePicUrl}" alt="Profile Picture">`, "number": getWhatsAppNumber() });
        } else if (qrCodeUrl) {
            res.send({ "status": "stand-by", "img": `<img src="${qrCodeUrl}" alt="QR Code">` });
        } else {
            res.status(500).send({ "status": "fail", "message": 'Error generating QR' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ "status": "fail", "message": 'Error generando QR' });
    }
});

router.delete('/whatsapp-session', async (req, res) => {
    const { session } = req.body;
    try {
        const sessions = JSON.parse(await fs.readFile('./data/session.json', 'utf-8'));
        if (!sessions.hasOwnProperty(session)) {
            return res.status(403).send('La sesión no existe o expiró, por favor inicia sesión nuevamente');
        }
        await client.logout().then(() => {
            logged = false;
            client.info = null;
            client.initialize();
            console.log('Session destroyed successfully');
            res.send({ "correct": true, "message": 'Session destroyed successfully' });
        });
    } catch (error) {
        res.status(500).send({ "correct": false, "message": 'Error destroying session: ' + error.message });
        console.log('Error destroying session: ' + error);
    }
});

module.exports = router;
