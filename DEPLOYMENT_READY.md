Now supporting custom Node.js/Express backend!

## What Changed

### ✅ Backend Setup Complete
- **Express.js API server** with PostgreSQL database
- **JWT-based authentication** (no more Supabase)
- **All migrations automated** (runs on startup)
- **Docker compose** for local development
- **Full CRUD operations** for all entities

### ✅ Frontend Updated  
- Uses new `/api` endpoints instead of Supabase
- Auto-login/logout with JWT tokens
- Same UI/UX, better performance
- Works entirely offline-first with your own server

### ✅ Database Features
- PostgreSQL schema with all tables
- Automatic migrations on first run
- User authentication with bcrypt
- Full data isolation per teacher
- Ready for production

---

## 🚀 Quick Start (Choose One)

### Local Development (Recommended for Testing)
```bash
# Start everything with Docker
docker-compose up -d

# Frontend runs on http://localhost:5173
# Backend runs on http://localhost:3000
# Database runs on localhost:5432
```

### Production Ready
See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for:
- Railway.app deployment (~$5-10/month)
- Render.com deployment
- DigitalOcean VPS
- Any other hosting provider

---

## 📁 Project Structure

```
CoCreate/
├── server/                 # NEW! Express backend
│   ├── src/
│   │   ├── index.js      # Main server
│   │   ├── db/           # Database setup
│   │   ├── middleware/   # Auth middleware
│   │   └── routes/       # API endpoints
│   ├── Dockerfile        # Container config
│   └── package.json
├── src/                  # Frontend (Vue.js)
│   ├── composables/
│   │   ├── useApi.ts     # NEW! API client
│   │   └── useAuthApi.ts # NEW! Auth composable
│   └── components/       # All components updated
├── docker-compose.yml    # NEW! Local setup
└── SETUP_GUIDE.md        # NEW! Deployment guide
```

---

## 🔄 Migration from Supabase

The app automatically:
1. ✅ Connects to local PostgreSQL (or any PostgreSQL)
2. ✅ Creates all tables on first run
3. ✅ Initializes all triggers and functions
4. ✅ No manual SQL needed!

Just run:
```bash
docker-compose up -d
npm run dev
# Done! Register and start using the app
```

---

## 🛡️ Security

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with 7-day expiration
- ✅ Database user isolation per teacher
- ✅ CORS enabled for frontend
- ✅ Ready for HTTPS in production

---

## 📊 No Hibernation = Always Fast

- ❌ Supabase free tier: Pauses after 1 week (causes slow startup)
- ✅ Your own server: Always running, instant response
- ✅ Costs: $0-15/month (vs $25/mo for Supabase Pro)

---

## 🚀 Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000/api
```

**Backend (.env in server folder):**
```
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

See `server/.env.example` for all options.

---

## 📞 Next Steps

1. Run `docker-compose up -d` to start locally
2. Test registration at http://localhost:5173
3. When ready: See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for production deployment
4. All your data stays on YOUR server!

---

**Questions?** Check the logs:
```bash
docker-compose logs -f server
docker-compose logs -f postgres
```

Happy teaching! 🎓
