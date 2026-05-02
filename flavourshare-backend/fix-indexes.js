const mongoose = require('mongoose');
require('dotenv').config();

const cleanIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // We can just drop all indexes on the savedrecipes collection except the _id index
    const db = mongoose.connection.db;
    await db.collection('savedrecipes').dropIndexes();
    console.log('Successfully dropped old indexes on savedrecipes');

    // Clean up docs that don't have userId (since earlier schema used 'user' instead of 'userId')
    const cleanupRes = await db.collection('savedrecipes').deleteMany({ userId: { $exists: false } });
    console.log('Deleted legacy savedrecipes documents without userId:', cleanupRes.deletedCount);
    const cleanupRes2 = await db.collection('savedrecipes').deleteMany({ userId: null });
    console.log('Deleted legacy savedrecipes documents with null userId:', cleanupRes2.deletedCount);

    // Since Mongoose models are not loaded here, the new indexes will be built when the server starts or we can manually sync.
    // For good measure, let's sync the new models if we require it.
    const SavedRecipe = require('./models/SavedRecipe');
    await SavedRecipe.syncIndexes();
    console.log('Successfully synced new indexes for savedrecipes');

  } catch (err) {
    if (err.codeName === 'NamespaceNotFound') {
      console.log('Collection savedrecipes does not exist or has no indexes yet.');
    } else {
      console.log('Error:', err);
    }
  } finally {
    mongoose.connection.close();
  }
};

cleanIndexes();
