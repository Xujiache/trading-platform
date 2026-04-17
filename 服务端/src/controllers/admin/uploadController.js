const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const ApiResponse = require('../../utils/response');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const subDir = req.uploadSubDir || 'images';
    const uploadPath = path.join(process.cwd(), config.upload.dir, subDir);
    const fs = require('fs');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 JPG/PNG/GIF/WebP 格式的图片'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxSize },
});

exports.uploadImage = [
  (req, res, next) => { req.uploadSubDir = 'images'; next(); },
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return ApiResponse.badRequest(res, '请选择要上传的文件');
    }
    const relativePath = `/${config.upload.dir}/images/${req.file.filename}`;
    const url = `${config.upload.baseUrl}${relativePath}`;
    ApiResponse.success(res, { url, path: relativePath, filename: req.file.filename }, '上传成功');
  },
];

exports.uploadBanner = [
  (req, res, next) => { req.uploadSubDir = 'banners'; next(); },
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return ApiResponse.badRequest(res, '请选择要上传的文件');
    }
    const relativePath = `/${config.upload.dir}/banners/${req.file.filename}`;
    const url = `${config.upload.baseUrl}${relativePath}`;
    ApiResponse.success(res, { url, path: relativePath, filename: req.file.filename }, '上传成功');
  },
];
