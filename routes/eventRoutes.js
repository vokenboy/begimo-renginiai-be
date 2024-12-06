const express = require('express');
const EventController = require('../controllers/eventController');

const router = express.Router();

router.get('/events/public', EventController.getPublicEvents);
router.get('/events/private', EventController.getPrivateEvents);
router.get('/:id', EventController.getEventById);
router.post('/event/postevent', EventController.createEvent);
router.put('editevent/:id', EventController.updateEventById);
router.delete('/deleteevent/:id', EventController.deleteEventById);
router.get('/cities', EventController.getAllCities);

module.exports = router;
