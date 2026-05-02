const mongoose = require('mongoose');

const mealPlanSlotSchema = new mongoose.Schema({
  day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  mealType: { type: String, required: true, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  personalNote: { type: String }
});

const mealPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  bannerImage: { type: String, default: '' },
  slots: [mealPlanSlotSchema]
}, { timestamps: true });

// Ensure a user only has one meal plan per week
mealPlanSchema.index({ user: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
