const express = require('express');
const EventController = require('../controllers/eventController');

const router = express.Router();

router.get('/events/public', EventController.getPublicEvents);
router.get('/events/private', EventController.getPrivateEvents);
router.get('/event/:id', EventController.getEventById);
router.get('/cities', EventController.getAllCities);
router.post('/event/postevent', EventController.createEvent);
router.put('/editevent/:id', EventController.updateEventById);
router.delete('/deleteevent/:id', EventController.deleteEventById);

module.exports = router;
