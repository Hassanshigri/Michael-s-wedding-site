# Production Deployment Checklist

## Pre-Deployment

- [ ] All code committed to git
- [ ] No hardcoded secrets in code
- [ ] All sample data removed
- [ ] API URLs use environment variables
- [ ] CORS configured for production domain
- [ ] Database migrations tested locally

## Backend Deployment (Render)

- [ ] GitHub repository linked to Render
- [ ] Build command: `npm install`
- [ ] Start command: `node server.js`
- [ ] Environment variables set:
  - [ ] NODE_ENV=production
  - [ ] DATABASE_URL=<postgres-url>
  - [ ] JWT_SECRET=<secure-random-key>
  - [ ] ADMIN_USERNAME=admin
  - [ ] ADMIN_PASSWORD_HASH=<bcrypt-hash>
- [ ] Deployment successful (check logs)
- [ ] Health check endpoint responds: https://your-api-url/api/health

## Database Setup (Render PostgreSQL)

- [ ] PostgreSQL database created
- [ ] Connection string obtained
- [ ] Database URL added to backend environment variables
- [ ] Tables created (auto-migrate on first API call)

## Frontend Verification

- [ ] Website loads: https://michaels-wedding.vercel.app/
- [ ] All pages accessible
- [ ] Admin link visible in footer
- [ ] Navigation works correctly
- [ ] Responsive design verified on mobile

## Admin Panel Testing

- [ ] Can navigate to https://michaels-wedding.vercel.app/admin.html
- [ ] Login page displays correctly
- [ ] Can login with admin credentials
- [ ] Dashboard loads with empty guest list (first time)
- [ ] Can add a test guest
- [ ] Statistics update after adding guest
- [ ] Charts render correctly in Overview section
- [ ] Guest table displays test guest

## RSVP Form Testing

- [ ] RSVP page loads: https://michaels-wedding.vercel.app/rsvp.html
- [ ] Form validation works
- [ ] Can select attendance (Yes/No)
- [ ] Can enter personal details
- [ ] Can select meal preferences
- [ ] Can toggle dietary restrictions
- [ ] Can review submission
- [ ] Can submit RSVP successfully
- [ ] Success page displays with confetti
- [ ] RSVP appears in admin dashboard within 30 seconds
- [ ] Email received (if SMTP configured)

## Security Verification

- [ ] Admin credentials are unique and strong
- [ ] JWT_SECRET is a secure random string
- [ ] No console errors in browser
- [ ] API requires authentication headers
- [ ] CORS only allows production domains
- [ ] No sensitive data in frontend code

## Performance Checks

- [ ] Page loads within 3 seconds
- [ ] Dashboard loads within 2 seconds
- [ ] API responds within 500ms
- [ ] Images optimized and loading properly
- [ ] No unnecessary network requests

## Monitoring & Maintenance

- [ ] Set up email alerts on Render for failed deployments
- [ ] Monitor API error logs weekly
- [ ] Backup database configuration documented
- [ ] Update plan in place for future changes

## Post-Deployment

- [ ] Share website URL with guests: https://michaels-wedding.vercel.app/
- [ ] Send invitations with RSVP link
- [ ] Monitor admin dashboard for incoming RSVPs
- [ ] Set up calendar reminders for RSVP deadline
- [ ] Plan for seating arrangements management

## Deployment Status

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://michaels-wedding.vercel.app/ | ✅ Ready |
| Admin | https://michaels-wedding.vercel.app/admin.html | ✅ Ready |
| Backend API | https://wedding-api.onrender.com/api | ⏳ Pending |
| Database | Render PostgreSQL | ⏳ Pending |

---

## Important Dates

- **Development Start**: March 2026
- **Production Launch**: [DATE]
- **RSVP Deadline**: [DATE]
- **Wedding Date**: June 15, 2025

---

## Contact & Support

For deployment issues, refer to DEPLOYMENT.md in the project root.
