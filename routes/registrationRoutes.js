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

router.post('/add-event-to-calendar', async (req, res) => {
    try {
        const { eventId, email } = req.body; // Extract eventId and email from the request body

        if (!eventId || !email) {
            return res.status(400).json({ message: 'Event ID and Email are required' });
        }

        // Call the addEventToGoogleCalendar method
        await RegistrationController.addEventToGoogleCalendar(eventId, email);

        res.status(200).json({ message: 'Event successfully added to Google Calendar' });
    } catch (error) {
        console.error('Error adding event to Google Calendar:', error);
        res.status(500).json({ message: 'Failed to add event to Google Calendar' });
    }
});

module.exports = router;
