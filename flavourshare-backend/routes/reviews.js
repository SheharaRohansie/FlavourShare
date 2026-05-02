const express = require('express');
const uploadReview = require('../config/uploadReview');
const { protect } = require('../middleware/authMiddleware');
const {
  getReviewsForRecipe,
  addReview,
  deleteReview,
  updateReview
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

router.get('/recipe/:recipeId', getReviewsForRecipe);
router.post('/recipe/:recipeId', protect, uploadReview.single('photo'), addReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id', protect, uploadReview.single('photo'), updateReview);

module.exports = router;
