const express = require('express');
const app = express();

// Body parser
app.use(express.json());

// Import your realestate routes
const realestateRoutes = require('./api/realestate');
app.use('/api', realestateRoutes);

// Start server
app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
});
