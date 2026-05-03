const express = require('express');
const uploadCollection = require('../config/uploadCollection');
const { protect } = require('../middleware/authMiddleware');
const {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection
} = require('../controllers/savedCollectionController');

const router = express.Router();

router.get('/', protect, getCollections);
router.post('/', protect, uploadCollection.single('image'), createCollection);
router.put('/:id', protect, uploadCollection.single('image'), updateCollection);
router.delete('/:id', protect, deleteCollection);

module.exports = router;

