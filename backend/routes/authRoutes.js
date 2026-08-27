const express = require('express');
const { register, login, getProfile, updateProfile, updateProfilePhoto } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/photo', protect, upload.single('photo'), updateProfilePhoto);

module.exports = router;
