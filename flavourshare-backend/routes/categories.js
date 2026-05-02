const express = require('express');
const uploadCategory = require('../config/uploadCategory');
const { protect } = require('../middleware/authMiddleware');
const {
  getCategories,
  getMyCategories,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getCategories);
router.get('/mine', protect, getMyCategories);
router.get('/:id', getCategoryDetail);
router.post('/', protect, uploadCategory.single('image'), createCategory);
router.put('/:id', protect, uploadCategory.single('image'), updateCategory);
router.delete('/:id', protect, deleteCategory);

module.exports = router;
