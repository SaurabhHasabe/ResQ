# Deployment

## Credentials

| Service | Sign up | What you need |
|---------|---------|----------------|
| MongoDB Atlas | [cloud.mongodb.com](https://cloud.mongodb.com) | Connection string |
| Cloudinary | [cloudinary.com](https://cloudinary.com) | Cloud name, API key, secret |
| Mapbox | [mapbox.com](https://mapbox.com) | Public access token |

Do not set SMTP. Alerts are in-app only.

## Render (free)

1. Push the repo to GitHub.
2. [render.com](https://render.com) → New → Web Service → that repo.
3. **Build:** `npm install` · **Start:** `npm start` · **Environment:** Node. Health check path: `/health` (JSON; `200` if Mongo is up, `503` if not).
4. Environment variables:

```
NODE_ENV=production
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/resq
SESSION_SECRET=<openssl or node crypto random, 32+ characters>
CLOUDINARY_CLOUD_NAME=<value>
CLOUDINARY_KEY=<value>
CLOUDINARY_SECRET=<value>
MAPBOX_TOKEN=<value>
SUDO_ADMIN_EMAILS=utkarshkumar.cs18@gmail.com,saurya1729@gmail.com
```

5. After the first deploy, register with a sudo admin email. Seed only from a local machine (`NODE_ENV` not `production`) with `DB_URL` pointed at Atlas — the seed script will refuse to run in production.

## Railway

New project from GitHub, same environment variables, start command `npm start`.

## VPS (Ubuntu)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
git clone <your-repo>
cd ResQ
npm install --omit=dev
# create .env with the production values above
pm2 start app.js --name resq
pm2 startup && pm2 save
```

Optional: Nginx reverse proxy and `certbot --nginx`.

## Before you go live

- [ ] `NODE_ENV=production`
- [ ] Strong `SESSION_SECRET` (not committed)
- [ ] `.env` is gitignored
- [ ] Atlas user can read/write; IP allowlist includes the host
- [ ] Cloudinary and Mapbox keys work
- [ ] Admin only via sudo emails / `SUDO_ADMIN_EMAILS`

## Free-tier notes

MongoDB Atlas 512 MB · Cloudinary ~25K images/month · Mapbox 50K loads/month · Render 750 hours/month (sleeps on the free web service).
