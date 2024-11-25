const express = require('express');
const EventController = require('../controllers/eventController');

const router = express.Router();

router.get('/events', EventController.getAllEvents);
router.get('/event/:id', EventController.getEventById);
router.post('/event/postevent', EventController.createEvent);
router.put('/event/editevent/:id', EventController.updateEventById);
router.delete('/event/deleteevent/:id', EventController.deleteEventById);
router.get('/cities', EventController.getAllCities);

module.exports = router;
