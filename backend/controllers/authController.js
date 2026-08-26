const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models/sequelize');
const {
  createUser,
  findUserByEmail,
  createSellerProfile,
} = require('../models/userModel');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password, role, shopName, shopDescription } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const userRole = role === 'seller' ? 'seller' : 'buyer';

    if (userRole === 'seller' && !shopName) {
      return res.status(400).json({ message: 'Shop name is required for seller registration' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, password: hashedPassword, role: userRole });

    if (userRole === 'seller') {
      await createSellerProfile(user.id, shopName, shopDescription);
    }

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'phone', 'address', 'city', 'postal_code', 'created_at'],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.get({ plain: true }));
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, phone, address, city, postal_code, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (email) {
      const existing = await User.findOne({ where: { email, id: { [Op.ne]: userId } } });
      if (existing) {
        return res.status(409).json({ message: 'Email is already taken' });
      }
    }

    const user = await User.findByPk(userId, { attributes: ['password'] });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const changes = {};
    if (name !== undefined) changes.name = name;
    if (email !== undefined) changes.email = email;
    if (phone !== undefined) changes.phone = phone || null;
    if (address !== undefined) changes.address = address || null;
    if (city !== undefined) changes.city = city || null;
    if (postal_code !== undefined) changes.postal_code = postal_code || null;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      changes.password = await bcrypt.hash(newPassword, 10);
    }

    const [, rows] = await User.update(changes, {
      where: { id: userId },
      returning: ['id', 'name', 'email', 'role', 'phone', 'address', 'city', 'postal_code', 'created_at'],
    });

    res.json({
      message: 'Profile updated successfully',
      user: rows[0].get({ plain: true }),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile, updateProfile };
