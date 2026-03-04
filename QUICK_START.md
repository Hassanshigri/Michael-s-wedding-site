# 🚀 Quick Start to Production

Get your wedding website live in 15 minutes!

## ⏱️ 5-Minute Setup

### 1. Create Render Account (if needed)
   - Go to https://render.com
   - Sign up with GitHub
   - Click "New +" → "Web Service"

### 2. Connect Backend to Render

```bash
# Clone your repo on Render
Git Repo: https://github.com/yourusername/your-repo.git
Branch: main
Build Command: npm install
Start Command: node server.js
Environment: Node
```

### 3. Create PostgreSQL Database on Render

```bash
Click "New +" → "PostgreSQL"
Name: wedding-db
Copy the connection string
```

### 4. Set Environment Variables

In your Render Web Service dashboard:

```env
NODE_ENV=production
DATABASE_URL=<paste-your-postgres-url-here>
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<run: node -e "console.log(require('bcryptjs').hashSync('wedding2025', 10))">
```

### 5. Deploy

Click "Deploy" button - wait ~2-3 minutes

### 6. Get Your API URL

From Render dashboard:
```
https://your-wedding-api-xxxxx.onrender.com
```

### 7. Update Your Frontend

Edit these files with your Render URL:

**js/admin.js (line ~12)**:
```javascript
const API_BASE_URL = 'https://your-wedding-api-xxxxx.onrender.com/api';
```

**rsvp.html (line ~1453)**:
```javascript
const API_BASE_URL = 'https://your-wedding-api-xxxxx.onrender.com/api';
```

### 8. Push to GitHub

```bash
git add .
git commit -m "Update API URLs for production"
git push origin main
```

Vercel auto-deploys!

### 9. Test

1. Go to https://michaels-wedding.vercel.app/admin.html
2. Login: admin / wedding2025
3. Should show empty guest list
4. Go to RSVP form and test submission
5. RSVP should appear in admin within 30 seconds

## ✅ Done!

Your website is now live! 🎉

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Website | https://michaels-wedding.vercel.app |
| Admin | https://michaels-wedding.vercel.app/admin.html |
| API | https://your-wedding-api.onrender.com/api |
| Database | Render PostgreSQL |

---

## 🔐 Security Checklist

- [ ] Changed admin password (not wedding2025)
- [ ] Generated unique JWT_SECRET
- [ ] Database URL is secure
- [ ] No secrets in frontend code
- [ ] CORS configured for your domain

---

## 📞 Common Problems & Solutions

### Blank Admin Dashboard
**Problem**: Guest list doesn't show
- Check: Backend running on Render?
- Check: DATABASE_URL configured?
- Check: API URL correct in admin.js?

**Solution**: 
1. Check Render logs for errors
2. Verify DATABASE_URL in environment variables
3. Check that postgres.createDatabase was run

### RSVP Form Fails
**Problem**: "Failed to submit RSVP"
- Check: Network error (F12 → Network tab)
- Check: Correct API URL?
- Check: CORS error?

**Solution**:
1. Look at network response
2. Verify API_BASE_URL matches your Render URL
3. Check Render logs for errors

### Any JavaScript Errors
**Problem**: Blank page or errors in console
- Check: Typos in API URLs
- Check: Missing `const` or `;`
- Check: Syntax errors after edits

**Solution**:
1. Check browser console (F12)
2. Check edited file syntax
3. Re-save and reload

---

## 📋 Files Needing Updates

Before deploying, ensure you've updated:

- ✅ `js/admin.js` - API_BASE_URL (line ~12)
- ✅ `rsvp.html` - API_BASE_URL (line ~1453)
- ✅ Admin password in `.env.production`
- ✅ JWT_SECRET in `.env.production`

---

## 🎊 Congratulations!

Your wedding website is production-ready!

**Cost**:
- Vercel Frontend: **FREE** ✓
- Render Backend (Hobby): **FREE** ✓
- Render PostgreSQL: **FREE** ✓
- **Total**: **$0** 🎉

**Next**: Share with guests and start collecting RSVPs!

---

*For detailed info, see DEPLOYMENT.md*
*Last updated: March 4, 2026*
