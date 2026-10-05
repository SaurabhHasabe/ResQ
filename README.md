# ResQ - Disaster Management System

A comprehensive disaster management platform for reporting incidents, managing shelters, and coordinating aid requests during emergencies.

## 🌐 Live Demo

**Deployed URL:** [https://resq-bbx4.onrender.com](https://resq-bbx4.onrender.com)

---

## 🚀 Features

- **Incident Reporting** — Citizens can report disasters with photos and location
- **Emergency Shelters** — Real-time shelter capacity tracking
- **Aid Requests** — Coordinate rescue, medical, food, water, and other aid
- **Interactive Maps** — Mapbox GL JS with real-time markers
- **User Roles** — Admin, Volunteer, and Citizen access levels
- **Secure Authentication** — Passport.js with bcrypt password hashing

---

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (image uploads)
- Mapbox account (maps)

---

## 🛠️ Local Development Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Mini-Project-III
npm install
```

### 2. Environment Variables

Create `.env` file:

```bash
NODE_ENV=development
PORT=3000
DB_URL=mongodb://127.0.0.1:27017/resq
SESSION_SECRET=generate-with-openssl-rand-base64-32
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_KEY=your_key
CLOUDINARY_SECRET=your_secret
MAPBOX_TOKEN=your_token
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Seed Database

```bash
npm run seed
```

**Default credentials:**
- Admin: `admin` / `Admin@1234`
- Volunteer: `ravi_v` / `Ravi@5678`
- Citizen: `suresh_c` / `Suresh@1234`

### 4. Start Server

```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

Visit: `http://localhost:3000`

---

## 🚀 Production Deployment

### Step 1: Get Your Credentials

| Service | Sign Up | Get Credentials |
|---------|---------|-----------------|
| **MongoDB** | [cloud.mongodb.com](https://cloud.mongodb.com) | Create cluster → Get connection string |
| **Cloudinary** | [cloudinary.com](https://cloudinary.com) | Dashboard → Cloud name, API key, Secret |
| **Mapbox** | [mapbox.com](https://mapbox.com) | Account → Access tokens |

### Step 2: Deploy to Render (Recommended - Free)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** resq-disaster-management
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

4. **Add Environment Variables**
   Click "Environment" tab and add:
   ```
   NODE_ENV=production
   DB_URL=mongodb+srv://username:password@cluster.mongodb.net/resq
   SESSION_SECRET=<your-generated-secret>
   CLOUDINARY_CLOUD_NAME=<your-value>
   CLOUDINARY_KEY=<your-value>
   CLOUDINARY_SECRET=<your-value>
   MAPBOX_TOKEN=<your-value>
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for build
   - Your app will be live at: `https://your-app.onrender.com`

6. **Seed Database** (Optional)
   - Go to "Shell" tab in Render
   - Run: `npm run seed`
   - Login and change admin password!

### Alternative: Deploy to Railway

Same steps as Render:
1. Sign up at [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Add environment variables
4. Auto-deploys on push

### Alternative: Deploy to VPS (Ubuntu)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2
sudo npm install -g pm2

# 3. Clone and setup
git clone <your-repo>
cd Mini-Project-III
npm install --production

# 4. Create .env file
nano .env  # Add your production variables

# 5. Start with PM2
pm2 start app.js --name resq
pm2 startup
pm2 save

# 6. Optional: Setup Nginx + SSL
sudo apt-get install -y nginx certbot python3-certbot-nginx
# Configure nginx reverse proxy
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 Security Checklist

Before deploying:

- [ ] `NODE_ENV=production` is set
- [ ] Strong `SESSION_SECRET` generated (min 32 characters)
- [ ] `.env` file is NOT committed to Git
- [ ] MongoDB connection string is correct
- [ ] All API keys are valid
- [ ] Default admin password will be changed after first login

---

## 📁 Project Structure

```
Mini-Project-III/
├── models/          # Mongoose schemas
├── routes/          # Express routes
├── views/           # EJS templates
├── public/          # Static assets (CSS, JS)
├── middleware/      # Custom middleware
├── utils/           # Utilities (error handling)
├── init/            # Database seeding
├── app.js           # Main application
└── package.json
```

---

## 🐛 Troubleshooting

### Database Connection Fails
- Verify MongoDB connection string format
- Check IP whitelist in MongoDB Atlas (add `0.0.0.0/0`)
- Ensure database user has read/write permissions

### Images Not Uploading
- Verify all three Cloudinary credentials are correct
- Check file size (max 5MB per image)

### Map Not Loading
- Verify `MAPBOX_TOKEN` is set correctly
- Check browser console for errors

### App Won't Start
- Check all required environment variables are set
- Review logs for specific error message

---

## 📊 Free Tier Limits

- **MongoDB Atlas:** 512 MB storage
- **Cloudinary:** 25 credits/month (~25K images)
- **Mapbox:** 50K map loads/month
- **Render:** 750 hours/month

---

## 🆘 Need Help?

- **MongoDB:** https://www.mongodb.com/docs/atlas/
- **Cloudinary:** https://cloudinary.com/documentation
- **Mapbox:** https://docs.mapbox.com/
- **Render:** https://render.com/docs

---

## 📝 License

ISC

## 👨‍💻 Author

Saurabh Hasabe - B.Tech Mini Project III
