const express = require('express');
const bodyParser = require('body-parser');
const realestateRoutes = require('./routes/realestate');

const app = express();
app.use(bodyParser.json());

app.use('/api', realestateRoutes);

app.listen(3000, () => {
  console.log('🚀 API server running on http://localhost:3000');
});
