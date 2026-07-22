// 
const multer = require('multer');
const path = require('path');

// Use an absolute path (relative to THIS file's location) instead of a
// relative 'uploads/' path. Relative paths resolve against process.cwd(),
// which changes depending on how/where the server is started (nodemon,
// pm2, docker, etc.) — that mismatch is what causes saved files to end up
// in a different folder than the one express.static serves from.
const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-')),
});

const fileFilter = (req, file, cb) =>
  /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())
    ? cb(null, true)
    : cb(new Error('Only images allowed'));

module.exports = multer({ storage, fileFilter });