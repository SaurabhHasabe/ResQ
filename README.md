# ResQ

ResQ is a public disaster-operations app for India: report incidents, find shelters, request aid, and dispatch nearby volunteers. It runs as a single Express site with a live map, in-app alerts, and three roles.

 [**Live:**](https://resq-s0af.onrender.com/)

Production deploy steps live in [DEPLOYMENT.md](DEPLOYMENT.md).

## Who uses it

| Role | How you get it | What you can do |
|------|----------------|-----------------|
| **Citizen** | Register with username, email, and Indian mobile | Report incidents, request aid, list a community shelter |
| **Volunteer** | Apply in-app; an admin approves you | See nearby tasks (within 50 km), accept or reject, update assignment status |
| **Admin** | Register or log in with a sudo-allowlisted email | Verify incidents, approve volunteers and shelters, assign work, issue a recovery password |

Resolved assignments cannot be updated again. Community shelters stay pending until an admin approves them.

## What it does

- Live operations homepage with stats and a colour Mapbox map (pins for incidents and shelters)
- Incident reports with photos, GPS / map drop, category, and self-reported severity
- Nearest-three volunteers within 50 km get the report; they accept or reject from Assignments
- Aid requests that volunteers can claim
- Shelter directory with occupancy; logged-in users can submit a listing
- In-app Alerts (no email or SMTP — this is meant for free hosts such as Render)
- Username + registered Indian mobile to set a new password, or an admin-issued one-time password
- Public JSON board at `/api/ops` and a health probe at `GET /health`
- PWA install, service worker, and a layout that scrolls on phones (one-finger page scroll; two fingers pan the map)

Seed incidents and shelters are documented Indian events (not fictional towns). The seed script **wipes the database** and is blocked when `NODE_ENV=production` unless you set `ALLOW_SEED=1`.

## Local setup

You need **Node.js 18+**, **MongoDB**, a **Cloudinary** account, and a **Mapbox** public token.

```bash
git clone https://github.com/SaurabhHasabe/ResQ.git
cd ResQ
npm install
cp .env.example .env
```

Fill in at least:

```
DB_URL=YOUR_MONGO_URL
SESSION_SECRET=YOUR_SESSION_SECRET
CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
CLOUDINARY_KEY=YOUR_CLOUDINARY_KEY
CLOUDINARY_SECRET=YOUR_CLOUDINARY_SECRET
MAPBOX_TOKEN=YOUR_MAPBOX_TOKEN
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Optional: `SUDO_ADMIN_EMAILS` (comma-separated) adds admins on top of the built-in list.

```bash
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it runs |
|--------|----------------|
| `npm run dev` | `node --watch app.js` |
| `npm start` | `node app.js` |
| `npm run seed` | `node init/index.js` (refuses in production) |
| `npm test` | `node --test test/*.test.js` |

## Demo logins (after seed)

Admin is **not** seeded. Register (any password you choose) with one of:

- `utkarshkumar.cs18@gmail.com`
- `saurya1729@gmail.com`

Those emails become admin on register or login. Extra addresses go in `SUDO_ADMIN_EMAILS`.

| Role | Username | Password |
|------|----------|----------|
| Volunteer | `ravi_v` | `Ravi@5678` |
| Citizen | `suresh_c` | `Suresh@1234` |

Change these before anything public. Seed passwords are only for local / Atlas sandbox data.

## Useful URLs

| Path | Purpose |
|------|---------|
| `/` | Public operations board |
| `/api/ops` | JSON snapshot of live ops |
| `/health` | `{ ok, service, db, uptime, timestamp }` — `200` if Mongo pings, `503` if not |
| `/notifications` | In-app alerts |
| `/admin/dashboard` | Verification queues (admin) |
| `/assignments` | Volunteer tasks |

## Layout

```
app.js              Express entry (Helmet, session, CSRF, rate limit)
models/             User, incident, shelter, request, assignment, notification, audit
routes/             HTTP routes (health is mounted before session)
controllers/        Handlers
views/              EJS pages (light theme)
public/             CSS, JS, Mapbox helpers, service worker
utils/              Geo ($near), in-app notify, audit, sudo admins, ops board
init/               Seed data — keep this folder; seed is blocked in production
test/               Node test runner
middleware.js       Auth, role checks, Joi validation
schema.js           Joi schemas
```

ISC · Saurabh Hasabe
