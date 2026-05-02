const Review = require('../models/Review');
const Recipe = require('../models/Recipe');
const asyncHandler = require('../middleware/asyncHandler');
const { getUploadedFileUrl, getUploadedFilePublicId } = require('../utils/fileUrl');

const getReviewsForRecipe = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ recipe: req.params.recipeId })
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) {
    res.status(400);
    throw new Error('Rating and comment are required');
  }

  const ratingNum = Number(rating);
  if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  const existing = await Review.findOne({ recipe: req.params.recipeId, user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this recipe');
  }

  let photoUrl = '';
  let photoPublicId = '';

  if (req.file) {
    photoUrl = getUploadedFileUrl(req, req.file);
    photoPublicId = getUploadedFilePublicId(req.file);
  }

  const review = await Review.create({
    recipe: req.params.recipeId,
    user: req.user._id,
    rating: ratingNum,
    comment,
    photo: photoUrl,
    photoPublicId
  });

  const reviews = await Review.find({ recipe: req.params.recipeId });
  const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
  await Recipe.findByIdAndUpdate(req.params.recipeId, { rating: Number(avgRating.toFixed(1)) });

  res.status(201).json(review);
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) {
    res.status(404);
    throw new Error('Review not found or unauthorized');
  }

  const recipeId = review.recipe;
  await Review.findByIdAndDelete(req.params.id);

  const reviews = await Review.find({ recipe: recipeId });
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length)
    : 0;
  await Recipe.findByIdAndUpdate(recipeId, { rating: Number(avgRating.toFixed(1)) });

  res.json({ message: 'Review removed' });
});

const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) {
    res.status(404);
    throw new Error('Review not found or unauthorized');
  }

  if (rating) {
    const ratingNum = Number(rating);
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400);
      throw new Error('Rating must be between 1 and 5');
    }
    review.rating = ratingNum;
  }

  if (comment) review.comment = comment;

  if (req.file) {
    review.photo = getUploadedFileUrl(req, req.file) || review.photo;
    review.photoPublicId = getUploadedFilePublicId(req.file);
  }

  await review.save();

  const recipeId = review.recipe;
  const reviews = await Review.find({ recipe: recipeId });
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length)
    : 0;
  await Recipe.findByIdAndUpdate(recipeId, { rating: Number(avgRating.toFixed(1)) });

  res.json(review);
});

module.exports = {
  getReviewsForRecipe,
  addReview,
  deleteReview,
  updateReview
};
