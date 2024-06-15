const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const router = express.Router();
const { sendMail } = require('./mail');

router.post('/all', async (req, res) => {
    const { email } = req.body;

    const servicios = JSON.parse(await fs.readFile(`./data/prices.json`, 'utf-8'));
    const contactData = JSON.parse(await fs.readFile(`./data/data.json`, 'utf-8')).contact;


    let tables = '';

    for (const servicio of Object.keys(servicios)) {
        tables += `
        <h2>${servicio}</h2>
        <table>
            <thead>
                <tr>
                    <th>Servicio</th>
                    <th>Tipo</th>
                    <th>Precio</th>
                </tr>
            </thead>
            <tbody>
        `
        for (const func of Object.keys(servicios[servicio])) {
            tables += `
                <tr>
                    <td>${func}</td>
                    <td>${servicios[servicio][func].type}</td>
                    <td>$${servicios[servicio][func].price}</td>
                </tr>
                `
        }

        tables += `
            </tbody>
        </table>
        `
    }

    const html = `
        <!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AEC - Cotización - Servicios </title>
                <style>
                body {
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    margin: 0;
                    background-color: #f4f4f4;
                    color: #555;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }
                main {
                    width: 90vw;
                    max-width: 800px;
                    margin: auto;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                }
                h1, h2 {
                    color: #4CAF50;
                    text-align: center;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    table-layout: fixed;
                    overflow: hidden;
                }
                th, td {
                    padding: 15px;
                    border: 1px solid #ddd;
                    text-align: left;
                    word-wrap: break-word;
                }
                th {
                    background-color: #4CAF50;
                    color: #fff;
                    text-transform: uppercase;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                @media screen and (max-width: 600px) {
                    table, thead, tbody, th, td, tr {
                        display: block;
                    }
                    thead tr {
                        position: absolute;
                        top: -9999px;
                        left: -9999px;
                    }
                    tr {
                        margin: 0 0 1rem 0;
                    }
                    tr:nth-child(even) {
                        background-color: transparent;
                    }
                    td {
                        border: none;
                        border-bottom: 1px solid #ddd;
                        position: relative;
                        padding-left: 50%;
                        text-align: right;
                    }
                    td::before {
                        position: absolute;
                        top: 15px;
                        left: 15px;
                        width: calc(50% - 30px);
                        padding-right: 10px;
                        white-space: nowrap;
                        content: attr(data-label);
                        text-align: left;
                        font-weight: bold;
                    }
                }
            </style>
            </head>
            <body>
                <main>
                    <h1>Cotización de Servicios</h1>
                    ${tables}
                </main>
                <div class="footer">
                        <p>Gracias por su diligencia.</p>
                        <p>Atentamente,</p>
                        <p><strong>Atencion En Casa - AEC</strong></p>
                        <p>Dirección: ${contactData.address} </p>
                        <p>Teléfono: ${contactData.Phone} </p>
                        <p>Email: ${contactData.Email} </p>
                    </div>
            </body>
        </html>
    `;

    // Adjuntar el HTML al correo electrónico
    const mailOptions = {
        from: 'atencionencasa.contacto@gmail.com',
        to: email,
        subject: `Precios de los servicios`,
        html: html
    };

    try {
        const info = await sendMail(mailOptions);
        console.log('Correo enviado:', info);
        res.send(String(html));
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).send({ error: 'Error interno al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde.' });
    }
})

router.post('/quote', async (req, res) => {
    const { nombre, email, serv, funct, cantidad, telefono } = req.body || 'null';

    const servi = JSON.parse(await fs.readFile(`./data/prices.json`, 'utf-8'))[serv];
    const contactData = JSON.parse(await fs.readFile(`./data/data.json`, 'utf-8')).contact;

    const servicio = servi[funct];
    const total = cantidad * servicio.price;

    // Obtener el nombre del host y el protocolo
    const protocol = req.protocol;
    const host = req.get('host');
    const subscribeUrl = `${protocol}://${host}/prices/subscribe/${email}/${nombre}/${telefono}/${serv}/${funct}/${cantidad}`;

    const html = `
        <!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AEC - Cotización - ${funct}</title>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Arial, sans-serif;
                        width: 100vw;
                        margin: 0;
                        background-color: #f4f4f4;
                        color: #555;
                        display: flex;
                        flex-direction: column;
                        min-height: 100vh;
                    }
                    main {
                        width: 50%;
                        max-width: 800px;
                        margin: auto;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        padding: 20px;
                    }
                    h1 {
                        color: #4CAF50;
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    h2 {
                        color: #333;
                        border-bottom: 2px solid #4CAF50;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        table-layout: fixed;
                        overflow: hidden;
                    }
                    th, td {
                        padding: 15px;
                        border: 1px solid #ddd;
                        text-align: left;
                        word-wrap: break-word;
                    }
                    th {
                        background-color: #4CAF50;
                        color: #fff;
                        text-transform: uppercase;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .total {
                        font-size: 1.2em;
                        font-weight: bold;
                        margin-top: 20px;
                        text-align: right;
                        color: #333;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 0.9em;
                        color: #777;
                        text-align: center;
                        border-top: 1px solid #ddd;
                        padding-top: 10px;
                    }
                    .footer p {
                        margin: 5px 0;
                    }

                    @media screen and (max-width: 600px) {
                        table, thead, tbody, th, td, tr {
                            display: block;
                        }
                        thead tr {
                            position: absolute;
                            top: -9999px;
                            left: -9999px;
                        }
                        tr {
                            margin: 0 0 1rem 0;
                        }
                        tr:nth-child(even) {
                            background-color: transparent;
                        }
                        td {
                            border: none;
                            border-bottom: 1px solid #ddd;
                            position: relative;
                            padding-left: 50%;
                            text-align: right;
                        }
                        td::before {
                            position: absolute;
                            top: 15px;
                            left: 15px;
                            width: calc(50% - 30px);
                            padding-right: 10px;
                            white-space: nowrap;
                            content: attr(data-label);
                            text-align: left;
                            font-weight: bold;
                        }
                    }
                </style>
            </head>
            <body>
                <main>
                    <h1>FACTURA</h1>
                    <p>Estimad@ ${nombre},</p>
                    <p>A continuación, encontrará el detalle de los servicios
                        solicitados:</p>

                    <h2>Detalles del Servicio</h2>
                    <table id="factura">
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Precio Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Filas generadas por JavaScript -->
                            <td data-label="Servicio">${funct}</td>
                            <td data-label="Cantidad">${cantidad}</td>
                            <td data-label="Precio Unitario">$${servicio.price}</td>
                            <td data-label="Precio Total">$${total}</td>
                        </tbody>
                    </table>

                    <div class="total" id="totalPrecio">
                        Precio Total: ${total}
                    </div>

                    <p>En caso de querer contratar, por favor haz click aquí: 
                    <a href="${subscribeUrl}">CONTRATAR SERVICIO</a></p>

                    <div class="footer">
                        <p>Gracias por su diligencia.</p>
                        <p>Atentamente,</p>
                        <p><strong>Atencion En Casa - AEC</strong></p>
                        <p>Dirección: ${contactData.address} </p>
                        <p>Teléfono: ${contactData.Phone} </p>
                        <p>Email: ${contactData.Email} </p>
                    </div>
                </main>
            </body>
        </html>
    `;

    // Adjuntar el HTML al correo electrónico
    const mailOptions = {
        from: 'atencionencasa.contacto@gmail.com',
        to: email,
        subject: `Precio de contratación para ${funct}`,
        html: html
    };

    try {
        const info = await sendMail(mailOptions);
        console.log('Correo enviado:', info);
        res.send({ cod_Send: true, html: String(html) });
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).send({ error: 'Error interno al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde.' });
    }
});

router.get('/subscribe/:email/:Nombre/:telefono/:serv/:funct/:cantidad', async (req, res) => {
    const { email, Nombre, telefono, serv, funct, cantidad } = req.params;
    const servi = JSON.parse(await fs.readFile(`./data/prices.json`, 'utf-8'))[serv];
    const contactData = JSON.parse(await fs.readFile(`./data/data.json`, 'utf-8')).contact;
    const servicio = servi[funct];
    const total = cantidad * servicio.price;

    console.log(servicio);

    const htmlClient = `
        <!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AEC - Cotización - Servicios</title>
                <style>
                body {
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    margin: 0;
                    background-color: #f4f4f4;
                    color: #555;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }
                main {
                    width: 90vw;
                    max-width: 800px;
                    margin: auto;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #4CAF50;
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 2em;
                }
                h2 {
                    color: #333;
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    font-size: 1.5em;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    table-layout: fixed;
                    overflow: hidden;
                }
                th, td {
                    padding: 15px;
                    border: 1px solid #ddd;
                    text-align: left;
                    word-wrap: break-word;
                }
                th {
                    background-color: #4CAF50;
                    color: #fff;
                    text-transform: uppercase;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .total {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin-top: 20px;
                    text-align: right;
                    color: #333;
                }
                .footer {
                    margin-top: 30px;
                    font-size: 0.9em;
                    color: #777;
                    text-align: center;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                .footer p {
                    margin: 5px 0;
                }
                @media screen and (max-width: 600px) {
                    table, thead, tbody, th, td, tr {
                        display: block;
                    }
                    thead tr {
                        position: absolute;
                        top: -9999px;
                        left: -9999px;
                    }
                    tr {
                        margin: 0 0 1rem 0;
                    }
                    tr:nth-child(even) {
                        background-color: transparent;
                    }
                    td {
                        border: none;
                        border-bottom: 1px solid #ddd;
                        position: relative;
                        padding-left: 50%;
                        text-align: right;
                    }
                    td::before {
                        position: absolute;
                        top: 15px;
                        left: 15px;
                        width: calc(50% - 30px);
                        padding-right: 10px;
                        white-space: nowrap;
                        content: attr(data-label);
                        text-align: left;
                        font-weight: bold;
                    }
                }
            </style>
            </head>
            <body>
                <main>
                    <h1>FACTURA</h1>
                    <p>Estimado cliente,</p>
                    <p>A continuación, encontrará el detalle de los servicios
                        solicitados:</p>

                    <h2>Detalles del Servicio</h2>
                    <table id="factura">
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Precio Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Filas generadas por JavaScript -->
                            <td data-label="Servicio">${funct}</td>
                            <td data-label="Cantidad">${cantidad}</td>
                            <td data-label="Precio Unitario">$${servicio.price}</td>
                            <td data-label="Precio Total">$${total}</td>
                        </tbody>
                    </table>

                    <div class="total" id="totalPrecio">
                        Precio Total: $${total}
                    </div>

                    <p>Estimado cliente,</p>
                    <p>Nos complace informarle que uno de nuestros representantes se
                        pondrá en contacto con usted en breve para finalizar el proceso
                        de pago y confirmar el servicio solicitado.</p>
                    <p>Agradecemos su
                        paciencia y preferencia.</p>

                    <div class="footer">
                        <p>Gracias por su diligencia.</p>
                        <p>Atentamente,</p>
                        <p><strong>Atencion En Casa - AEC</strong></p>
                        <p>Dirección: ${contactData.address} </p>
                        <p>Teléfono: ${contactData.Phone} </p>
                        <p>Email: ${contactData.Email} </p>
                    </div>
                </main>
            </body>
        </html>
    `
    // Adjuntar el HTML al correo electrónico
    const clientMailOptions = {
        from: 'atencionencasa.contacto@gmail.com',
        to: email,
        subject: `Aviso de contratación para ${funct} - AEC`,
        html: htmlClient
    };

    const htmlAdmin = `
        <!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AEC - Notificación de Pedido de Servicio</title>
                <style>
                body {
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    margin: 0;
                    background-color: #f4f4f4;
                    color: #555;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }
                main {
                    width: 90vw;
                    max-width: 800px;
                    margin: auto;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #4CAF50;
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 2em;
                }
                h2 {
                    color: #333;
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    font-size: 1.5em;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    table-layout: fixed;
                    overflow: hidden;
                }
                th, td {
                    padding: 15px;
                    border: 1px solid #ddd;
                    text-align: left;
                    word-wrap: break-word;
                }
                th {
                    background-color: #4CAF50;
                    color: #fff;
                    text-transform: uppercase;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .total {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin-top: 20px;
                    text-align: right;
                    color: #333;
                }
                .footer {
                    margin-top: 30px;
                    font-size: 0.9em;
                    color: #777;
                    text-align: center;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                .footer p {
                    margin: 5px 0;
                }
                @media screen and (max-width: 600px) {
                    table, thead, tbody, th, td, tr {
                        display: block;
                    }
                    thead tr {
                        position: absolute;
                        top: -9999px;
                        left: -9999px;
                    }
                    tr {
                        margin: 0 0 1rem 0;
                    }
                    tr:nth-child(even) {
                        background-color: transparent;
                    }
                    td {
                        border: none;
                        border-bottom: 1px solid #ddd;
                        position: relative;
                        padding-left: 50%;
                        text-align: right;
                    }
                    td::before {
                        position: absolute;
                        top: 15px;
                        left: 15px;
                        width: calc(50% - 30px);
                        padding-right: 10px;
                        white-space: nowrap;
                        content: attr(data-label);
                        text-align: left;
                        font-weight: bold;
                    }
                }
            </style>
            </head>
            <body>
                <main>
                    <h1>NOTIFICACIÓN DE PEDIDO</h1>
                    <p>Estimado vendedor,</p>
                    <p>Se ha generado un nuevo pedido de servicio con los siguientes
                        detalles:</p>

                    <h2>Detalles del Servicio</h2>
                    <table id="pedido">
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Precio Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Filas generadas por JavaScript -->
                            <td data-label="Servicio">${funct}</td>
                            <td data-label="Cantidad">${cantidad}</td>
                            <td data-label="Precio Unitario">$${servicio.price}</td>
                            <td data-label="Precio Total">$${total}</td>
                        </tbody>
                    </table>
                    <h2>Detalles del Cliente</h2>

                    <table id="cliente">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Telefono</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Filas generadas por JavaScript -->
                            <td data-label="Nombre">${Nombre}</td>
                            <td data-label="Email">${email}</td>
                            <td data-label="Telefono">${telefono}</td>
                        </tbody>
                    </table>

                    <div class="total" id="totalPrecio">
                        Precio Total: $${total}
                    </div>

                    <p>Por favor, proceda a contactar al cliente para finalizar el
                        proceso de pago y confirmar el servicio solicitado. Agradecemos
                        su pronta atención a este pedido.</p>

                    <div class="footer">
                        <p>Gracias por su diligencia.</p>
                        <p>Atentamente,</p>
                        <p><strong>Atencion En Casa - AEC</strong></p>
                        <p>Dirección: ${contactData.address} </p>
                        <p>Teléfono: ${contactData.Phone} </p>
                        <p>Email: ${contactData.Email} </p>
                    </div>
                </main>
            </body>
        </html>
    `

    const adminMailOptions = {
        from: 'atencionencasa.contacto@gmail.com',
        /*/"servicios@atencionencasa.com.co",*/
        to: contactData.Email,
        subject: `Aviso de pedido para ${funct} - AEC`,
        html: htmlAdmin,
        priority: 'high'
    }

    try {
        const infoClient = await sendMail(clientMailOptions);
        const info = await sendMail(adminMailOptions);
        console.log('Correo enviado:', infoClient);
        res.send({ cod_Send: true, html: String(htmlClient) });
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).send({ error: 'Error interno al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde.' });
    }
});

module.exports = router;