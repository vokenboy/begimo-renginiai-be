const express = require('express');
const cors = require('cors');
const testRoute = require('./routes/testRoute');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const commentRoutes = require('./routes/commentRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(
	cors({
		origin: '*',
	})
);

app.use(express.json());

// Routes
app.use('/test', testRoute);
app.use('/user', userRoutes);
app.use('/event', eventRoutes);
app.use('/invite', inviteRoutes);
app.use('/comment', commentRoutes);
app.use('/register', registrationRoutes);

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
