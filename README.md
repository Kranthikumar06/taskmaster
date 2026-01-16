# Ardentixx - Task Management App

A full-stack task management application with user authentication, email verification, and Google OAuth integration.

## Features

- User registration with email verification
- Login/logout functionality
- Password reset via email
- Google OAuth authentication
- Task CRUD operations
- Responsive dashboard
- Dark/Light theme toggle

## Tech Stack

**Backend:**
- Node.js & Express
- MongoDB with Mongoose
- JWT authentication
- Nodemailer for emails
- Passport.js for Google OAuth
- bcryptjs for password hashing

**Frontend:**
- Vanilla JavaScript
- HTML5 & CSS3
- Responsive design

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in the root directory (use `.env.example` as template):
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   SESSION_SECRET=your_session_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5000 in your browser

## Deployment to Render

### Prerequisites
- MongoDB Atlas account (free tier available)
- Gmail account with App Password enabled
- Google OAuth credentials (optional)

### Steps

1. **Create MongoDB Atlas Database:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string

2. **Setup Gmail App Password:**
   - Enable 2-factor authentication on your Gmail
   - Go to Google Account → Security → App Passwords
   - Generate an app password for "Mail"

3. **Deploy to Render:**
   - Push your code to GitHub
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** ardentixx (or your preferred name)
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
   
4. **Add Environment Variables in Render:**
   Go to Environment section and add:
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_random_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   SESSION_SECRET=your_random_session_secret
   GOOGLE_CLIENT_ID=your_google_client_id (optional)
   GOOGLE_CLIENT_SECRET=your_google_client_secret (optional)
   GOOGLE_CALLBACK_URL=https://your-app.onrender.com/auth/google/callback
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be live at `https://your-app.onrender.com`

### Important Notes

- **Free Tier Limitations:** Render's free tier spins down after inactivity. First request may take 50+ seconds to wake up.
- **MongoDB Connection:** Use MongoDB Atlas connection string with proper credentials
- **Email Sending:** Gmail App Password is required for nodemailer to work
- **Google OAuth:** Update callback URL to your Render domain

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | mongodb+srv://user:pass@cluster.mongodb.net/db |
| JWT_SECRET | Secret for JWT tokens | random_string_32_chars |
| EMAIL_USER | Gmail address for sending emails | yourapp@gmail.com |
| EMAIL_PASS | Gmail app-specific password | abcd efgh ijkl mnop |
| SESSION_SECRET | Secret for sessions | random_string_32_chars |
| GOOGLE_CLIENT_ID | Google OAuth client ID | xxx.apps.googleusercontent.com |
| GOOGLE_CLIENT_SECRET | Google OAuth secret | GOCSPX-xxx |
| GOOGLE_CALLBACK_URL | OAuth callback URL | https://yourapp.com/auth/google/callback |

## Project Structure

```
ardentixx/
├── backend/
│   ├── config/          # Database and email configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── server.js        # Express app entry point
├── frontend/
│   ├── pages/           # HTML pages
│   ├── js/              # JavaScript files
│   ├── css/             # Stylesheets
│   └── assets/          # Images and static files
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore file
├── package.json        # Dependencies
└── README.md           # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify email
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## License

ISC
