const express = require('express');
const router = express.Router();
const fs = require('fs').promises;

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
    const { nombreImagen } = req.params;

    try {
        // Lee la imagen del archivo
        const imagen = await fs.readFile(`./imagenes/${nombreImagen}`, 'base64');
        // Envía la imagen como respuesta
        res.send(imagen);
    } catch (error) {
        console.error(error);
        res.status(404).send('Imagen no encontrada');
    }
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
router.get('/ver-contenido', async (req, res) => {
    const { nombreArchivo } = req.body; // El nombre del archivo se pasa como parámetro de consulta
    if (nombreArchivo === 'Credentials') {
        res.status(403).send('No tienes permisos para leer este archivo');
        return;
    }
    try {
        // Lee el contenido del archivo JSON
        const contenido = await fs.readFile(`./data/${nombreArchivo}.json`, 'utf-8');
        // Envía el contenido como respuesta
        res.send(contenido);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al leer el archivo');
    }
});

// Ruta para editar un archivo JSON existente
router.put('/editar-archivo', async (req, res) => {
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

router.put('/modificar-valor', async (req, res) => {
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

module.exports = router;
