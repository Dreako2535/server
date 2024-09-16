const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
    console.error('Faltan variables de entorno necesarias. Asegúrate de que EMAIL y EMAIL_PASSWORD estén definidas en el archivo .env.');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

module.exports = transporter;
