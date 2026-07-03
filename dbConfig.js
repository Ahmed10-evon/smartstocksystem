const oracledb = require('oracledb');
require('dotenv').config();

oracledb.initOracleClient({ libDir: 'E:\\instantclient_23_0' });

async function initialize() {
    try {
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECTION_STRING,
            poolAlias: 'default',       
            poolMin: 2,
            poolMax: 5,
            poolIncrement: 1
        });
        console.log('Database connected successfully!');
    } catch (err) {
        console.error('Error starting database connection:', err.message);
    }
}

module.exports = { initialize };