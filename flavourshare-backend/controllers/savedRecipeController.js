const SavedRecipe = require('../models/SavedRecipe');
const SavedCollection = require('../models/SavedCollection');
const Recipe = require('../models/Recipe');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

const getSavedRecipes = asyncHandler(async (req, res) => {
  const query = { userId: req.user._id };
  if (req.query.collectionId) {
    query.collectionId = req.query.collectionId;
  }

  const saved = await SavedRecipe.find(query)
    .populate('recipeId')
    .populate('collectionId')
    .sort({ savedAt: -1 });

  res.json(saved);
});

const getSavedRecipe = asyncHandler(async (req, res) => {
  const saved = await SavedRecipe.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('recipeId')
    .populate('collectionId');

  if (!saved) {
    res.status(404);
    throw new Error('Saved recipe not found');
  }

  res.json(saved);
});

const createSavedRecipe = asyncHandler(async (req, res) => {
  const { recipeId, collectionId, personalNote } = req.body;
  if (!recipeId) {
    res.status(400);
    throw new Error('recipeId is required');
  }
  if (!collectionId) {
    res.status(400);
    throw new Error('collectionId is required');
  }
  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    res.status(400);
    throw new Error('Invalid recipe id');
  }
  if (!mongoose.Types.ObjectId.isValid(collectionId)) {
    res.status(400);
    throw new Error('Invalid collection id');
  }

  const [recipe, collection] = await Promise.all([
    Recipe.findById(recipeId).select('_id'),
    SavedCollection.findOne({ _id: collectionId, userId: req.user._id }).select('_id')
  ]);

  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  const existing = await SavedRecipe.findOne({ userId: req.user._id, recipeId, collectionId });
  if (existing) {
    res.status(400);
    throw new Error('Recipe already saved in this collection');
  }

  let saved;
  try {
    saved = await SavedRecipe.create({
      userId: req.user._id,
      recipeId,
      collectionId,
      personalNote: personalNote || ''
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      throw new Error('Recipe already saved in this collection');
    }
    throw err;
  }

  res.status(201).json(saved);
});

const updateSavedRecipe = asyncHandler(async (req, res) => {
  const saved = await SavedRecipe.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { personalNote: req.body.personalNote },
    { new: true }
  );

  if (!saved) {
    res.status(404);
    throw new Error('Saved recipe not found');
  }

  res.json(saved);
});

const deleteSavedRecipe = asyncHandler(async (req, res) => {
  const deleted = await SavedRecipe.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deleted) {
    res.status(404);
    throw new Error('Saved recipe not found');
  }
  res.json({ message: 'Removed from favourites' });
});

module.exports = {
  getSavedRecipes,
  getSavedRecipe,
  createSavedRecipe,
  updateSavedRecipe,
  deleteSavedRecipe
};
