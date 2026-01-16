# Task Masters

A full-stack web application for task management with secure user authentication, email verification, and OAuth integration.

## 🎯 Features

- **User Authentication**
  - Registration with email verification (6-digit OTP)
  - Secure login with JWT tokens
  - Password reset via email
  - Google OAuth 2.0 integration

- **Task Management**
  - Create, read, update, and delete tasks
  - Mark tasks as complete/incomplete
  - Real-time task status updates
  - User-specific task isolation

- **User Interface**
  - Responsive design for all devices
  - Dark/Light theme toggle
  - Intuitive dashboard
  - Real-time feedback and notifications

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** with **Mongoose** - Database and ODM
- **JWT** - Secure authentication tokens
- **Bcrypt** - Password hashing
- **Passport.js** - Google OAuth integration
- **Brevo API** - Transactional email service

### Frontend
- **HTML5**, **CSS3**, **JavaScript** (Vanilla)
- Responsive design
- REST API integration

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Brevo account (for email service)
- Google Cloud Console project (for OAuth)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Kranthikumar06/taskmaster.git
cd taskmaster
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# Server
PORT=5000

# Authentication
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key

# Email Service (Brevo)
EMAIL_USER=your_verified_email@gmail.com
BREVO_API_KEY=your_brevo_api_key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
```

### 4. Run the Application

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Access the application at `http://localhost:5000`

## 🔄 Application Flow

### 1. User Registration
- User fills registration form (username, email, password)
- Server validates input and checks for existing users
- 6-digit verification code is generated and sent via email
- User account is created with `isVerified: false` status
- User is redirected to verification page

### 2. Email Verification
- User enters 6-digit code received via email
- Server validates the code against database
- Upon successful verification, `isVerified` is set to `true`
- User can now log in

### 3. User Login
- User provides email/username and password
- Server validates credentials and checks verification status
- JWT token (5 min) and refresh token (7 days) are generated
- Tokens are stored in localStorage
- User is redirected to dashboard

### 4. Task Operations
- **Create**: User submits task title and description
- **Read**: All user tasks are fetched and displayed
- **Update**: User can edit task details or toggle completion status
- **Delete**: User can remove tasks permanently

### 5. Password Reset
- User requests password reset via email
- Server generates unique reset token (15-min expiry)
- Reset link is sent to user's email
- User clicks link, enters new password
- Password is hashed and updated in database

### 6. Google OAuth Flow
- User clicks "Sign in with Google"
- Redirected to Google authentication
- Upon success, server checks if user exists
- If new, auto-creates account with verified status
- JWT token is generated and user is logged in

## 📁 Project Structure

```
taskmaster/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── mailer.js          # Brevo email configuration
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   └── taskController.js  # Task CRUD operations
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Task.js            # Task schema
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   └── tasks.js           # Task endpoints
│   └── server.js              # Express server
├── frontend/
│   ├── pages/                 # HTML pages
│   ├── js/                    # JavaScript modules
│   ├── css/                   # Stylesheets
│   └── assets/                # Images and icons
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/verify` | Verify email with OTP |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |

### Tasks (Protected Routes)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all user tasks |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## 🚀 Deployment

### Render Deployment

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Configure environment variables
5. Deploy

**Build Command:** `npm install`  
**Start Command:** `npm start`

## 🔒 Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- JWT-based authentication with short expiry
- HTTP-only cookies for token storage
- Input validation and sanitization
- MongoDB injection prevention
- CORS configured
- Secure password reset with time-limited tokens

## 👨‍💻 Author

**Kranthi Kumar**  
[GitHub](https://github.com/Kranthikumar06) | [Repository](https://github.com/Kranthikumar06/taskmaster)

## 📄 License

ISC
