const db = require('../config/db');
const transporter = require('../config/mailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); // Cambiado a bcryptjs

// Registro de usuario
exports.registro = async (req, res) => {
    const { Usuario, Correo, Contraseña } = req.body;
    
    if (!Usuario || !Correo || !Contraseña) {
        return res.status(400).json({ message: 'Por favor, complete todos los campos.' });
    }

    // Validar correo electrónico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;
    if (!emailRegex.test(Correo)) {
        return res.status(400).json({ message: 'Por favor, ingrese un correo electrónico válido (Gmail, Yahoo Mail, Outlook).' });
    }

    // Validar contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
    if (!passwordRegex.test(Contraseña)) {
        return res.status(400).json({ message: 'La contraseña debe tener entre 8 y 12 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(Contraseña, 10); // Uso de bcryptjs para hashear

        if (!db) {
            console.error('Database connection is not defined');
            return res.status(500).json({ message: 'Error en la conexión a la base de datos' });
        }

        const sql = 'INSERT INTO registro (Usuario, Correo, Contraseña) VALUES (?, ?, ?)';
        db.query(sql, [Usuario, Correo, hashedPassword], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
                } else {
                    console.error('Error inserting into database:', err);
                    return res.status(500).json({ message: 'Error al registrar el usuario' });
                }
            }
            res.status(201).json({ message: 'Usuario registrado con éxito' });
        });
    } catch (err) {
        console.error('Error hashing password:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Iniciar sesión
exports.iniciarSesion = (req, res) => {
    const { Correo, Contraseña } = req.body;

    if (!Correo || !Contraseña) {
        return res.status(400).json({ message: 'Por favor, complete ambos campos.' });
    }

    if (!db) {
        console.error('Database connection is not defined');
        return res.status(500).json({ message: 'Error en la conexión a la base de datos' });
    }

    const sql = 'SELECT * FROM registro WHERE Correo = ?';
    db.query(sql, [Correo], async (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ message: 'Error al iniciar sesión' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(Contraseña, user.Contraseña); // Uso de bcryptjs para comparar

        if (passwordMatch) {
            if (user.Id_usuario) {
                return res.json({ message: 'Inicio de sesión exitoso', userId: user.Id_usuario });
            } else {
                return res.status(500).json({ message: 'Error en el servidor: Id_usuario no encontrado' });
            }
        } else {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }
    });
};

// Solicitud de restablecimiento de contraseña
exports.resetPasswordRequest = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Por favor, ingrese un correo electrónico.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hora

    if (!db) {
        console.error('Database connection is not defined');
        return res.status(500).json({ message: 'Error en la conexión a la base de datos' });
    }

    const sql = 'UPDATE registro SET resetToken = ?, resetTokenExpiry = ? WHERE Correo = ?';
    db.query(sql, [token, expiry, email], (err, result) => {
        if (err) {
            console.error('Error actualizando el token:', err);
            return res.status(500).json({ message: 'Error al generar el token de restablecimiento.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Correo no encontrado.' });
        }

        const resetUrl = `http://localhost:5001/resetPassword/${token}`;

        const mailOptions = {
            to: email,
            from: process.env.EMAIL,
            subject: 'Restablecimiento de contraseña',
            text: `Ha solicitado un restablecimiento de contraseña. Haga clic en el siguiente enlace para restablecer su contraseña: ${resetUrl}`
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.error('Error enviando correo:', err);
                return res.status(500).json({ message: 'Error al enviar el correo de restablecimiento.' });
            }
            res.status(200).json({ message: 'Correo enviado', token });
        });
    });
};

// Verificación del token de restablecimiento
exports.verifyToken = (req, res) => {
    const { token } = req.params;

    if (!db) {
        console.error('Database connection is not defined');
        return res.status(500).json({ message: 'Error en la conexión a la base de datos' });
    }

    const sql = 'SELECT * FROM registro WHERE resetToken = ? AND resetTokenExpiry > NOW()';
    db.query(sql, [token], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error verificando el token:', err);
            return res.status(400).json({ message: 'Token inválido o expirado.' });
        }

        res.status(200).json({ message: 'Token válido. Puede restablecer su contraseña.' });
    });
};

// Restablecer contraseña
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { nuevaContraseña } = req.body;

    if (!nuevaContraseña) {
        return res.status(400).json({ message: 'Por favor, ingrese una nueva contraseña.' });
    }

    const hashedPassword = await bcrypt.hash(nuevaContraseña, 10); // Uso de bcryptjs para hashear

    if (!db) {
        console.error('Database connection is not defined');
        return res.status(500).json({ message: 'Error en la conexión a la base de datos' });
    }

    const sql = 'SELECT * FROM registro WHERE resetToken = ? AND resetTokenExpiry > NOW()';
    db.query(sql, [token], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error verificando el token:', err);
            return res.status(400).json({ message: 'Token inválido o expirado.' });
        }

        const sqlUpdate = 'UPDATE registro SET Contraseña = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE resetToken = ?';
        db.query(sqlUpdate, [hashedPassword, token], (err) => {
            if (err) {
                console.error('Error actualizando la contraseña:', err);
                return res.status(500).json({ message: 'Error al restablecer la contraseña.' });
            }
            res.status(200).json({ message: 'Contraseña restablecida con éxito' });
        });
    });
};
