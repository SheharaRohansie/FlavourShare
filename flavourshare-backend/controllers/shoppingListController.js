const ShoppingList = require('../models/ShoppingList');
const asyncHandler = require('../middleware/asyncHandler');
const { getUploadedFileUrl } = require('../utils/fileUrl');
const { parseJsonField } = require('../utils/parseJson');

const getLists = asyncHandler(async (req, res) => {
  const lists = await ShoppingList.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(lists);
});

const getListById = asyncHandler(async (req, res) => {
  const list = await ShoppingList.findOne({ _id: req.params.id, user: req.user._id });
  if (!list) {
    res.status(404);
    throw new Error('List not found');
  }
  res.json(list);
});

const createList = asyncHandler(async (req, res) => {
  const { name, items } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('List name is required');
  }

  let image = '';
  if (req.file) {
    image = getUploadedFileUrl(req, req.file);
  }

  const parsedItems = parseJsonField(items, [], 'items');

  const newList = await ShoppingList.create({
    user: req.user._id,
    name,
    image,
    items: parsedItems
  });

  res.status(201).json(newList);
});

const updateList = asyncHandler(async (req, res) => {
  const list = await ShoppingList.findOne({ _id: req.params.id, user: req.user._id });
  if (!list) {
    res.status(404);
    throw new Error('List not found');
  }

  const { name, items } = req.body;
  if (name) list.name = name;
  if (items) list.items = parseJsonField(items, list.items, 'items');

  if (req.file) {
    list.image = getUploadedFileUrl(req, req.file) || list.image;
  }

  await list.save();
  res.json(list);
});

const toggleItem = asyncHandler(async (req, res) => {
  const list = await ShoppingList.findOne({ _id: req.params.id, user: req.user._id });
  if (!list) {
    res.status(404);
    throw new Error('List not found');
  }

  const item = list.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Item not found in list');
  }

  item.isBought = !item.isBought;
  await list.save();

  res.json(list);
});

const deleteList = asyncHandler(async (req, res) => {
  const list = await ShoppingList.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!list) {
    res.status(404);
    throw new Error('List not found');
  }
  res.json({ message: 'List deleted' });
});

module.exports = {
  getLists,
  getListById,
  createList,
  updateList,
  toggleItem,
  deleteList
};
