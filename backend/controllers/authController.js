// @desc    Send password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user with that email' });
    }
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 1000 * 60 * 15; // 15 min expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    // Send email
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your password',
      html: `<div style="font-family: 'Open Sans', Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 12px; max-width: 400px; margin: auto; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <h2 style="color: #222; text-align: center; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="color: #444; text-align: center; font-size: 16px;">Click the link below to reset your password. This link is valid for 15 minutes.</p>
        <div style="text-align:center;margin:18px 0;"><a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="background:#ff6b6b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a></div>
        <p style="color: #666; text-align: center; font-size: 14px; margin-top: 12px;">If you did not request this, you can safely ignore this email.</p>
      </div>`
    });
    res.status(200).json({ success: true, message: 'Reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const user = await User.findOne({ email, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    user.password = password;
    user.markModified('password'); // Ensure pre-save hook runs for hashing
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Verify user email
// @route   POST /api/auth/verify
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code required' });
    }
    const user = await User.findOne({ email }).select('+verificationCode');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User already verified' });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();
    return res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const transporter = require('../config/mailer');

// Generate JWT Token with 5 minute expiration
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '5m',
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: userExists.email === email ? 'Email already taken' : 'Username already taken',
      });
    }

    // Generate 6-digit numeric verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user as unverified
    const user = await User.create({
      username,
      email,
      password,
      verificationCode,
      isVerified: false,
    });

    // Send verification email with timeout
    try {
      await Promise.race([
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Verify your email',
          html: `
            <div style="font-family: 'Open Sans', Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 12px; max-width: 400px; margin: auto; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
              <h2 style="color: #222; text-align: center; margin-bottom: 16px;">Welcome to Task Masters!</h2>
              <p style="color: #444; text-align: center; font-size: 16px;">To complete your registration, please enter the verification code below:</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 12px; color: #ff6b6b; background: #fff; padding: 16px 0; border-radius: 8px; text-align: center; margin: 18px 0; border: 1px solid #eee;">${verificationCode}</div>
              <p style="color: #666; text-align: center; font-size: 14px; margin-top: 12px;">If you did not request this, you can safely ignore this email.<br>Thank you for joining us!</p>
            </div>
          `,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 30000))
      ]);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail registration if email fails, user is already created
    }

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Verification code sent to your email',
        data: {
          _id: user._id,
          email: user.email,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username/email and password',
      });
    }

    // Check for user by email or username and include password
    const user = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }] 
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please sign up.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
        refreshToken: generateRefreshToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new access token
    const newToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};