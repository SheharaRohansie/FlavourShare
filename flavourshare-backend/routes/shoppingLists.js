const express = require('express');
const upload = require('../config/upload');
const { protect } = require('../middleware/authMiddleware');
const {
  getLists,
  getListById,
  createList,
  updateList,
  toggleItem,
  deleteList
} = require('../controllers/shoppingListController');

const router = express.Router();

router.get('/', protect, getLists);
router.get('/:id', protect, getListById);
router.post('/', protect, upload.single('image'), createList);
router.put('/:id', protect, upload.single('image'), updateList);
router.put('/:id/toggle-item/:itemId', protect, toggleItem);
router.delete('/:id', protect, deleteList);

module.exports = router;
