const express = require('express');
const RegistrationController = require('../controllers/registrationController');

const router = express.Router();

// Route to fetch all registrations or registrations for a specific event
router.get('/registrations/:id', RegistrationController.getRegistrations);

// Route to register a user for an event
router.post('/register-event', RegistrationController.registerUser);



router.put('/update-registration', RegistrationController.updateRegistration)

// Route to delete a specific registration
router.delete('/registrations/:registrationId', RegistrationController.deleteRegistration);

router.post('/add-event-to-calendar', RegistrationController.addEventToGoogleCalendar);




module.exports = router;
