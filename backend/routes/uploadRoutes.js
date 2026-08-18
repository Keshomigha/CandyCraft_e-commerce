const express = require('express');
const { uploadCustomizationPhoto } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/customization-photo', protect, upload.single('photo'), uploadCustomizationPhoto);

module.exports = router;
