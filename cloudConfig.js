const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_KEY &&
    process.env.CLOUDINARY_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'dummy-cloud-name'
);

function imageFilter(req, file, cb) {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
    if (!allowed.has(file.mimetype)) {
        return cb(new Error('Only JPEG, PNG, or WebP images are allowed.'));
    }
    cb(null, true);
}

const limits = { fileSize: 5 * 1024 * 1024, files: 5 };

let storage;
if (hasCloudinary) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET
    });
    storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'ResQ',
            allowed_formats: ['jpeg', 'png', 'jpg', 'webp']
        }
    });
} else {
    if (process.env.NODE_ENV === 'production') {
        console.warn('CLOUDINARY_* is not set; incident photo uploads will be stored locally.');
    }
    const dest = path.join(__dirname, 'uploads');
    fs.mkdirSync(dest, { recursive: true });
    storage = multer.diskStorage({
        destination: dest,
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase();
            const safe = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
            cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safe}`);
        }
    });
}

function mapUploadedPhotos(files) {
    if (!files || !files.length) return [];
    return files.map(f => ({
        url: typeof f.path === 'string' && f.path.startsWith('http')
            ? f.path
            : `/uploads/${f.filename}`,
        filename: f.filename
    }));
}

const upload = multer({ storage, fileFilter: imageFilter, limits });

module.exports = {
    cloudinary,
    storage,
    upload,
    hasCloudinary,
    mapUploadedPhotos
};
