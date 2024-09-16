const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');



// Ruta para registro de usuario
router.post('/registro', authController.registro);

// Ruta para inicio de sesión
router.post('/iniciarSesion', authController.iniciarSesion);

// Ruta para solicitar restablecimiento de contraseña
router.post('/resetPassword', authController.resetPasswordRequest);

// Ruta para verificar el token de restablecimiento
router.get('/resetPassword/:token', authController.verifyToken);

// Ruta para restablecer la contraseña con el token
router.post('/resetPassword/:token', authController.resetPassword);



module.exports = router;

