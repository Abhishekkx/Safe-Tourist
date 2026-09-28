const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'krfpshl3',
  api_key: process.env.CLOUDINARY_API_KEY || '373574267283178',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'AwbSe5GtzNKARq2Dvtsmj7iM5E4',
});

module.exports = cloudinary;
