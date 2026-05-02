const mongoose = require('mongoose');

const savedRecipeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SavedCollection' },
  personalNote: { type: String, default: '' },
  savedAt: { type: Date, default: Date.now }
});

// A user should only be able to save a given recipe once per collection
savedRecipeSchema.index({ userId: 1, recipeId: 1, collectionId: 1 }, { unique: true });

module.exports = mongoose.model('SavedRecipe', savedRecipeSchema);
