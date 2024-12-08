const express = require('express');
const CommentController = require('../controllers/commentController');

const router = express.Router();

router.get('/:id', CommentController.fetchAllComments);
router.post('/', CommentController.createComment);
router.delete('/:id', CommentController.deleteComment); // Delete an invitation by ID
router.put('/:id', CommentController.updateComment); // Update an invitation by ID
router.get('/specific/:id', CommentController.getComment); // Fetch by receiver ID

module.exports = router;
