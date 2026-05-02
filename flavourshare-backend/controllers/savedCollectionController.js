const SavedCollection = require('../models/SavedCollection');
const SavedRecipe = require('../models/SavedRecipe');
const asyncHandler = require('../middleware/asyncHandler');
const { getUploadedFileUrl, getUploadedFilePublicId } = require('../utils/fileUrl');

const getCollections = asyncHandler(async (req, res) => {
  const collections = await SavedCollection.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(collections);
});

const createCollection = asyncHandler(async (req, res) => {
  const { name, note } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Collection name is required');
  }

  let photoUrl = '';
  let imagePublicId = '';

  if (req.file) {
    photoUrl = getUploadedFileUrl(req, req.file);
    imagePublicId = getUploadedFilePublicId(req.file);
  }

  const collection = await SavedCollection.create({
    userId: req.user._id,
    name,
    note: note || '',
    image: photoUrl,
    imagePublicId
  });

  res.status(201).json(collection);
});

const updateCollection = asyncHandler(async (req, res) => {
  const collection = await SavedCollection.findOne({ _id: req.params.id, userId: req.user._id });
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  const { name, note } = req.body;
  if (name) collection.name = name;
  if (note !== undefined) collection.note = note;

  if (req.file) {
    collection.image = getUploadedFileUrl(req, req.file) || collection.image;
    collection.imagePublicId = getUploadedFilePublicId(req.file);
  }

  await collection.save();
  res.json(collection);
});

const deleteCollection = asyncHandler(async (req, res) => {
  const deleted = await SavedCollection.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deleted) {
    res.status(404);
    throw new Error('Collection not found');
  }

  await SavedRecipe.deleteMany({ collectionId: req.params.id });
  res.json({ message: 'Collection deleted' });
});

module.exports = {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection
};
