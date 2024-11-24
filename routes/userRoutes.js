const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/get/:userid', UserController.getUserById);
router.put('/update/:userid', UserController.updateUser);

module.exports = router;
