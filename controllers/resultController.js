const db = require('../config/db').default; // Asegúrate de que esta ruta sea correcta

exports.guardarResultados = (req, res) => {
    const { Id_usuario, respuestas } = req.body;

    console.log("Iniciando proceso para guardar resultados...");

    if (!Id_usuario || !respuestas || Object.keys(respuestas).length === 0) {
        console.error("Datos incompletos. Asegúrate de enviar Id_usuario y respuestas.");
        return res.status(400).json({ error: 'Datos incompletos. Asegúrate de enviar Id_usuario y respuestas.' });
    }

    console.log(`Id_usuario: ${Id_usuario}, Respuestas: ${JSON.stringify(respuestas)}`);

    let basicoCorrectas = 0;
    let medioCorrectas = 0;
    let avanzadoCorrectas = 0;

    const respuestasCorrectas = {
        1: 'Sí',
        2: 'Sí',
        3: 'Sí',
        4: 'Sí',
        5: 'Sí',
        6: 'Sí',
        7: 'Sí',
        8: 'Sí',
        9: 'Sí',
        10: 'Sí'
    };

    let todasRespuestasNo = true;

    for (let idPregunta in respuestas) {
        const respuestaUsuario = respuestas[idPregunta];

        if (respuestaUsuario === 'Sí' && respuestasCorrectas[idPregunta] === respuestaUsuario) {
            if (idPregunta <= 4) {
                basicoCorrectas++;
            } else if (idPregunta >= 5 && idPregunta <= 7) {
                medioCorrectas++;
            } else if (idPregunta >= 8 && idPregunta <= 10) {
                avanzadoCorrectas++;
            }
        }

        if (respuestaUsuario !== 'No') {
            todasRespuestasNo = false;
        }
    }

    console.log(`Respuestas correctas por nivel -> Básico: ${basicoCorrectas}, Medio: ${medioCorrectas}, Avanzado: ${avanzadoCorrectas}`);

    let nivelUsuario = 'Básico';

    if (!todasRespuestasNo) {
        if (basicoCorrectas >= 3) {
            nivelUsuario = 'Básico';
        }
        if (basicoCorrectas >= 3 && medioCorrectas >= 2) {
            nivelUsuario = 'Medio';
        }
        if (basicoCorrectas >= 3 && medioCorrectas >= 2 && avanzadoCorrectas >= 2) {
            nivelUsuario = 'Avanzado';
        }
    } else {
        nivelUsuario = 'Básico';
    }

    console.log(`Nivel asignado al usuario: ${nivelUsuario}`);

    const insertQuery = 'INSERT INTO respuestas (Id_usuario, Nivel, completado) VALUES (?, ?, TRUE) ON DUPLICATE KEY UPDATE Nivel = VALUES(Nivel), completado = TRUE';
    const values = [Id_usuario, nivelUsuario];

    db.query(insertQuery, values, (err, result) => {
        if (err) {
            console.error('Error al guardar los resultados en la base de datos:', err);
            return res.status(500).json({ error: 'Error interno al guardar los resultados.' });
        }

        console.log("Resultados guardados exitosamente en la base de datos.");
        res.status(200).json({ message: 'Resultados guardados exitosamente.', nivel: nivelUsuario });
    });
};
