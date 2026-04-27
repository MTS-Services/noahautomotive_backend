const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads");
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|avif/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = /image\/(jpeg|jpg|png|webp|avif)/.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, webp, avif)"));
  }
};
//hello world
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 60 * 1024 * 1024 },
});

const ALLOWED_IMAGE_EXT = /jpeg|jpg|avif|png|webp/;
const ALLOWED_VIDEO_EXT = /mp4|mov|avi|mkv|webm/;
const ALLOWED_IMAGE_MIME = /image\/(jpeg|jpg|avif|png|webp)/;
const ALLOWED_VIDEO_MIME = /video\/(mp4|quicktime|x-msvideo|x-matroska|webm)/;

const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const chatDir = path.join(__dirname, "..", "uploads", "chat");
    ensureUploadDir(chatDir);
    cb(null, chatDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const chatFileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const isImage =
    ALLOWED_IMAGE_EXT.test(ext) && ALLOWED_IMAGE_MIME.test(file.mimetype);
  const isVideo =
    ALLOWED_VIDEO_EXT.test(ext) && ALLOWED_VIDEO_MIME.test(file.mimetype);

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only images (jpeg, jpg, avif, png, webp) and videos (mp4, mov, avi, mkv, webm) are allowed",
      ),
    );
  }
};

const chatUpload = multer({
  storage: chatStorage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const listingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const listingDir = path.join(__dirname, "..", "uploads", "listings");
    ensureUploadDir(listingDir);
    cb(null, listingDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const listingUpload = multer({
  storage: listingStorage,
  fileFilter,
  limits: { fileSize: 60 * 1024 * 1024 },
});

module.exports = upload;
module.exports.profileUpload = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
]);
module.exports.chatUpload = chatUpload;
module.exports.listingUpload = listingUpload;
