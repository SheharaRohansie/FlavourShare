const multer = require('multer');
const cloudinaryStorage = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary');
const fs = require('fs');

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  storage = cloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'flavourshare_collections',
      allowed_formats: ['jpg', 'png', 'jpeg']
    }
  });
} else {
  const dir = './uploads';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const ext = file.mimetype.split('/')[1] || 'jpg';
      cb(null, `${Date.now()}-col-${Math.round(Math.random() * 1e9)}.${ext}`);
    }
  });
}

const uploadCollection = multer({ storage: storage });

module.exports = uploadCollection;
