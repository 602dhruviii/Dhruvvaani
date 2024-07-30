const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const Env = require('../models/env');
const router = express.Router();
require('dotenv').config(); // Load environment variables

// Middleware to verify JWT
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({ message: 'Failed to authenticate token' });
        req.userEmail = decoded.email;
        next();
    });
};

router.post('/update-env', authenticate, async (req, res) => {
    const envVars = req.body;
    const userEmail = req.userEmail;

    try {
        // Save environment variables to MongoDB
        for (const key in envVars) {
            const newEnv = new Env({
                userEmail,
                key,
                value: envVars[key]
            });
            await newEnv.save();
        }

        // Write environment variables to .env file
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = Object.keys(envVars)
            .map(key => `${key}=${envVars[key]}`)
            .join('\n');

        // Append a newline if file already exists
        if (fs.existsSync(envPath)) {
            envContent = '\n' + envContent;
        }

        fs.appendFileSync(envPath, envContent);

        res.status(200).send({ message: 'Environment variables updated successfully' });
    } catch (error) {
        console.error('Error updating environment variables:', error);
        res.status(500).send({ error: 'Error updating environment variables' });
    }
});

router.get('/env', authenticate, async (req, res) => {
    const userEmail = req.userEmail;

    try {
        const envVars = await Env.find({ userEmail });
        res.status(200).send(envVars);
    } catch (error) {
        console.error('Error fetching environment variables:', error);
        res.status(500).send({ error: 'Error fetching environment variables' });
    }
});

module.exports = router;
