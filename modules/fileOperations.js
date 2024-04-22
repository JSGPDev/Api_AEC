const express = require('express');
const router = express.Router();
const fs = require('fs').promises;


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
