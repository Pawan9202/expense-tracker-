const express = require('express');
const User = require('../models/user');
const Category = require('../models/category');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin, validateProfileUpdate, validatePasswordChange } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        error: 'Username already exists',
        message: 'Please choose a different username'
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'An account with this email already exists'
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    await Category.createDefaultCategories(user._id);

    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message || 'An error occurred during registration'
    });
  }
});


router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message || 'An error occurred during login'
    });
  }
});


router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'An error occurred while retrieving your profile'
    });
  }
});

router.put('/profile', authenticateToken, validateProfileUpdate, async (req, res) => {
  try {
    const { username, email, whatsappNumber } = req.body;
    const updates = {};

    if (username && username !== req.user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          error: 'Username already exists',
          message: 'Please choose a different username'
        });
      }
      updates.username = username;
    }

    if (email && email !== req.user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          error: 'Email already exists',
          message: 'An account with this email already exists'
        });
      }
      updates.email = email;
    }

    if (whatsappNumber !== undefined) {
      if (whatsappNumber === '') {
        updates.whatsappNumber = null;
      } else {
        const existingNumber = await User.findOne({ whatsappNumber, _id: { $ne: req.user.id } });
        if (existingNumber) {
          return res.status(400).json({
            error: 'Number already exists',
            message: 'This WhatsApp number is already linked to another account'
          });
        }
        updates.whatsappNumber = whatsappNumber;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        whatsappNumber: updatedUser.whatsappNumber,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'An error occurred while updating your profile'
    });
  }
});


router.put('/password', authenticateToken, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Invalid current password',
        message: 'Your current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'An error occurred while changing your password'
    });
  }
});


router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user.id);

    if (!deletedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Account deletion failed',
      message: 'An error occurred while deleting your account'
    });
  }
});

module.exports = router;
