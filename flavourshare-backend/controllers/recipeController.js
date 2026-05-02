const Recipe = require('../models/Recipe');
const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');
const { getUploadedFileUrl, getUploadedFilePublicId } = require('../utils/fileUrl');
const { parseJsonField } = require('../utils/parseJson');

const normalizeCategoryIds = (value) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      return parseJsonField(trimmed, [], 'categoryIds');
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((id) => id.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  return value;
};

const getRecipes = asyncHandler(async (req, res) => {
  const { search, categoryId, categoryIds } = req.query;
  const query = {};

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  if (categoryIds) {
    const ids = categoryIds.split(',').map((id) => id.trim()).filter(Boolean);
    if (ids.length > 0) {
      query.$or = [{ categoryIds: { $in: ids } }, { category: { $in: ids } }];
    }
  } else if (categoryId && categoryId !== 'All') {
    query.$or = [{ categoryIds: { $in: [categoryId] } }, { category: categoryId }];
  }

  const recipes = await Recipe.find(query)
    .populate('author', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.json(recipes);
});

const getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).populate('author', 'firstName lastName');
  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }
  res.json(recipe);
});

const createRecipe = asyncHandler(async (req, res) => {
  const { title, description, cookTime, servings, ingredients, steps, categoryId, categoryIds } = req.body;

  const parsedCategoryIds = normalizeCategoryIds(categoryIds || categoryId);
  if (!Array.isArray(parsedCategoryIds)) {
    res.status(400);
    throw new Error('categoryIds must be an array');
  }

  if (!title || !cookTime || parsedCategoryIds.length < 1) {
    res.status(400);
    throw new Error('Title, cookTime, and at least one category are required');
  }

  let photoUrl = req.body.photo || req.body.image || '';
  let imagePublicId = '';

  if (req.file) {
    photoUrl = getUploadedFileUrl(req, req.file) || photoUrl;
    imagePublicId = getUploadedFilePublicId(req.file);
  }

  if (!photoUrl) {
    res.status(400);
    throw new Error('Recipe photo is required');
  }

  const parsedIngredients = parseJsonField(ingredients, [], 'ingredients');
  const parsedSteps = parseJsonField(steps, [], 'steps');

  const recipe = await Recipe.create({
    title,
    description,
    cookTime,
    servings: servings || 2,
    ingredients: parsedIngredients,
    steps: parsedSteps,
    categoryIds: parsedCategoryIds,
    photo: photoUrl,
    imagePublicId,
    author: req.user._id
  });

  res.status(201).json(recipe);
});

const seedRecipes = asyncHandler(async (req, res) => {
  await Recipe.deleteMany({});
  await Category.deleteMany({});

  const cats = ['Breakfast', 'Main', 'Dessert', 'Vegan', 'Beverage', 'Italian', 'Quick Meals'].map((name) => ({
    name,
    description: `${name} recipes`,
    createdBy: req.user._id
  }));
  const createdCats = await Category.insertMany(cats);

  const catMap = createdCats.reduce((acc, cat) => {
    acc[cat.name] = cat._id;
    return acc;
  }, {});

  const mockRecipes = [
    { title: 'Classic Margherita Pizza', description: 'A timeless Italian classic.', photo: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop', cookTime: '30 mins', servings: 2, ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Basil', 'Olive oil'], steps: ['Preheat oven to 450F', 'Roll out dough', 'Spread sauce and cheese', 'Bake for 10-15 mins', 'Top with fresh basil'], rating: 4.8, categoryIds: [catMap['Italian']] },
    { title: 'Chocolate Lava Cake', description: 'Rich, gooey chocolate cake.', photo: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=600&auto=format&fit=crop', cookTime: '45 mins', servings: 4, ingredients: ['Dark chocolate', 'Butter', 'Sugar', 'Eggs', 'Flour'], steps: ['Melt butter and chocolate', 'Whisk eggs and sugar', 'Fold in flour', 'Bake at 400F for 12 mins'], rating: 4.9, categoryIds: [catMap['Dessert']] },
    { title: 'Vegan Buddha Bowl', description: 'Healthy and satisfying.', photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop', cookTime: '20 mins', servings: 1, ingredients: ['Quinoa', 'Roasted chickpeas', 'Avocado', 'Spinach', 'Tahini dressing'], steps: ['Cook quinoa', 'Roast chickpeas', 'Assemble bowl', 'Drizzle dressing'], rating: 4.7, categoryIds: [catMap['Vegan']] },
    { title: 'Spicy Beef Tacos', description: 'Perfect for Taco Tuesday.', photo: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=600&auto=format&fit=crop', cookTime: '25 mins', servings: 3, ingredients: ['Ground beef', 'Taco seasoning', 'Taco shells', 'Lettuce', 'Cheese', 'Salsa'], steps: ['Brown the beef', 'Add seasoning and water', 'Simmer for 10 mins', 'Assemble tacos'], rating: 4.6, categoryIds: [catMap['Main']] },
    { title: 'Avocado Toast with Egg', description: 'A quick protein-packed breakfast.', photo: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?q=80&w=600&auto=format&fit=crop', cookTime: '10 mins', servings: 1, ingredients: ['Bread', 'Avocado', 'Egg', 'Salt', 'Pepper', 'Chili flakes'], steps: ['Toast bread', 'Mash avocado and spread', 'Fry or poach egg', 'Place egg on toast and season'], rating: 4.5, categoryIds: [catMap['Breakfast']] },
    { title: 'Blueberry Pancakes', description: 'Fluffy and sweet.', photo: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=600&auto=format&fit=crop', cookTime: '25 mins', servings: 4, ingredients: ['Flour', 'Milk', 'Eggs', 'Sugar', 'Baking powder', 'Blueberries'], steps: ['Mix dry ingredients', 'Whisk wet ingredients and combine', 'Fold in blueberries', 'Cook on griddle until bubbly', 'Flip and cook 2 mins'], rating: 4.9, categoryIds: [catMap['Breakfast']] }
  ];

  await Recipe.insertMany(mockRecipes);
  res.json({ message: 'Recipes & Categories seeded successfully' });
});

const updateRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }

  if (recipe.author.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const { title, description, cookTime, servings, ingredients, steps, categoryId, categoryIds } = req.body;

  if (title) recipe.title = title;
  if (description !== undefined) recipe.description = description;
  if (cookTime) recipe.cookTime = cookTime;
  if (servings) recipe.servings = servings;
  if (ingredients) recipe.ingredients = parseJsonField(ingredients, recipe.ingredients, 'ingredients');
  if (steps) recipe.steps = parseJsonField(steps, recipe.steps, 'steps');
  if (categoryIds !== undefined || categoryId !== undefined) {
    const parsedCategoryIds = normalizeCategoryIds(categoryIds || categoryId);
    if (!Array.isArray(parsedCategoryIds) || parsedCategoryIds.length < 1) {
      res.status(400);
      throw new Error('At least one category is required');
    }
    recipe.categoryIds = parsedCategoryIds;
  }

  if (req.file) {
    recipe.photo = getUploadedFileUrl(req, req.file) || recipe.photo;
    recipe.imagePublicId = getUploadedFilePublicId(req.file);
  }

  if (!recipe.photo) {
    res.status(400);
    throw new Error('Recipe photo is required');
  }

  await recipe.save();
  res.json(recipe);
});

const deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }

  if (recipe.author.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  await Recipe.findByIdAndDelete(req.params.id);
  res.json({ message: 'Recipe deleted' });
});

module.exports = {
  getRecipes,
  getRecipeById,
  createRecipe,
  seedRecipes,
  updateRecipe,
  deleteRecipe
};
