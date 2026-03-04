# Wedding Website - Production Deployment Guide

## Overview
This is a complete wedding management system with:
- **Frontend**: Responsive wedding website hosted on Vercel (https://michaels-wedding.vercel.app/)
- **Backend**: Node.js/Express API hosted on Render (https://wedding-api.onrender.com/)
- **Database**: PostgreSQL on Render
- **Admin Dashboard**: Secured admin panel for guest management

---

## ✅ Production-Ready Features Implemented

### Frontend Updates
- ✅ Removed all sample/hardcoded data
- ✅ Added admin login link in footer (discrete access)
- ✅ Configured API base URL for production (`https://wedding-api.onrender.com/api`)
- ✅ RSVP form submits to real API endpoint
- ✅ Dynamic guest data loading from backend

### Backend Updates
- ✅ CORS configured for production domain (michaels-wedding.vercel.app)
- ✅ API endpoints fully functional
- ✅ Database migrations ready
- ✅ Optional email support (gracefully handles missing SMTP config)
- ✅ Security: JWT authentication on admin routes
- ✅ Support for both SQLite (dev) and PostgreSQL (production)

---

## 🚀 Deployment Instructions

### Step 1: Deploy Backend to Render

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production-ready changes"
   git push origin main
   ```

2. **Create Render Service**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Set configuration:
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Environment**: Node.js
     - **Region**: Choose closest to your users

3. **Add Environment Variables** in Render dashboard:
   ```
   NODE_ENV=production
   DATABASE_URL=<your-render-postgres-url>
   JWT_SECRET=<generate-secure-key>
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=<bcrypt-hash>
   ```

4. **Deploy**: Click "Deploy" and wait for it to complete

### Step 2: Configure Database

1. **Create PostgreSQL Database on Render**
   - In Render dashboard, click "New +" → "PostgreSQL"
   - Copy the connection URL
   - Add to your Render Web Service environment variables as `DATABASE_URL`

2. **Database will auto-initialize** with tables on first API call

### Step 3: Frontend Already Deployed

Your frontend is already on Vercel at `https://michaels-wedding.vercel.app/`

**To redeploy after code changes**:
```bash
git push origin main
# Vercel auto-deploys on push
```

### Step 4: Generate Required Values

**JWT Secret** (run once, save the output):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Admin Password Hash** (replace 'youwedding2025' with your password):
```bash
node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
```

---

## 🔐 Admin Access

### Access the Admin Panel
1. Users can find the admin link in the website footer (discrete 🔒 icon)
2. Or go directly: `https://michaels-wedding.vercel.app/admin.html`
3. Login with credentials from `.env`

### Default Admin Credentials (Change after first login)
- **Username**: admin
- **Password**: wedding2025 (CHANGE THIS!)

---

## 📧 Email Configuration (Optional)

To enable automatic RSVP confirmation emails:

1. **For Gmail**:
   - Enable 2-Factor Authentication
   - Go to https://myaccount.google.com/apppasswords
   - Generate App Password
   - Add to `.env`:
     ```
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-app-password
     ```

2. **For other email providers**:
   - Configure SMTP settings accordingly
   - Contact your email provider for SMTP details

---

## 🌐 API Endpoints

### Public Endpoints
- `POST /api/rsvp/submit` - Guest RSVP submission
- `GET /api/health` - Health check

### Admin Endpoints (Protected)
- `POST /api/auth/login` - Admin login
- `GET /api/guests` - List all guests
- `POST /api/guests` - Add new guest
- `DELETE /api/guests/:id` - Delete guest
- `GET /api/stats` - Wedding statistics

---

## ✨ Features

### Guest Management
- ✅ View all RSVPs in real-time
- ✅ Track attendance (Yes/No/Pending)
- ✅ Manage meal preferences
- ✅ Record dietary restrictions
- ✅ Assign seating arrangements
- ✅ Export guest lists (CSV)
- ✅ Send bulk emails (when configured)

### Dashboard Analytics
- ✅ RSVP statistics with charts
- ✅ Meal preference breakdown
- ✅ Real-time guest count
- ✅ Attendance trends
- ✅ Activity feed

### Guest RSVP
- ✅ Multi-step form (attendance → details → meal → review)
- ✅ Form validation
- ✅ Dietary restrictions selection
- ✅ Guest count adjustment
- ✅ Success confirmation with confetti animation

---

## 🛠️ Troubleshooting

### API Connection Issues

**Problem**: Admin dashboard shows "Failed to load guests"
**Solution**:
1. Check backend is running on Render (check deployment logs)
2. Verify DATABASE_URL environment variable is set
3. Check CORS is allowing your frontend URL

### Email Issues

**Problem**: RSVP submissions work but no confirmation email
**Solution**: 
- Email is optional - RSVPs are saved even if email fails
- If you want emails, configure SMTP settings
- Check email spam folder

### Database Connection

**Problem**: "Unable to connect to database"
**Solution**:
1. Verify DATABASE_URL is correct
2. Ensure PostgreSQL database exists on Render
3. Check database credentials in connection string

---

## 📱 Testing Checklist

- [ ] Frontend loads at https://michaels-wedding.vercel.app/
- [ ] Admin link visible in footer
- [ ] Can navigate to admin.html
- [ ] Can login with admin credentials
- [ ] Guest list loads in admin dashboard
- [ ] Charts display correctly
- [ ] Can add a test guest
- [ ] Can submit RSVP from public form
- [ ] RSVP appears in admin dashboard within 30 seconds

---

## 🔒 Security Best Practices

1. **Change default credentials** immediately after deployment
2. **Rotate JWT secret** periodically
3. **Use HTTPS only** (Vercel and Render both provide this)
4. **Restrict admin access** to trusted devices
5. **Enable 2FA** on Render and Vercel accounts
6. **Regularly backup** database (Render provides automated backups)
7. **Monitor API logs** for suspicious activity

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Render logs: Dashboard → Your Web Service → Logs
3. Check browser console for error messages (F12)
4. Check network tab to see API requests/responses

---

## 🎉 Congratulations!

Your wedding website is now production-ready!

**Key URLs**:
- 🌐 Website: https://michaels-wedding.vercel.app/
- 🛡️ Admin: https://michaels-wedding.vercel.app/admin.html
- 📡 API: https://wedding-api.onrender.com/api

**Next Steps**:
1. Share website with guests
2. Monitor RSVPs in admin dashboard
3. Manage seating arrangements
4. Export final guest list before wedding

---

*Last Updated: March 4, 2026*
