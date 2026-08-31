# 🚨 ResQ — Disaster Response & Relief Coordination Platform

<div align="center">

**A full-stack disaster management platform that connects citizens, volunteers, and administrators during emergencies.**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![EJS](https://img.shields.io/badge/EJS-A91E50?style=for-the-badge&logo=ejs&logoColor=white)](https://ejs.co/)
[![Passport](https://img.shields.io/badge/Passport-34E27A?style=for-the-badge&logo=passport&logoColor=white)](https://www.passportjs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Data Models](#-data-models)
- [API / Routes Overview](#-api--routes-overview)
- [Roles & Permissions](#-roles--permissions)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)
- [Acknowledgements](#-acknowledgements)

---

## 🌍 About the Project

**ResQ** is a coordinated disaster-response platform built to streamline the reporting, verification, and relief-allocation process during emergencies such as **floods, fires, earthquakes, and building collapses**.

Citizens can report incidents, request help (rescue, medical, food, water, shelter), and locate the nearest open shelters. Volunteers can accept assignments, update statuses in the field, and add notes. Admins can verify incidents, compute priority scores, manage shelters, and assign volunteers to requests — all through a single, role-based dashboard.

The platform is built with a **security-first mindset** (Helmet, custom Mongo sanitization, `httpOnly` session cookies) and uses **GeoJSON 2dsphere indexes** on MongoDB for fast proximity-based queries of nearby incidents, requests, and shelters.

---

## ✨ Key Features

### 👤 Authentication & Roles
- Secure local authentication with **Passport.js + passport-local-mongoose**
- Three user roles: **Citizen**, **Volunteer**, **Admin**
- Flash messages, session-based auth, and CSRF-aware `SameSite=Lax` cookies

### 🆘 Incident Reporting
- Citizens can submit incidents with **title, description, category, address, geo-coordinates, and severity**
- Upload **multiple photos** (stored on Cloudinary)
- Self-reported severity is later verified by an admin (`verifiedSeverity`)
- Status workflow: `pending → verified / rejected / duplicate → resolved`

### 🏥 Shelter Management
- Register and manage relief shelters with **total capacity, current occupancy, and live status** (`open / full / closed`)
- Auto-incremented occupancy tracking

### 📣 Help Requests
- Citizens can raise typed help requests: `rescue, medical, food, water, shelter, other`
- Link requests to verified incidents for coordinated response
- Urgency levels: `low / medium / high`

### 🧑‍🚒 Volunteer Assignments
- Admins assign volunteers to incidents or requests
- Volunteers move status through the field: `assigned → en_route → in_progress → resolved`
- Field notes attached to each assignment for post-incident review

### 🛡️ Admin Dashboard
- Verify incoming incidents, mark duplicates, compute priority scores
- Manage shelters and oversee every open request
- Real-time aggregation of open vs. resolved cases

### 🗺️ Geospatial Queries
- All geo-data is stored as **GeoJSON Points** with a **2dsphere index**
- Future-ready for "find nearest shelter" proximity queries

### 🔒 Security
- **Helmet** for HTTP header hardening
- Custom sanitizer strips `$` and `.` keys from `req.body` and `req.params` to prevent **NoSQL injection** (Express 5 compatible)
- `httpOnly` and conditionally `secure` cookies

---

## 🛠️ Tech Stack

| Layer            | Technology                                          |
|------------------|-----------------------------------------------------|
| Runtime          | Node.js                                             |
| Framework        | Express 5                                           |
| Database         | MongoDB + Mongoose (with 2dsphere geospatial index) |
| View Engine      | EJS + ejs-mate (layouts)                            |
| Auth             | Passport.js, passport-local, passport-local-mongoose|
| File Uploads     | Multer + Multer-Storage-Cloudinary + Cloudinary     |
| Validation       | Joi                                                 |
| Security         | Helmet, custom NoSQL sanitizer, sanitize-html       |
| Sessions         | express-session + connect-flash                     |
| Dev Tools        | dotenv, method-override                             |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ResQ Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│   │ Citizen  │    │Volunteer │    │  Admin   │  ← Roles     │
│   └─────┬────┘    └─────┬────┘    └─────┬────┘              │
│         │               │               │                   │
│         ▼               ▼               ▼                   │
│   ┌─────────────────────────────────────────────┐           │
│   │        Express + EJS Server (app.js)         │          │
│   │  Sessions • Passport • Helmet • Sanitizer   │           │
│   └────────────────────┬────────────────────────┘           │
│                        │                                    │
│   ┌─────────┬──────────┼──────────┬─────────┐               │
│   ▼         ▼          ▼          ▼         ▼               │
│ Incidents  Shelters  Requests  Assignments Users            │
│   │         │          │          │         │               │
│   └─────────┴──────────┴──────────┴─────────┘               │
│                        │                                    │
│                        ▼                                    │
│            ┌───────────────────────┐                        │
│            │   MongoDB Atlas /     │                        │
│            │  Local Mongo (2dsphr) │                        │
│            └───────────────────────┘                        │
│                        │                                    │
│                        ▼                                    │
│            ┌───────────────────────┐                        │
│            │   Cloudinary (media)  │                        │
│            └───────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** ≥ 18.x
- **npm** (or yarn / pnpm)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` **or** a MongoDB Atlas connection string
- A **Cloudinary** account (free tier is fine) — for incident photo uploads

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/ResQ.git
   cd ResQ
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root (this file is **gitignored**):

   ```env
   DB_URL=mongodb://127.0.0.1:27017/resq
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_KEY=your_api_key
   CLOUDINARY_SECRET=your_api_secret
   SESSION_SECRET=a_strong_random_string
   NODE_ENV=development
   ```

   > ⚠️ **Never commit your `.env` file.** Real credentials for local development are stored locally; production credentials should be set in your hosting provider's environment settings.

4. **(Optional) Seed the database with sample data**

   ```bash
   node init/index.js
   ```

5. **Start the server**

   ```bash
   node app.js
   ```

6. **Open your browser**

   ```
   http://localhost:3000
   ```

   The app redirects `/` → `/incidents`.

---

## 🔐 Environment Variables

| Variable                 | Required | Description                                                   |
|--------------------------|:--------:|---------------------------------------------------------------|
| `DB_URL`                 |    ✅    | MongoDB connection string (local or Atlas)                     |
| `CLOUDINARY_CLOUD_NAME`  |    ✅    | Cloudinary cloud name for image uploads                       |
| `CLOUDINARY_KEY`         |    ✅    | Cloudinary API key                                            |
| `CLOUDINARY_SECRET`      |    ✅    | Cloudinary API secret                                         |
| `SESSION_SECRET`         |    ✅    | Random string used to sign session cookies                    |
| `NODE_ENV`               |    ❌    | Set to `production` in deployed environments to enable `secure` cookies |

---

## 📁 Project Structure

```
ResQ/
├── app.js                  # Main Express application
├── cloudConfig.js          # Cloudinary configuration
├── middleware.js           # Custom middleware (auth, validation)
├── package.json
├── .env                    # Local secrets (gitignored)
├── .gitignore
│
├── controllers/            # Route logic / business logic
│   ├── assignments.js
│   ├── incidents.js
│   ├── requests.js
│   ├── shelters.js
│   └── users.js
│
├── models/                 # Mongoose schemas
│   ├── assignment.js
│   ├── incident.js
│   ├── request.js
│   ├── shelter.js
│   └── user.js
│
├── routes/                 # Express route definitions
│   ├── admin.js
│   ├── assignments.js
│   ├── incidents.js
│   ├── requests.js
│   ├── shelters.js
│   └── users.js
│
├── views/                  # EJS templates
│   ├── layouts/boilerplate.ejs
│   ├── includes/
│   │   ├── navbar.ejs
│   │   ├── footer.ejs
│   │   └── flash.ejs
│   ├── incidents/
│   ├── shelters/
│   ├── requests/
│   ├── users/
│   ├── assignments/
│   ├── dashboard/
│   └── error.ejs
│
├── public/                 # Static assets (CSS, JS, images)
├── utils/                  # Helper modules
│   ├── ExpressError.js
│   ├── catchAsync.js
│   └── validateObjectId.js
│
└── init/                   # Database seed scripts
    ├── data.js
    └── index.js
```

---

## 🗃️ Data Models

### 👤 User
```js
{ email, phone, role: 'citizen' | 'volunteer' | 'admin', password (hashed by passport-local-mongoose) }
```

### 🆘 Incident
```js
{
  title, description,
  category: 'flood' | 'fire' | 'earthquake' | 'building collapse' | 'other',
  location: { type: 'Point', coordinates: [lng, lat] },
  address,
  selfReportedSeverity: 'low' | 'medium' | 'high',
  verifiedSeverity: 'low' | 'medium' | 'high' | null,
  priorityScore: Number,
  status: 'pending' | 'verified' | 'rejected' | 'duplicate' | 'resolved',
  photos: [{ url, filename }],
  reportedBy, verifiedBy, verifiedAt
}
```

### 🏥 Shelter
```js
{
  name, address,
  location: { type: 'Point', coordinates: [lng, lat] },
  totalCapacity, currentOccupancy,
  status: 'open' | 'full' | 'closed',
  managedBy
}
```

### 📣 Request
```js
{
  type: 'rescue' | 'medical' | 'food' | 'water' | 'shelter' | 'other',
  description, address,
  location: { type: 'Point', coordinates: [lng, lat] },
  urgency: 'low' | 'medium' | 'high',
  status: 'open' | 'assigned' | 'resolved',
  requestedBy, linkedIncident
}
```

### 🧑‍🚒 Assignment
```js
{
  volunteer,
  targetType: 'incident' | 'request',
  targetId,           // dynamic ref via refPath
  status: 'assigned' | 'en_route' | 'in_progress' | 'resolved',
  assignedBy,
  fieldNotes
}
```

---

## 🔀 API / Routes Overview

| Method     | Path                                | Description                                | Auth        |
|------------|-------------------------------------|--------------------------------------------|-------------|
| `GET`      | `/`                                 | Redirects to `/incidents`                  | Public      |
| `GET/POST` | `/register`                         | Register a new user                        | Public      |
| `GET/POST` | `/login`                            | Log in                                     | Public      |
| `POST`     | `/logout`                           | Log out                                    | Auth        |
| `GET`      | `/profile`                          | View / edit own profile                    | Auth        |
| `GET`      | `/incidents`                        | List all incidents                         | Public      |
| `POST`     | `/incidents`                        | Create a new incident                      | Auth        |
| `GET`      | `/incidents/new`                    | New incident form                          | Auth        |
| `GET`      | `/incidents/:id`                    | View incident details                      | Public      |
| `GET/POST` | `/incidents/:id/edit`               | Edit incident                              | Auth/Owner  |
| `DELETE`   | `/incidents/:id`                    | Delete incident                            | Auth/Owner  |
| `GET`      | `/shelters`                         | List all shelters                          | Public      |
| `POST`     | `/shelters`                         | Create shelter                             | Admin       |
| `GET`      | `/shelters/new`                     | New shelter form                           | Admin       |
| `GET`      | `/shelters/:id`                     | View shelter                               | Public      |
| `GET/POST` | `/shelters/:id/edit`                | Edit shelter                               | Admin       |
| `GET`      | `/requests`                         | List all help requests                     | Public      |
| `POST`     | `/requests`                         | Create help request                        | Auth        |
| `GET`      | `/requests/new`                     | New request form                           | Auth        |
| `GET`      | `/requests/:id`                     | View request                               | Public      |
| `GET`      | `/assignments`                      | List assignments (volunteer)               | Volunteer   |
| `POST`     | `/assignments`                      | Create assignment                          | Admin       |
| `PATCH`    | `/assignments/:id`                  | Update assignment status / field notes     | Volunteer   |
| `GET`      | `/admin`                            | Admin dashboard                            | Admin       |

---

## 👥 Roles & Permissions

| Action                                | Citizen | Volunteer | Admin |
|---------------------------------------|:-------:|:---------:|:-----:|
| Register / log in                     |   ✅    |    ✅     |  ✅   |
| Report incident                       |   ✅    |    ✅     |  ✅   |
| Raise help request                    |   ✅    |    ✅     |  ✅   |
| Create shelter                        |   ❌    |    ❌     |  ✅   |
| Verify / reject / prioritize incident |   ❌    |    ❌     |  ✅   |
| Assign volunteers                     |   ❌    |    ❌     |  ✅   |
| Update assignment status              |   ❌    |    ✅     |  ✅   |
| Add field notes                       |   ❌    |    ✅     |  ✅   |
| Access admin dashboard                |   ❌    |    ❌     |  ✅   |

---

## 🗺️ Roadmap

- [ ] Real-time notifications (WebSockets / Socket.io)
- [ ] Map view with Leaflet / Mapbox for incident clustering
- [ ] SMS / Twilio alerts for high-urgency requests
- [ ] Multilingual UI (English / हिन्दी)
- [ ] Mobile-first PWA with offline incident reporting
- [ ] Analytics dashboard for response-time KPIs
- [ ] Docker + Docker Compose deployment
- [ ] Unit & integration tests (Jest + Supertest)

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure your code follows the existing style, includes comments where necessary, and doesn't break any existing routes.

---

## 📄 License

Distributed under the **ISC License**. See `LICENSE` for more information.

---

## 👤 Author

**Saurabh Hasabe** 

- GitHub: [@SaurabhHasabe](https://github.com/SaurabhHasabe)
- Project Link: [https://github.com/SaurabhHasabe/ResQ](https://github.com/SaurabhHasabe/ResQ)

---

## 🙏 Acknowledgements

- [Express.js](https://expressjs.com/) — Fast, unopinionated web framework
- [Mongoose](https://mongoosejs.com/) — Elegant MongoDB ODM
- [Passport.js](http://www.passportjs.org/) — Simple, unobtrusive authentication
- [Cloudinary](https://cloudinary.com/) — Media management in the cloud
- [EJS](https://ejs.co/) — Embedded JavaScript templating
- [Helmet](https://helmetjs.github.io/) — Secure Express apps by default

---

<div align="center">

**Built with ❤️ for safer communities.**

If this project helped you, please ⭐ the repo!

</div>
