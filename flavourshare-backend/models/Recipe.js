const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  photo: { type: String, required: true },
  imagePublicId: { type: String },
  cookTime: { type: String, required: true },
  servings: { type: Number, default: 2 },
  ingredients: [{ type: String }],
  steps: [{ type: String }],
  rating: { type: Number, default: 0 },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
