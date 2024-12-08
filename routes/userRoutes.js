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

module.exports = router;
