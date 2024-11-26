const express = require('express');
const cors = require('cors');
const testRoute = require('./routes/testRoute');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(express.json());

// Routes
app.use('/test', testRoute);
app.use('/user', userRoutes);
app.use('/event', eventRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});