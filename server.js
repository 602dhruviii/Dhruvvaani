const app = require('./app'); // Import the Express app from app.js

const PORT = process.env.PORT || 3000; // Define the port to listen on

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
