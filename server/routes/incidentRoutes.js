const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

router.get('/', incidentController.getIncidents);
router.post('/', incidentController.createIncident);
router.patch('/:id/status', incidentController.updateStatus);
router.get('/safe-havens', incidentController.getNearestSafeHavens);

module.exports = router;
