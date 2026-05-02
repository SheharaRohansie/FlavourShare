const express = require('express');
const upload = require('../config/upload');
const { protect } = require('../middleware/authMiddleware');
const {
  getWeeklyMealPlan,
  uploadBanner,
  assignRecipe,
  clearSlot
} = require('../controllers/mealPlanController');

const router = express.Router();

router.get('/', protect, getWeeklyMealPlan);
router.post('/upload-banner', protect, upload.single('banner'), uploadBanner);
router.post('/assign', protect, assignRecipe);
router.delete('/clear/:day/:mealType', protect, clearSlot);

module.exports = router;
