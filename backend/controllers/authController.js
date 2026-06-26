const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
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
    const result = await pool.query(
      'SELECT id, name, email, role, phone, address, city, postal_code, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, phone, address, city, postal_code, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ message: 'Email is already taken' });
      }
    }

    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userResult.rows[0];

    let hashedPassword = null;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    const updateResult = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           postal_code = COALESCE($6, postal_code),
           password = COALESCE($7, password)
       WHERE id = $8
       RETURNING id, name, email, role, phone, address, city, postal_code, created_at`,
      [
        name,
        email,
        phone === undefined ? null : (phone || null),
        address === undefined ? null : (address || null),
        city === undefined ? null : (city || null),
        postal_code === undefined ? null : (postal_code || null),
        hashedPassword,
        userId
      ]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updateResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile, updateProfile };
