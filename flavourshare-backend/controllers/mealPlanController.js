const MealPlan = require('../models/MealPlan');
const asyncHandler = require('../middleware/asyncHandler');
const { getUploadedFileUrl } = require('../utils/fileUrl');

const getCurrentWeekStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeeklyMealPlan = asyncHandler(async (req, res) => {
  const weekStart = getCurrentWeekStart();
  let plan = await MealPlan.findOne({ user: req.user._id, weekStartDate: weekStart })
    .populate('slots.recipe');

  if (!plan) {
    plan = await MealPlan.create({
      user: req.user._id,
      weekStartDate: weekStart,
      slots: []
    });
  }

  res.json(plan);
});

const uploadBanner = asyncHandler(async (req, res) => {
  const weekStart = getCurrentWeekStart();
  let plan = await MealPlan.findOne({ user: req.user._id, weekStartDate: weekStart });

  if (!plan) {
    plan = await MealPlan.create({ user: req.user._id, weekStartDate: weekStart, slots: [] });
  }

  if (req.file) {
    const bannerImage = getUploadedFileUrl(req, req.file);
    if (!bannerImage) {
      res.status(400);
      throw new Error('Banner image upload failed');
    }

    await MealPlan.updateOne(
      { _id: plan._id, user: req.user._id },
      { $set: { bannerImage } },
      { runValidators: false }
    );
  }

  plan = await MealPlan.findById(plan._id).populate('slots.recipe');
  res.json(plan);
});

const assignRecipe = asyncHandler(async (req, res) => {
  const { recipeId, day, mealType, personalNote } = req.body;
  if (!recipeId || !day || !mealType) {
    res.status(400);
    throw new Error('recipeId, day, and mealType are required');
  }

  const weekStart = getCurrentWeekStart();
  let plan = await MealPlan.findOne({ user: req.user._id, weekStartDate: weekStart });
  if (!plan) {
    plan = new MealPlan({ user: req.user._id, weekStartDate: weekStart, slots: [] });
  }

  const slotIndex = plan.slots.findIndex((s) => s.day === day && s.mealType === mealType);
  if (slotIndex >= 0) {
    plan.slots[slotIndex].recipe = recipeId;
    plan.slots[slotIndex].personalNote = personalNote || plan.slots[slotIndex].personalNote;
  } else {
    plan.slots.push({ day, mealType, recipe: recipeId, personalNote });
  }

  await plan.save();
  plan = await MealPlan.findById(plan._id).populate('slots.recipe');
  res.status(201).json(plan);
});

const clearSlot = asyncHandler(async (req, res) => {
  const weekStart = getCurrentWeekStart();
  const plan = await MealPlan.findOne({ user: req.user._id, weekStartDate: weekStart });
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }

  const { day, mealType } = req.params;
  plan.slots = plan.slots.filter((s) => !(s.day === day && s.mealType === mealType));

  await plan.save();
  const updatedPlan = await MealPlan.findById(plan._id).populate('slots.recipe');
  res.json(updatedPlan);
});

module.exports = {
  getWeeklyMealPlan,
  uploadBanner,
  assignRecipe,
  clearSlot
};
