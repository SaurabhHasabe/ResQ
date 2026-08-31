# ResQ — Disaster Response & Relief Coordination

A full-stack platform that connects **citizens**, **volunteers**, and **admins** during emergencies (floods, fires, earthquakes, building collapses).

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![EJS](https://img.shields.io/badge/EJS-A91E50?style=for-the-badge&logo=ejs&logoColor=white)](https://ejs.co/)
[![Passport](https://img.shields.io/badge/Passport-34E27A?style=for-the-badge&logo=passport&logoColor=white)](https://www.passportjs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)

---

## What it does

- **Citizens** report incidents (with map pin + photos), raise aid requests, and browse shelters.
- **Admins** verify incidents, score priority, manage shelters, and assign volunteers.
- **Volunteers** update assignment status in the field (`assigned → en_route → in_progress → resolved`).

## Features

- Role-based auth (Passport + sessions stored in MongoDB)
- Incident verification workflow and rule-based priority scores
- GeoJSON locations (2dsphere indexes) and Leaflet maps
- Joi + HTML validation (phone, capacity, coordinates, lengths)
- CSRF protection, Helmet, rate limits, NoSQL sanitization
- Photo uploads via Cloudinary, or local `/uploads` in development

---

## Getting started

**Prerequisites:** Node.js 18+, MongoDB (local or Atlas). Cloudinary is optional in development.

```bash
git clone https://github.com/SaurabhHasabe/ResQ.git
cd ResQ
npm install
cp .env.example .env   # then fill in values
npm run seed            # optional sample data
npm start               # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (`/` redirects to `/incidents`).

### Seed accounts

| Username     | Password | Role      |
|--------------|----------|-----------|
| `admin`      | password | Admin     |
| `volunteer1`| password | Volunteer |
| `citizen1`   | password | Citizen   |

---

## Environment variables

Copy `.env.example`. Never commit `.env`.

| Variable | Required | Notes |
|----------|:--------:|-------|
| `DB_URL` | Production | MongoDB URI. Defaults to `mongodb://127.0.0.1:27017/resq` in development |
| `SESSION_SECRET` | Production | Must be a strong random string in production |
| `NODE_ENV` | No | `production` enables secure cookies and hides stack traces |
| `PORT` | No | Defaults to `3000` |
| `CLOUDINARY_CLOUD_NAME` | No* | Image hosting |
| `CLOUDINARY_KEY` | No* | |
| `CLOUDINARY_SECRET` | No* | |

\*If Cloudinary is unset, incident photos are stored under `uploads/` locally.

`GET /health` returns `{ "ok": true }` when Mongo is connected.

---

## Project structure

```
ResQ/
├── app.js                 # Server bootstrap (middleware, listen)
├── schema.js              # Joi validation
├── middleware.js
├── cloudConfig.js
├── routes/                # All HTTP routes (mounted from routes/index.js)
├── controllers/
├── models/
├── views/
├── public/
├── utils/
├── init/                  # Seed scripts (npm run seed)
│   ├── data.js
│   └── index.js
└── .env.example
```

---

## Routes

| Method | Path | Who |
|--------|------|-----|
| `GET` | `/` | Public → `/incidents` |
| `GET` | `/health` | Public |
| `GET/POST` | `/register`, `/login` | Public |
| `POST` | `/logout` | Auth |
| `GET` | `/profile` | Auth |
| `GET/POST` | `/incidents`, `/incidents/new` | List public; create auth |
| `GET/PUT/DELETE` | `/incidents/:id` | View public; edit/delete owner or admin |
| `GET` | `/shelters` | Public |
| `POST` | `/shelters` | Admin |
| `GET/PUT/DELETE` | `/shelters/:id` | View public; mutate admin |
| `GET/POST` | `/requests` | List public; create auth |
| `GET` | `/assignments` | Volunteer / admin |
| `PUT` | `/assignments/:id` | Volunteer / admin |
| `GET` | `/admin/dashboard` | Admin |
| `POST` | `/admin/incidents/:id/verify` | Admin |
| `POST` | `/admin/assign` | Admin |

---

## Roles

| Action | Citizen | Volunteer | Admin |
|--------|:-------:|:---------:|:-----:|
| Report incident / request aid | ✅ | ✅ | ✅ |
| Manage shelters | ❌ | ❌ | ✅ |
| Verify incidents | ❌ | ❌ | ✅ |
| Assign volunteers | ❌ | ❌ | ✅ |
| Update assignment status | ❌ | ✅ | ✅ |

---

## License

ISC. See [LICENSE](LICENSE).
