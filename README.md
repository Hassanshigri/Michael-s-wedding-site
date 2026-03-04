# Sarah & Michael's Wedding Website 💍

A production-ready wedding management system with guest RSVPs, admin dashboard, and real-time analytics.

## 🌐 Live Demo

- **Website**: https://michaels-wedding.vercel.app/
- **Admin Panel**: https://michaels-wedding.vercel.app/admin.html
- **API**: https://wedding-api.onrender.com/api

## ✨ Features

### 🎯 For Guests
- Beautiful, responsive wedding website
- Multi-step RSVP form with validation
- Meal preference selection
- Dietary restriction tracking
- Automatic confirmation emails (optional)
- Real-time confirmation feedback

### 👨‍💼 For Admins
- Secure admin dashboard with authentication
- Real-time guest list management
- RSVP statistics and analytics
- Beautiful charts and graphs
- Meal preference breakdown
- Dietary restrictions summary
- Bulk guest management
- CSV export functionality
- Activity feed and logs

### 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript
  - Bootstrap 5 for responsive design
  - Chart.js for analytics
  - AOS for scroll animations
  - GSAP for smooth interactions
  
- **Backend**: Node.js + Express
  - Authentication with JWT
  - RESTful API design
  - Sequelize ORM
  - Nodemailer for email notifications
  
- **Database**: PostgreSQL (production) / SQLite (development)
  - Auto-migrations
  - Full data persistence
  
- **Hosting**: 
  - Frontend: Vercel (serverless)
  - Backend: Render (web service)
  - Database: Render PostgreSQL

## 📋 Project Structure

```
first-design/
├── index.html              # Main landing page
├── rsvp.html              # RSVP form page
├── gallery.html           # Photo gallery
├── admin.html             # Admin dashboard
├── css/
│   ├── style.css          # Main stylesheet
│   └── admin.css          # Admin dashboard styles
├── js/
│   ├── main.js            # Main website scripts
│   └── admin.js           # Admin dashboard scripts
└── backend/
    ├── server.js          # Express server
    ├── package.json       # Dependencies
    ├── .env               # Environment variables
    ├── models/
    │   └── index.js       # Database models
    ├── routes/
    │   ├── auth.js        # Authentication routes
    │   ├── guests.js      # Guest management routes
    │   └── rsvp.js        # RSVP submission routes
    └── middleware/
        └── auth.js        # JWT authentication
```

## 🚀 Getting Started

### Local Development

#### Prerequisites
- Node.js 14+
- npm or yarn
- Git

#### Backend Setup
```bash
cd backend
npm install

# Create .env file with development settings
# (See .env.example for reference)

# Start development server
npm run dev

# API will be available at http://localhost:3000/api
```

#### Frontend Setup
```bash
# Frontend is static files, serve with any HTTP server
# Option 1: Python
python -m http.server 5500

# Option 2: Node.js http-server
npx http-server -p 5500

# Option 3: VS Code Live Server extension

# Visit http://localhost:5500
```

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions.

**Quick Start**:
1. Deploy backend to Render
2. Configure environment variables
3. Frontend auto-deploys on git push to Vercel

## 🔐 Admin Credentials

Default credentials (change immediately after first login):
```
Username: admin
Password: wedding2025
```

To change password:
```bash
node -e "console.log(require('bcryptjs').hashSync('newpassword', 10))"
# Copy output and update ADMIN_PASSWORD_HASH in .env
```

## 📚 API Documentation

### Authentication
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "wedding2025"
}

Response:
{
  "token": "jwt_token_here",
  "user": { ... }
}
```

### Guest Management
```bash
# List guests
GET /api/guests
Authorization: Bearer <token>

# Add guest
POST /api/guests
Authorization: Bearer <token>
Content-Type: application/json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-1234"
}

# Delete guest
DELETE /api/guests/:id
Authorization: Bearer <token>
```

### RSVP Submission
```bash
POST /api/rsvp/submit
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "attendance": "yes",
  "guestCount": 2,
  "meal": "beef",
  "dietary": ["nut-free"],
  "notes": ""
}
```

## 🎨 Customization

### Colors & Styling
Edit `css/style.css` to change:
- Primary colors (sage green, gold)
- Fonts (Cormorant Garamond, Montserrat)
- Spacing and layout

### Wedding Details
Update in HTML files:
- Couple names: "Sarah & Michael"
- Wedding date: "June 15, 2025"
- Venue information
- Guest list (loaded from API in production)

### Admin Dashboard
Customize in `js/admin.js` and `css/admin.css`:
- Charts and statistics
- Dashboard layout
- Guest table columns
- Filtering options

## 🐛 Troubleshooting

### Frontend Issues

**"Failed to load guests"**
- Check backend is running
- Verify API URL in browser console
- Check CORS configuration

**RSVP form not submitting**
- Check network tab in DevTools
- Verify API endpoint is accessible
- Check form validation errors

### Backend Issues

**Database connection error**
- Verify DATABASE_URL in .env
- Check database is running (PostgreSQL)
- For SQLite dev, ensure database.sqlite has write permissions

**Authentication fails**
- Verify JWT_SECRET is set
- Check admin credentials
- Clear browser sessionStorage and retry

## 📊 Analytics & Monitoring

### Admin Dashboard Metrics
- Total guests invited
- RSVPs received (Yes/No/Pending)
- RSVP response rate %
- Meal preferences breakdown
- Dietary restrictions summary
- Guest count trends
- Daily RSVP timeline

### Data Export
- Export guest list as CSV
- Export meal report
- Export selected guests

## 📧 Email Configuration

To enable automated RSVP confirmation emails:

1. Set SMTP credentials in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```

2. Emails are optional - RSVPs work without SMTP configured

## 🔒 Security

- ✅ Password hashing with bcryptjs
- ✅ JWT authentication
- ✅ CORS protection
- ✅ Input validation
- ✅ Secure session storage
- ✅ HTTPS on production
- ✅ No sensitive data in frontend code

## 🎓 Learning Resources

- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)
- [Express.js Guide](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)
- [Chart.js Docs](https://www.chartjs.org/)

## 📝 License

This project is custom-built for Sarah & Michael's wedding.
All code and designs are property of the creators.

## 🙏 Credits

Built with ❤️ for an unforgettable celebration.

---

**Last Updated**: March 4, 2026
**Current Version**: 1.0.0 (Production Ready)
