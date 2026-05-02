const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  isBought: { type: Boolean, default: false }
});

const shoppingListSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  items: [shoppingListItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
