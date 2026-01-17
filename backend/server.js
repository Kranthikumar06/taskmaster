const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-session-secret',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from frontend directory
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use('/reset-password.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/reset-password.html'));
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback'
},
function(accessToken, refreshToken, profile, done) {
  // Here, you would find or create the user in your DB
  return done(null, profile);
}
));

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async function(req, res) {
    // Successful authentication, check if user exists
    const googleUser = req.user;
    const email = googleUser.emails && googleUser.emails[0] ? googleUser.emails[0].value : '';
    const name = googleUser.displayName || '';

    let user = await User.findOne({ email });
    if (!user) {
      // Auto-create user with Google info
      // Use email prefix as username if possible
      let username = email.split('@')[0];
      // Ensure username is unique
      let usernameBase = username;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${usernameBase}${counter}`;
        counter++;
      }
      // Set a random password (not used for Google login)
      const randomPassword = Math.random().toString(36).slice(-8) + Date.now();
      user = new User({
        username,
        email,
        password: randomPassword,
        isVerified: true // Google users are auto-verified
      });
      await user.save();
    }
    // Generate JWT tokens (both access and refresh)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Redirect directly to dashboard with tokens in URL (frontend will store them)
    return res.redirect(`/dashboard?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&token=${token}&refreshToken=${refreshToken}`);
  }
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/signup.html'));
});


app.get('/verify.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/verify.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});