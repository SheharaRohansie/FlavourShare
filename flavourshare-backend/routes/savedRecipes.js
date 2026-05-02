const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getSavedRecipes,
  getSavedRecipe,
  createSavedRecipe,
  updateSavedRecipe,
  deleteSavedRecipe
} = require('../controllers/savedRecipeController');

const router = express.Router();

router.get('/', protect, getSavedRecipes);
router.get('/:id', protect, getSavedRecipe);
router.post('/', protect, createSavedRecipe);
router.put('/:id', protect, updateSavedRecipe);
router.delete('/:id', protect, deleteSavedRecipe);

module.exports = router;
