# FlavourShare

FlavourShare is a full-stack recipe sharing and meal planning mobile application. It helps users discover recipes, share their own dishes, save favourite recipes, organize collections, plan weekly meals, and manage shopping lists in one place.

## Project Overview

FlavourShare is designed as a digital cooking assistant for users who want to manage their food-related activities easily. Users can create an account, log in securely, browse recipes, filter recipes by category, view detailed recipe information, add new recipes with images, write reviews, save recipes, create recipe collections, plan meals for the week, and prepare shopping lists.

The application follows a client-server architecture. The frontend is developed using React Native with Expo, while the backend is developed using Node.js and Express.js. MongoDB is used as the database, and Mongoose is used to manage data models and database operations.

## Features

- User registration and login
- JWT-based authentication
- User profile management
- Recipe browsing and searching
- Recipe creation, editing, and deletion
- Recipe image upload
- Category management
- Recipe reviews and ratings
- Saved recipes
- Custom recipe collections
- Weekly meal planning
- Shopping list creation and item tracking

## Tech Stack

### Frontend

- React Native
- Expo
- React Navigation
- Axios

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token authentication
- Multer image upload handling
- Cloudinary image storage support

## Project Structure

```text
flavourShare/
├── flavourshare-backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── utils/
│   └── server.js
│
├── flavourshare-frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── context/
│   │   └── constants/
│   └── package.json
│
└── README.md

System Architecture
The system is divided into three main layers:

Client Layer
The mobile application is built with React Native and Expo. Users interact with this layer to browse recipes, add recipes, save recipes, create meal plans, and manage shopping lists.

Backend Layer
The backend is built with Node.js and Express.js. It provides REST API endpoints, handles authentication, processes requests, validates user actions, and connects the frontend with the database.

Database Layer
MongoDB is used to store users, recipes, categories, reviews, saved recipes, collections, meal plans, and shopping lists.

Main Modules
Authentication and User Profile Management
Recipe Management
Category Management
Review and Rating Management
Saved Recipes and Collections
Meal Plan Management
Shopping List Management
API Modules
Module	Base Endpoint
Authentication	/api/auth
Categories	/api/categories
Recipes	/api/recipes
Reviews	/api/reviews
Saved Recipes	/api/saved
Saved Collections	/api/collections
Meal Plans	/api/mealplans
Shopping Lists	/api/shoppingLists
Database Collections
The system uses the following MongoDB collections:

Users
Recipes
Categories
Reviews
SavedRecipes
SavedCollections
MealPlans
ShoppingLists
Installation
Clone the repository:

git clone <repository-url>
cd flavourShare
Install backend dependencies:

cd flavourshare-backend
npm install
Install frontend dependencies:

cd ../flavourshare-frontend
npm install
Environment Variables
Create a .env file inside the backend folder:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
Create a .env file inside the frontend folder:

EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
If you are testing on a physical mobile device, replace localhost with your computer's local IP address:

EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5000
Running the Application
Start the backend server:

cd flavourshare-backend
npm run dev
Start the frontend app:

cd flavourshare-frontend
npm start
Then run the application using Expo Go, Android emulator, iOS simulator, or web browser.

Available Scripts
Backend
npm run dev
Runs the backend server using Nodemon.

npm start
Runs the backend server using Node.js.

Frontend
npm start
Starts the Expo development server.

npm run android
Runs the app on Android.

npm run ios
Runs the app on iOS.

npm run web
Runs the app in a web browser.

Conclusion
FlavourShare provides a complete platform for recipe sharing, meal planning, and shopping list management. It combines a React Native mobile frontend, an Express.js backend, and a MongoDB database to deliver a practical and user-friendly food management application.