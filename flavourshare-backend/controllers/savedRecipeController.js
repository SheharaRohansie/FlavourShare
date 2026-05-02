const SavedRecipe = require('../models/SavedRecipe');
const asyncHandler = require('../middleware/asyncHandler');

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

  const existing = await SavedRecipe.findOne({ userId: req.user._id, recipeId, collectionId });
  if (existing) {
    res.status(400);
    throw new Error('Recipe already saved in this collection');
  }

  const saved = await SavedRecipe.create({
    userId: req.user._id,
    recipeId,
    collectionId,
    personalNote: personalNote || ''
  });

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
