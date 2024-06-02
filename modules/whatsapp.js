const express = require('express');
const router = express.Router();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodet = require('qrcode-terminal');
const qrcode = require('qrcode');

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
    //qrcodet.generate(qr, { small: true })
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

router.get('/qr-code', (req, res) => {
    if (qrCodeUrl !== '') {
        res.send(`<img src="${qrCodeUrl}" alt="QR Code">`);
    } else {
        res.status(500).send('Error generando QR');
    }
});

module.exports = router;
