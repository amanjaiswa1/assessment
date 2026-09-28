const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

const createTable = async () => {
    await pool.query(`
        Create Table if not exists users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(240) NOT NULL,
        password VARCHAR(240) NOT NULL)`
    )
}
module.exports = { pool, createTable };