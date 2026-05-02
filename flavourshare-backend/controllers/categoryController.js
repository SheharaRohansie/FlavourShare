const Category = require('../models/Category');
const Recipe = require('../models/Recipe');
const asyncHandler = require('../middleware/asyncHandler');
const { getUploadedFileUrl, getUploadedFilePublicId } = require('../utils/fileUrl');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});

const getMyCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ createdBy: req.user._id }).sort({ name: 1 });
  res.json(categories);
});

const getCategoryDetail = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const recipes = await Recipe.find({ $or: [{ categoryIds: { $in: [req.params.id] } }, { category: req.params.id }] })
    .populate('author', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.json({ category, recipes });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }


  const normalizedName = name.toLowerCase().trim();
  if (!normalizedName) {
    res.status(400);
    throw new Error('Category name is required');
  }

  const categoryExists = await Category.findOne({ name: normalizedName });
  if (categoryExists) {
    res.status(400);
    throw new Error('You already have a category with this name.');
  }

  let imageUrl = '';
  let imagePublicId = '';

  if (req.file) {
    imageUrl = getUploadedFileUrl(req, req.file);
    imagePublicId = getUploadedFilePublicId(req.file);
  }

  const category = await Category.create({
    name: normalizedName,
    description: description ? description.trim() : '',
    image: imageUrl,
    imagePublicId,
    createdBy: req.user._id
  });

  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (category.createdBy && category.createdBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const { name, description } = req.body;
  if (name) {
    const normalizedName = name.toLowerCase().trim();
    if (!normalizedName) {
      res.status(400);
      throw new Error('Category name is required');
    }
    const duplicate = await Category.findOne({ name: normalizedName, _id: { $ne: category._id } });
    if (duplicate) {
      res.status(400);
      throw new Error('You already have a category with this name.');
    }
    category.name = normalizedName;
  }

  if (description !== undefined) {
    category.description = description ? description.trim() : '';
  }

  if (req.file) {
    category.image = getUploadedFileUrl(req, req.file) || category.image;
    category.imagePublicId = getUploadedFilePublicId(req.file);
  }

  await category.save();
  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (category.createdBy && category.createdBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
});

module.exports = {
  getCategories,
  getMyCategories,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory
};
