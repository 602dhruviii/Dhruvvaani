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
            await Env.updateOne(
                { userEmail, key },
                { value: envVars[key] },
                { upsert: true }
            );
        }

        // Read the existing .env file
        const envPath = path.join(__dirname, '..', '.env');
        let existingEnvVars = {};

        if (fs.existsSync(envPath)) {
            const envFileContent = fs.readFileSync(envPath, 'utf-8');
            existingEnvVars = envFileContent.split('\n').reduce((acc, line) => {
                const [key, value] = line.split('=');
                if (key && value) {
                    acc[key.trim()] = value.trim();
                }
                return acc;
            }, {});
        }

        // Update the existing environment variables with new values
        for (const key in envVars) {
            existingEnvVars[key] = envVars[key];
        }

        // Convert the updated object back to string
        const newEnvContent = Object.keys(existingEnvVars)
            .map(key => `${key}=${existingEnvVars[key]}`)
            .join('\n');

        // Write the updated content back to the .env file
        fs.writeFileSync(envPath, newEnvContent);

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
