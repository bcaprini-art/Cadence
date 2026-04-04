const multer = require('multer')
const path = require('path')
const fs = require('fs')

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/logos')

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const schoolId = req.params.id || 'unknown'
    const timestamp = Date.now()
    cb(null, `school-${schoolId}-${timestamp}${ext}`)
  },
})

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.svg', '.webp']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only jpg, jpeg, png, svg, webp files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

module.exports = upload
