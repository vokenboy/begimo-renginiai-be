const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/get/:userid', UserController.getUserById);
router.put('/update/:userid', UserController.updateUser);
router.post('/forgot-password', UserController.recoverPassword);
router.post('/change-password', UserController.changePassword);
router.get('/getstats/:userid', UserController.getUserRunningStatistics);
router.get('/get/email/:email', UserController.getUserByEmail);
router.get('/is-organizer/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'Invalid or missing user ID' });
        }

        const isOrganizer = await UserController.isUserOrganizer(userId);

        res.status(200).json({ isOrganizer });
    } catch (error) {
        console.error('Error checking if user is an organizer:', error);
        res.status(500).json({ error: 'Server error while checking organizer status' });
    }
});

router.get('/is-admin/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'Invalid or missing user ID' });
        }

        const isAdmin = await UserController.isAdmin(userId);

        res.status(200).json({ isAdmin });
    } catch (error) {
        res.status(500).json({ error: 'Server error while checking admin status' });
    }
});


module.exports = router;
