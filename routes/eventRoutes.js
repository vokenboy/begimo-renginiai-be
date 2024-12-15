const express = require('express');
const EventController = require('../controllers/eventController');


const router = express.Router();

router.get('/events/public', EventController.getPublicEvents);
router.get('/events/private', EventController.getPrivateEvents);
router.get('/event/:id', EventController.getEventById);
router.get('/cities', EventController.getAllCities);
router.post('/event/postevent', EventController.createEvent);
router.put('/update/:id', EventController.updateEvent);
router.delete('/deleteevent/:id', EventController.deleteEventById);
router.get('/:id/weather', EventController.getWeatherByEvent);
router.get('/distances', EventController.getDistances);

module.exports = router;
