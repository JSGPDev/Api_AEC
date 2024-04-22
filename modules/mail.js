const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();


let transporter = nodemailer.createTransport({
    service: 'Gmail', // Puedes cambiarlo por otros servicios como 'hotmail', 'yahoo', etc.
    auth: {
        user: process.env.MAILER_MAIL, // Tu dirección de correo electrónico
        pass: process.env.MAILER_PASS // Tu contraseña de correo electrónico
    }
});

/*let mailOptions = {
    from: 'tu_correo@gmail.com', // Quién envía el correo electrónico
    to: 'destinatario@example.com', // Quién recibe el correo electrónico
    subject: 'Asunto del correo', // Asunto del correo electrónico
    text: 'Contenido del correo electrónico' // Contenido del correo electrónico en texto sin formato
    // O puedes usar 'html' para enviar contenido en HTML
    // html: '<h1>Contenido del correo electrónico en HTML</h1>'
};*/


//estructura para enviar el mail
const sendMail = (mailOptions) => {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error(error);
                reject(error); // Rechaza la promesa si hay un error
            } else {
                console.log('Correo electrónico enviado: ' + info.response);
                resolve(info); // Resuelve la promesa con la información del correo enviado
            }
        });
    });
};

module.exports = { sendMail };