const express = require('express');
const { sendMail } = require('./mail');
const router = express.Router();
const bcrypt = require('bcrypt');
const { randomBytes } = require('crypto');
const fs = require('fs').promises;

let user_data_temp = {}; // Variable global para almacenar los datos temporales del usuario
let log_in_trys_amount = 0;
const max_log_in_trys_amount = 5;

// Función para limpiar los datos temporales después de un tiempo determinado
const resetTempData = () => {
    setTimeout(() => {
        user_data_temp = {};
    }, 300000); // 5 minutos en milisegundos
}

const resetTrys = () => {
    setTimeout(() => {
        log_in_trys_amount = 0;
    }, 600000); // 5 minutos en milisegundos
}

router.post('/log-in', async (req, res) => {
    const { user, password } = req.body;
    if (log_in_trys_amount < max_log_in_trys_amount) {

        try {
            // Lee el contenido del archivo JSON
            const contenido = await fs.readFile(`./data/Credentials.json`, 'utf-8');
            // Parsea el contenido JSON del archivo
            const credenciales = JSON.parse(contenido);

            // Busca el usuario en el archivo de credenciales
            const usuarioEncontrado = Object.values(credenciales).find(item => item.user === user);
            if (usuarioEncontrado) {
                // Verifica la contraseña utilizando bcrypt
                const passwordMatch = await bcrypt.compare(password, usuarioEncontrado.pass);
                if (passwordMatch) {
                    // Credenciales correctas
                    console.log("credenciales correctas");

                    console.log("creando sesion");

                    const nombreArchivo = "session";
                    const idUnico = randomBytes(6).toString('hex');
                    const nuevoContenido = {
                        [idUnico]: {
                            "hora": new Date()
                        }
                    }

                    // Edita el archivo
                    try {
                        // Lee el archivo existente
                        const archivo = await fs.readFile(`./data/${nombreArchivo}.json`, 'utf-8');
                        // Parsea el contenido JSON del archivo
                        const contenidoExistente = JSON.parse(archivo);
                        // Fusiona el nuevo contenido con el existente
                        const contenidoActualizado = { ...contenidoExistente, ...nuevoContenido };
                        // Escribe el contenido actualizado en el archivo
                        await fs.writeFile(`./data/${nombreArchivo}.json`, JSON.stringify(contenidoActualizado));
                        console.log('Archivo editado exitosamente');
                    } catch (error) {
                        console.error('Error al editar el archivo:', error);
                        res.status(500).send('Error al editar el archivo');
                        return; // Importante: detener la ejecución del código aquí para evitar enviar múltiples respuestas
                    }

                    setTimeout(async () => {
                        try {
                            // Lee el contenido del archivo de sesiones
                            const contenido = await fs.readFile('./data/session.json', 'utf-8');
                            // Parsea el contenido JSON del archivo
                            const sesiones = JSON.parse(contenido);

                            // Elimina la entrada de sesión correspondiente al idSesion
                            delete sesiones[idUnico];

                            // Escribe el contenido actualizado en el archivo
                            await fs.writeFile('./data/session.json', JSON.stringify(sesiones));
                            console.log('Entrada de sesión eliminada correctamente');
                        } catch (error) {
                            console.error('Error al eliminar la entrada de sesión:', error);
                            throw error;
                        }
                    }, 4 * 3600 * 1000);

                    // Envía la respuesta de inicio de sesión al cliente
                    res.send({ "correct": true, "sessionId": idUnico, "message": "session iniciada correctamente" });
                } else {
                    // Credenciales incorrectas
                    log_in_trys_amount++;
                    res.send({ "correct": false, "message": "Usuario no encontrado" });
                }
            } else {
                // Usuario no encontrado
                log_in_trys_amount++;
                res.send({ "correct": false, "message": "Usuario no encontrado" });
            }
        } catch (error) {
            console.error('Error al leer el archivo:', error);
            res.status(500).send('Error al leer el archivo');
        }
    } else {
        resetTrys();
        res.status(429).send("Demasiadas solicitudes, por favor intenta más tarde");
    }
});

router.get('/islogged/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId;
    try {
        const nombreArchivo = "session"; // El nombre del archivo se pasa como parámetro de consulta

        // Lee el contenido del archivo JSON
        const contenido = await fs.readFile(`./data/${nombreArchivo}.json`, 'utf-8');
        const sesiones = JSON.parse(contenido);

        // Verifica si el ID de sesión proporcionado existe en las sesiones activas
        if (sesiones.hasOwnProperty(sessionId)) {
            // Si el ID de sesión está presente, el usuario está autenticado
            res.send({ "logged": true });
        } else {
            // Si el ID de sesión no está presente, el usuario no está autenticado
            res.send({ "logged": false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al leer el archivo');
    }
});


router.put('/sign-up', async (req, res) => {
    const { user, password } = req.body;

    const contenido = await fs.readFile(`./data/Credentials.json`, 'utf-8');
    // Parsea el contenido JSON del archivo
    const credenciales = JSON.parse(contenido);

    const usuarioEncontrado = Object.values(credenciales).find(item => item.user === user);

    if (usuarioEncontrado) {
        res.status(403).send("El correo proporcionado ya se encuentra registrado");
        return;
    }

    let codigo = Math.floor(100000 + Math.random() * 900000);

    user_data_temp[user] = { // Almacena los datos temporales del usuario en el objeto user_data_temp
        pass: password,
        cod: codigo,
        timestamp: Date.now() // Marca de tiempo actual
    };

    resetTempData(); // Inicia el temporizador para limpiar los datos después de un tiempo determinado

    let mailOptions = {
        from: 'atencionencasa.contacto@gmail.com',
        to: user,
        subject: 'Código de Verificación',
        html: `
            <p>Hola,</p>
            <p>Has solicitado un código de verificación para registrarte en nuestro servicio.</p>
            <p>Tu código de verificación es: <strong>${codigo}</strong></p>
            <p>Utiliza este código para completar tu registro.</p>
            <p>Si no has solicitado este código, puedes ignorar este correo electrónico.</p>
            <p>Atentamente,</p>
            <p>El equipo de Atención en Casa</p>
        `
    };
    try {
        const info = await sendMail(mailOptions);
        console.log('Correo enviado:', info);
        res.send({ cod_Send: true });
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).send({ error: 'Error interno al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde.' });
    }
});

router.put('/check-code', async (req, res) => {
    const { user, cod } = req.body;
    const saltRounds = 10;

    // Verificar la existencia del usuario en user_data_temp
    if (!user_data_temp[user]) {
        return res.status(400).send('El usuario no ha solicitado ningún código de verificación.');
    }

    // Validar los datos de entrada
    if (!user || !cod) {
        return res.status(400).send('El nombre de usuario y el código de verificación son obligatorios.');
    }

    // Verificar si el código de verificación coincide
    if (user_data_temp[user].cod === cod) {
        try {
            const hashedPassword = await bcrypt.hash(user_data_temp[user].pass, saltRounds);
            // Leer el archivo existente de credenciales
            const archivo = await fs.readFile(`./data/Credentials.json`, 'utf-8');
            // Parsear el contenido JSON del archivo
            const contenidoExistente = JSON.parse(archivo);
            // Definir el nuevo contenido
            const nuevoContenido = {
                [Object.keys(contenidoExistente).length]: {
                    user: user,
                    pass: hashedPassword
                }
            };
            // Fusionar el nuevo contenido con el existente
            const contenidoActualizado = { ...contenidoExistente, ...nuevoContenido };
            // Escribir el contenido actualizado en el archivo
            await fs.writeFile(`./data/Credentials.json`, JSON.stringify(contenidoActualizado));

            // Enviar respuesta de éxito
            res.send({ cod_ok: true });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al editar el archivo');
        }
    } else {
        // Enviar respuesta si el código de verificación no coincide
        res.status(400).send('El código de verificación proporcionado no es válido.');
    }
});

router.post('/forgot-password', async (req, res) => {
    const { user } = req.body;

    try {
        // Verificar si el usuario existe en el archivo de credenciales
        const contenido = await fs.readFile(`./data/Credentials.json`, 'utf-8');
        const credenciales = JSON.parse(contenido);
        const usuario = Object.values(credenciales).find(credencial => credencial.user === user);

        if (usuario) {
            // Generar un nuevo código de verificación para la contraseña
            const newPasswordCode = Math.floor(100000 + Math.random() * 900000);

            // Guardar el código de verificación temporalmente en user_data_temp
            user_data_temp[user] = {
                newPasswordCode: newPasswordCode,
                timestamp: Date.now()
            };

            // Enviar un correo electrónico al usuario con el código de verificación
            const mailOptions = {
                from: 'atencionencasa.contacto@gmail.com',
                to: user,
                subject: 'Recuperación de Contraseña',
                html: `
                    <p>Hola,</p>
                    <p>Has solicitado la recuperación de tu contraseña.</p>
                    <p>Tu código de verificación es: <strong>${newPasswordCode}</strong></p>
                    <p>Utiliza este código para restablecer tu contraseña.</p>
                    <p>Si no has solicitado la recuperación de tu contraseña, puedes ignorar este correo electrónico.</p>
                    <p>Atentamente,</p>
                    <p>El equipo de Atención en Casa</p>
                `
            };

            await sendMail(mailOptions);

            res.send({ message: 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.' });
        } else {
            res.status(404).send({ error: 'El usuario especificado no existe.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno al procesar la solicitud de recuperación de contraseña.' });
    }
});

router.put('/reset-password', async (req, res) => {
    const { user, newPassword, verificationCode } = req.body;
    const saltRounds = 10;

    // Verificar si el usuario ha solicitado la recuperación de contraseña y tiene un código de verificación válido
    if (!user_data_temp[user] || user_data_temp[user].newPasswordCode !== verificationCode) {
        return res.status(400).send({ error: 'Código de verificación inválido o expirado.' });
    }

    // Verificar si el código de verificación no ha expirado (5 minutos de ventana)
    if (Date.now() - user_data_temp[user].timestamp > 300000) {
        delete user_data_temp[user]; // Eliminar los datos temporales del usuario si el código ha expirado
        return res.status(400).send({ error: 'El código de verificación ha expirado. Solicita uno nuevo.' });
    }

    try {
        // Leer el archivo de credenciales existente
        const archivo = await fs.readFile(`./data/Credentials.json`, 'utf-8');
        const credenciales = JSON.parse(archivo);

        // Verificar si el usuario existe en las credenciales
        if (!credenciales[user]) {
            return res.status(404).send({ error: 'El usuario especificado no existe.' });
        }

        // Encriptar la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar la contraseña del usuario en el archivo de credenciales
        credenciales[user].password = hashedPassword;

        // Escribir el archivo actualizado
        await fs.writeFile(`./data/Credentials.json`, JSON.stringify(credenciales));

        // Eliminar los datos temporales del usuario después de restablecer la contraseña
        delete user_data_temp[user];

        res.send({ message: 'Contraseña restablecida exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno al restablecer la contraseña.' });
    }
});

module.exports = router; 