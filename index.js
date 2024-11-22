const express = require('express');
const testRoute = require('./routes/testRoute');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(express.json());

// Routes
app.use('/test', testRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
