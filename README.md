# CarbonTrack

CarbonTrack records everyday activities and estimates their carbon footprint.

| Part | Folder | Stack |
|---|---|---|
| Backend API | `carbontrack-backend/` | Java 17, Spring Boot, Spring Security + JWT, JPA/Hibernate, MySQL, Flyway |
| Frontend | `carbontrack-frontend/` | React 18, Vite, React Router 6, Axios, Recharts, plain CSS |
| Root tooling | `package.json`, `scripts/` | One set of commands to run everything, GitHub Pages deploy |

```text
Infosys_Springboard_Project/
├── .project                  (Eclipse project file)
├── package.json              (root scripts: setup, dev, dev:full, backend, deploy ...)
├── backend.env.example       (root-level env template)
├── scripts/run-backend.js
├── carbontrack-backend/      (Spring Boot - pom.xml, mvnw, src/)
│   ├── .env.example          (copy to .env - git-ignored)
│   └── src/
└── carbontrack-frontend/     (React app)
    ├── .env.example          (copy to .env)
    └── src/
```

## Prerequisites
- Node.js 18+ (frontend and root scripts)
- JDK 17, MySQL Server (backend only)
- Git (optional)

## Quick start - frontend only (no backend, no database)

```bash
npm install          # root tools (concurrently, gh-pages)
npm run setup        # frontend dependencies
npm run dev          # http://localhost:5173
```

The frontend starts in **demo mode**: a fake backend runs inside the browser (data kept in
localStorage). Register an account, log activities, view charts. In demo mode the
forgot-password OTP is always `123456`.

## Full stack - frontend + backend together

1. Create the database (MySQL Workbench or CLI):
   ```sql
   CREATE DATABASE carbontrack;
   ```
   Flyway creates all tables automatically on first start. Do not create them by hand.
2. Make sure `carbontrack-backend/` contains your Spring Boot project (`pom.xml`, `mvnw`, `src/`).
3. Configure backend secrets:
   Copy `.env.example` to `.env` inside `carbontrack-backend/` (or copy `backend.env.example` to `backend.env` in root):
   ```powershell
   copy carbontrack-backend\.env.example carbontrack-backend\.env
   ```
   Edit `.env` and fill in your local credentials:
   - `DB_PASSWORD`: Your local MySQL root password.
   - `JWT_SECRET`: A long random secret key (minimum 32 characters / 256 bits).
   - `MAIL_USERNAME` & `MAIL_PASSWORD`: Your Gmail address and 16-character [Google App Password](https://myaccount.google.com/apppasswords) for password reset OTP emails.
   *(Note: `.env` is git-ignored and will never be committed to source control).*
4. Run both with one command from the project root:
   ```bash
   npm run dev:full
   ```
   Backend: http://localhost:8080 — Frontend: http://localhost:5173 (talks to the real API).

Or run them in separate terminals:
- **Backend:** `cd carbontrack-backend` and run `.\mvnw.cmd spring-boot:run` (Spring Boot automatically loads `carbontrack-backend/.env` via the built-in `DotenvLoader` on startup).
- **Frontend:** `cd carbontrack-frontend` and run `npm run dev` (or `npm run frontend:full` from root).
- **Backend tests:** `npm run test:backend` (or `.\mvnw.cmd clean test` in `carbontrack-backend/`).

## Root commands

| Command | What it does |
|---|---|
| `npm run setup` | Install frontend dependencies |
| `npm run dev` | Frontend in demo mode (no backend) |
| `npm run dev:full` | Backend + frontend against the real API |
| `npm run backend` | Spring Boot only |
| `npm run frontend:full` | Frontend only, pointing at the real API |
| `npm run test:backend` | `mvnw clean test` |
| `npm run build` | Production build of the frontend (`carbontrack-frontend/dist`) |
| `npm run deploy` | Build in demo mode and publish to the `gh-pages` branch |

## API endpoints (backend)

Base URL `http://localhost:8080`. Protected endpoints need `Authorization: Bearer <JWT>`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Log in, returns JWT |
| POST | `/api/auth/forgot-password` | Start password reset (email OTP) |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/reset-password` | Set a new password |
| GET / PUT | `/api/users/me` | Read / update profile |
| POST | `/api/activities` | Create activity log |
| GET | `/api/activities/me` | List the user's activity logs |
| GET | `/api/test/protected` | Auth check |

The frontend first calls `GET /api/activities` (with filters/paging) and automatically falls back
to `GET /api/activities/me` if the backend answers 404/405. It also accepts either `token` or
`accessToken` in the login response. If your DTO field names differ, adjust the mapping in
`carbontrack-frontend/src/api/activities.js` (response fields) and `src/pages/LogActivity.jsx`
(request fields, see `ActivityLogRequestDTO.java`).

## Database migrations (Flyway)

Files `V1` ... `V11` live in `carbontrack-backend/src/main/resources/db/migration/`
(organisations, users, emission factors, activity logs, goals, badges, user badges, email OTP,
password-reset token, test emission factors, user profile details).

Once a migration has been applied to a shared database, add a new version instead of editing it.

**Known V10 checksum mismatch:** one developer's local database had V10 applied from an older
version of the file. On a **fresh** database all migrations run from the start without problems.
If an existing database reports a checksum mismatch, check the schema and agree with the team
before running `flyway repair` or editing Flyway history.

## Deploying the frontend to GitHub Pages

```bash
npm run deploy
```

This builds with a relative base path, uses hash-based routing (`/#/login`) so refreshes work on
Pages, and publishes `carbontrack-frontend/dist` to the `gh-pages` branch. A Pages site has no
backend, so the deployed build runs in demo mode.

## Troubleshooting

| Problem | Fix |
|---|---|
| `carbontrack-backend/pom.xml not found` | Copy the Spring Boot project into `carbontrack-backend/` |
| `Access denied for user 'root'@'localhost' (using password: NO)` | Create `.env` in `carbontrack-backend/` (copied from `.env.example`) and set `DB_PASSWORD` |
| Cannot connect to MySQL | Start MySQL server, create the `carbontrack` database, check `DB_*` in `.env` |
| Missing JWT secret | Set `JWT_SECRET` in `carbontrack-backend/.env` (minimum 32 characters) |
| Email OTP fails | Check `MAIL_USERNAME`/`MAIL_PASSWORD`; Gmail accounts require a 16-character App Password |
| Flyway checksum error | See the V10 note above |
| CORS error in browser | Add `CorsConfig.java` and `.cors(Customizer.withDefaults())` in backend `SecurityConfig` |
| `Port 8080 was already in use` | Find and stop the process: `netstat -ano \| findstr :8080` then `Stop-Process -Id <PID> -Force` |
| Port 5173 busy | Stop other Vite processes; frontend uses fixed port 5173 for CORS compatibility |
| 401 after login | Check the token field name returned by `/api/auth/login` |
| Changed `.env` files but nothing changed | Restart the Spring Boot backend or Vite dev server |

## Security notes

- Never commit `.env` or `backend.env` files, passwords, JWT secrets, or mail credentials.
- Use HTTPS and managed secrets in production; review OTP rate limits and error responses.
- Emission results are estimates based on the configured factors, not an environmental audit.

## License

No license specified yet. Add a `LICENSE` file if you want to publish with explicit reuse terms.
