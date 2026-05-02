const express = require('express');
const upload = require('../config/upload');
const { protect } = require('../middleware/authMiddleware');
const {
  getRecipes,
  getRecipeById,
  createRecipe,
  seedRecipes,
  updateRecipe,
  deleteRecipe
} = require('../controllers/recipeController');

const router = express.Router();

router.get('/', protect, getRecipes);
router.get('/:id', protect, getRecipeById);
router.post('/', protect, upload.single('image'), createRecipe);
router.post('/seed', protect, seedRecipes);
router.put('/:id', protect, upload.single('image'), updateRecipe);
router.delete('/:id', protect, deleteRecipe);

module.exports = router;
