# ResQ

Disaster operations platform for reporting incidents, managing shelters, and coordinating aid. Citizens start here; volunteers take nearby tasks after an admin approves them.

**Live:** [https://resq-bbx4.onrender.com](https://resq-bbx4.onrender.com)

## Features

- Incident reports with photos and Mapbox location
- Nearest volunteers (within 50 km) can accept or reject reports and claim aid
- Shelter listing and occupancy; community shelters wait for admin approval
- Public operations board at `/`, JSON feed at `/api/ops`, health check at `GET /health`
- In-app alerts (no email/SMTP)
- Password recovery with username + registered Indian mobile, or an admin-issued password
- Sudo admins: allowlisted emails become admin on register or login

## Local setup

**Need:** Node.js 18+, MongoDB, Cloudinary, Mapbox.

```bash
git clone "https://github.com/SaurabhHasabe/ResQ.git"
cd ResQ
npm install
```

Copy `.env.example` to `.env` and fill in `DB_URL`, `SESSION_SECRET`, Cloudinary, and `MAPBOX_TOKEN`. Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```bash
npm run seed
npm run dev
```

Open `http://localhost:3000`. Production deploy steps are in [DEPLOYMENT.md](DEPLOYMENT.md).

### Seed accounts

Admin is not seeded. Register with one of these emails (your own password):

- `utkarshkumar.cs18@gmail.com`
- `saurya1729@gmail.com`

Demo (not admin): volunteer `ravi_v` / `Ravi@5678` · citizen `suresh_c` / `Suresh@1234`

## Layout

```
app.js            # Express entry
models/           # Mongoose schemas
routes/           # HTTP routes
controllers/      # Route handlers
views/            # EJS templates
public/           # CSS, JS, PWA assets
utils/            # Geo, notify, audit, validation helpers
middleware.js     # Auth, CSRF-related validation
schema.js         # Joi schemas
init/             # Seed data (`npm run seed` is blocked in production)
test/             # `npm test`
```

## Troubleshooting

- **MongoDB:** Check `DB_URL` and Atlas IP allowlist (`0.0.0.0/0` for Render).
- **Uploads:** All three Cloudinary values must be set; images max 5 MB.
- **Maps:** Confirm `MAPBOX_TOKEN` and the browser console.

ISC · Saurabh Hasabe
