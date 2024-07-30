const mongoose = require('mongoose');

const EnvSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Env', EnvSchema);
