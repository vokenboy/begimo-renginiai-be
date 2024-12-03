const express = require('express');
const InviteController = require('../controllers/inviteController');

const router = express.Router();

router.get('/', InviteController.getAllInvitations); // Get all invitations
router.get('/:id', InviteController.getInvitationById); // Get a single invitation by ID
router.post('/', InviteController.createInvitation); // Create a new invitation
router.put('/:id', InviteController.updateInvitationById); // Update an invitation by ID
router.delete('/:id', InviteController.deleteInvitationById); // Delete an invitation by ID
router.get('/sender/:senderId', InviteController.getInvitationsBySenderId); // Fetch by sender ID
router.get('/receiver/:receiverId', InviteController.getInvitationsByReceiverId); // Fetch by receiver ID

module.exports = router;
