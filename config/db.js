const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'guitarexplain.c1gaiw8a2gl5.us-east-2.rds.amazonaws.com',
    user: 'admin',
    password: 'Colombia2022.',
    database: 'cuestionario1'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database');
});

module.exports = db;
