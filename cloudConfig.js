const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Note: For local demo, provide actual keys in .env
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy-cloud-name',
    api_key: process.env.CLOUDINARY_KEY || 'dummy-api-key',
    api_secret: process.env.CLOUDINARY_SECRET || 'dummy-api-secret'
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'ResQ',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

module.exports = {
    cloudinary,
    storage
};
