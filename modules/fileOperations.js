const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fsSync.existsSync(uploadDir)) {
            fsSync.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('imagen');

router.post('/modificar-card-imagen', async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ correcto: false, error: err.message });
        } else if (err) {
            return res.status(400).json({ correcto: false, error: 'Solo se permiten imágenes' });
        }

        try {
            const { session, nombreArchivo, campo, valor } = req.body;

            const sessions = JSON.parse(await fs.readFile(`./data/session.json`, 'utf-8'));

            if (!sessions.hasOwnProperty(session)) {
                console.log('La sesión no existe o expiró');
                return res.status(403).send('La sesión no existe o expiró, por favor inicia sesión nuevamente');
            }

            const imagePath = req.file ? req.file.filename : null;

            // Parse the value field to an object if it's a string
            let valorParsed = typeof valor === 'string' ? JSON.parse(valor) : valor;

            if (imagePath) {
                const host = req.get('host');
                const imageUrl = `http://${host}/archivo/traer-imagen/${imagePath}`;
                valorParsed.img = imageUrl;
            }

            const archivoPath = `./data/${nombreArchivo}.json`;
            const archivoExistente = await fs.readFile(archivoPath, 'utf-8');
            const contenidoExistente = JSON.parse(archivoExistente);

            const keys = campo.split('.');
            let obj = contenidoExistente;
            for (let i = 0; i < keys.length - 1; i++) {
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = valorParsed;

            await fs.writeFile(archivoPath, JSON.stringify(contenidoExistente, null, 2), 'utf-8');

            res.status(201).json({ correcto: true, message: 'Archivo editado exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ correcto: false, error: 'Ocurrió un error al subir la imagen' });
        }
    });
});

// Ruta para cargar una imagen
router.post('/cargar-imagen', async (req, res) => {
    const { nombreImagen, imagen } = req.body;

    try {
        // Escribe la imagen en el archivo
        await fs.writeFile(`./imagenes/${nombreImagen}`, imagen, 'base64');
        res.send('Imagen cargada exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la imagen');
    }
});

// Ruta para descargar una imagen
router.get('/traer-imagen/:nombreImagen', async (req, res) => {
    const filename = req.params.nombreImagen;
    const imagePath = path.resolve(__dirname, '..', 'uploads', filename);
    res.sendFile(imagePath, (err) => {
        if (err) {
            res.status(404).json({ correcto: false, error: 'Imagen no encontrada' });
        }
    });
});

// Ruta para crear un archivo JSON
router.post('/crear-archivo', async (req, res) => {
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

// Ruta para leer el contenido de un archivo JSON
router.get('/ver-contenido/:nombreArchivo', async (req, res) => {
    const { nombreArchivo } = req.params; // El nombre del archivo se pasa como parámetro de consulta
    if (nombreArchivo === 'Credentials') {
        res.status(403).send('No tienes permisos para leer este archivo');
        return;
    }
    try {
        // Lee el contenido del archivo JSON
        const contenido = await fs.readFile(`./data/${nombreArchivo}.json`, 'utf-8');
        // Envía el contenido como respuesta
        res.send(JSON.parse(contenido));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al leer el archivo');
    }
});

router.put('/editar-archivo', async (req, res) => {
    const { session, nombreArchivo, campo, valor } = req.body;

    try {
        // Lee el archivo de sesiones y verifica la sesión
        const sessions = JSON.parse(await fs.readFile(`./data/session.json`, 'utf-8'));
        if (!sessions.hasOwnProperty(session)) {
            return res.status(403).send('La sesión no existe o expiró, por favor inicia sesión nuevamente');
        }

        // Verifica permisos para editar el archivo
        if (nombreArchivo === "Credentials") {
            return res.status(403).send('No tienes permisos para modificar este archivo');
        }

        // Lee el archivo existente
        const archivoPath = `./data/${nombreArchivo}.json`;
        const archivoExistente = await fs.readFile(archivoPath, 'utf-8');

        // Parsea el contenido JSON del archivo existente
        const contenidoExistente = JSON.parse(archivoExistente);

        // Actualiza el campo específico
        const keys = campo.split('.'); // Soporte para nested properties
        let obj = contenidoExistente;
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = valor;

        // Escribe el contenido actualizado en el archivo
        await fs.writeFile(archivoPath, JSON.stringify(contenidoExistente, null, 2), 'utf-8');
        res.send('Archivo editado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al editar el archivo');
    }
});

// Ruta para eliminar un archivo JSON
router.delete('/eliminar-archivo', async (req, res) => {
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

router.delete('/eliminar-dato', async (req, res) => {
    const { session, nombreArchivo, campo } = req.body;

    try {
        // Lee el archivo de sesiones y verifica la sesión
        const sessions = JSON.parse(await fs.readFile(`./data/session.json`, 'utf-8'));
        if (!sessions.hasOwnProperty(session)) {
            return res.status(403).send('La sesión no existe o expiró, por favor inicia sesión nuevamente');
        }

        // Verifica permisos para eliminar la ruta
        if (nombreArchivo === "Credentials") {
            return res.status(403).send('No tienes permisos para modificar este archivo');
        }

        // Lee el archivo existente
        const archivoPath = `./data/${nombreArchivo}.json`;
        const archivoExistente = await fs.readFile(archivoPath, 'utf-8');

        // Parsea el contenido JSON del archivo existente
        const contenidoExistente = JSON.parse(archivoExistente);

        // Elimina la ruta específica
        const keys = campo.split('.'); // Soporte para nested properties
        let obj = contenidoExistente;
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        delete obj[keys[keys.length - 1]];

        // Escribe el contenido actualizado en el archivo
        await fs.writeFile(archivoPath, JSON.stringify(contenidoExistente, null, 2), 'utf-8');
        res.send('Ruta eliminada exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar la ruta');
    }
});


module.exports = router;
