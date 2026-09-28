const express = require('express');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, createTable } = require('./db');
const auth = require('./auth')
const loginRateLimiter = require('./rateLimiter')

const app = express();
app.use(express.json());

let PORT = process.env.PORT;
createTable();

app.listen(PORT, () => {
    console.log(`App running at http://localhost:${PORT}`)
})
app.get('/health', (req, res) => {
    return res.json({
        message: "Running",
    })
})

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPass = await bcrypt.hash(password, 10);
        const data = await pool.query(
            `INSERT into users (name, email, password)
            Values ($1, $2, $3)
            Returning id, name ,email`,
            [name, email, hashedPass]
        )
        return res.status(201).json({
            message: "Registered Successfully",
            user: data.rows[0]
        })
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Error"
        })
    }
})

app.post("/login", loginRateLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await pool.query(
            `Select * from users where email = $1`,
            [email]
        )
        if (!data.rows.length) {
            return res.status(401).json({
                message: "Invalid Creds"
            })
        }
        const user = data.rows[0];
        const isValid = await bcrypt.compare(
            password, user.password
        );
        if (!isValid) {
            return res.status(401).json({
                message: "Invalid Creds"
            })
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email
            },
            process.env.JWT_SECRET
        )
        return res.status(201).json({
            message: "Login Successfully",
            token: token
        })
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Error"
        })
    }
})

app.get("/profile", auth, async (req, res) => {
    try {
        const data = await pool.query(
            `Select * from users where id = $1`,
            [req.user.userId]
        )
        console.log(data.rows[0]);

        return res.status(201).json({
            message: "Profile Fetched Successfully",
            user: data.rows[0]
        })
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Error"
        })
    }
})