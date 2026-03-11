# CoCreate - Self-Hosted Setup Guide

Complete setup instructions for running CoCreate with a custom Node.js/Express backend and PostgreSQL database.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- Docker & Docker Compose installed
- Git

### 1. Setup Backend

```bash
cd server
npm install
cp .env.example .env
```

### 2. Start Database & Server with Docker

```bash
# From project root
docker-compose up -d

# Check logs
docker-compose logs -f server
```

The server will:
- Wait for PostgreSQL to be ready
- Auto-create tables and schema
- Run on http://localhost:3000

### 3. Setup Frontend

```bash
# From project root
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### 4. Test the App

1. Open http://localhost:5173
2. Click "Registreren" (Register)
3. Create an account
4. Start adding students and tracking attendance!

---

## 🛑 Stopping Everything

```bash
docker-compose down

# To also delete data
docker-compose down -v
```

---

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` - Create new teacher account
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Attendance
- `GET /api/attendance?startDate=...&endDate=...` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `PATCH /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

### Rewards
- `GET /api/rewards` - Get all rewards
- `POST /api/rewards` - Create reward
- `GET /api/rewards/student/:studentId` - Get student's rewards
- `POST /api/rewards/assign` - Assign reward to student
- `PATCH /api/rewards/:id/redeem` - Toggle reward redeemed status
- `DELETE /api/rewards/:id` - Delete reward

### Teacher
- `GET /api/teacher` - Get teacher info
- `GET /api/teacher/settings` - Get teacher settings
- `PATCH /api/teacher/settings` - Update teacher settings

---

## 🐳 Docker Compose Details

The `docker-compose.yml` includes:

1. **PostgreSQL** (postgres:15-alpine)
   - Database: `cocreate`
   - User: `postgres`
   - Password: `postgres`
   - Port: 5432
   - Data persists in `postgres_data` volume

2. **Node.js Server**
   - Runs on port 3000
   - Auto-initializes database
   - Waits for PostgreSQL to be ready

---

## 🌍 Production Deployment

### Option 1: Railway.app (Recommended - ~$5-10/month)

1. **Create Railway account** at railway.app

2. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

3. **Create new project in Railway**
   - Connect GitHub repo
   - Create PostgreSQL from Railway marketplace
   - Create Node.js service from Dockerfile in `/server`

4. **Set environment variables in Railway**
   ```
   DB_HOST=<railway-postgres-host>
   DB_PORT=<railway-postgres-port>
   DB_NAME=cocreate
   DB_USER=postgres
   DB_PASSWORD=<your-secure-password>
   JWT_SECRET=<your-super-secret-key>
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=<your-vercel-url>
   ```

5. **Deploy frontend to Vercel**
   - Go to vercel.com
   - Connect GitHub repo
   - Set `VITE_API_URL` environment variable to your Railway server URL

### Option 2: Render.com (~$7-12/month)

1. **Create Render account** at render.com

2. **Create PostgreSQL Database**
   - Create new → PostgreSQL
   - Copy connection string

3. **Create Web Service**
   - Connect GitHub repo
   - Set Build Command: `cd server && npm install`
   - Set Start Command: `cd server && npm start`
   - Set environment variables (same as Railway above)

4. **Deploy frontend to Vercel** (same as Railway step 5)

### Option 3: Self-Hosted VPS (DigitalOcean, Linode, etc.)

1. **Create VPS with Ubuntu 22.04 LTS** (~$5-6/month)

2. **SSH into your server and install Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Clone repo and deploy**
   ```bash
   git clone <your-repo-url>
   cd CoCreate
   docker-compose up -d
   ```

4. **Setup reverse proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /api {
           proxy_pass http://localhost:3000;
       }

       location / {
           proxy_pass http://localhost:5173;
       }
   }
   ```

5. **Get SSL certificate (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Change database password from default `postgres`
- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Set `NODE_ENV=production` on production server
- [ ] Use strong database backups
- [ ] Keep Node.js and PostgreSQL updated
- [ ] Use environment variables for all secrets (never commit .env)

---

## 📊 Database Schema

```
teachers
├── id (UUID, PK)
├── username (TEXT, UNIQUE)
├── email (TEXT, UNIQUE)
├── password_hash (TEXT)
└── timestamps

students
├── id (UUID, PK)
├── teacher_id (FK → teachers)
├── name (TEXT)
├── points (INTEGER)
├── email (TEXT)
├── notes (TEXT)
└── timestamps

attendance
├── id (UUID, PK)
├── student_id (FK → students)
├── date (DATE)
├── on_time (BOOLEAN)
└── timestamps

rewards
├── id (UUID, PK)
├── teacher_id (FK → teachers)
├── name (TEXT)
├── description (TEXT)
├── points_required (INTEGER)
├── icon (TEXT)
└── timestamps

student_rewards
├── id (UUID, PK)
├── student_id (FK → students)
├── reward_id (FK → rewards)
├── assigned_at (TIMESTAMPTZ)
├── redeemed (BOOLEAN)
├── redeemed_at (TIMESTAMPTZ)
└── timestamps

teacher_settings
├── id (UUID, PK)
├── teacher_id (FK → teachers, UNIQUE)
├── class_name (TEXT)
├── class_year (TEXT)
├── class_subject (TEXT)
├── points_on_time (INTEGER)
├── points_late (INTEGER)
├── points_absent (INTEGER)
└── timestamps
```

---

## 🐛 Troubleshooting

### Database connection refused
- Check PostgreSQL is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Ensure port 5432 is not blocked

### Server crashes on startup
- Check migrations: `docker-compose logs server`
- Verify `.env` variables are set correctly
- Ensure database user/password matches

### Frontend can't reach API
- Verify backend is running: `curl http://localhost:3000/health`
- Check `VITE_API_URL` environment variable
- Check CORS is configured correctly

### Password reset needed
- Direct database access (for development):
  ```bash
  docker-compose exec postgres psql -U postgres -d cocreate
  SELECT * FROM teachers;
  ```

---

## 📞 Support

For issues or questions:
1. Check server logs: `docker-compose logs server`
2. Check database logs: `docker-compose logs postgres`
3. Verify all environment variables are set
4. Check firewall rules if deployed on VPS

---

**Tip**: Keep your fork updated with latest changes and don't commit sensitive data to git!
