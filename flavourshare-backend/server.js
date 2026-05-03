const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/saved', require('./routes/savedRecipes'));
app.use('/api/collections', require('./routes/savedCollectionsLive'));
app.use('/api/mealplans', require('./routes/mealPlans'));
app.use('/api/shoppingLists', require('./routes/shoppingLists'));
app.get('/', (req, res) => res.send('FlavourShare API Running ✅'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));