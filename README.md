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
├── backend.env.example       (copy to backend.env - git-ignored)
├── scripts/run-backend.js
├── carbontrack-backend/      (Spring Boot - pom.xml, mvnw, src/)
└── carbontrack-frontend/     (React app)
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
3. Copy `carbontrack-frontend/backend-extras/CorsConfig.java` into
   `carbontrack-backend/src/main/java/com/carbontrack/carbontrackbackend/config/` and make sure
   `SecurityConfig` has `.cors(Customizer.withDefaults())`.
4. Create your secrets file (never commit it):
   ```bash
   cp backend.env.example backend.env      # Windows: copy backend.env.example backend.env
   ```
   Edit `backend.env` and set `DB_PASSWORD`, `JWT_SECRET`, and (for email OTP) `MAIL_USERNAME` / `MAIL_PASSWORD`.
   `DB_URL` defaults to `jdbc:mysql://localhost:3306/carbontrack`, `DB_USERNAME` to `root`.
5. Run both with one command:
   ```bash
   npm run dev:full
   ```
   Backend: http://localhost:8080 - Frontend: http://localhost:5173 (talks to the real API).

Run them separately if you prefer: `npm run backend` and, in another terminal,
`npm run frontend:full`. Run backend tests with `npm run test:backend`.

You can still start the backend the classic way (`.\mvnw.cmd spring-boot:run` in PowerShell
after setting `$env:DB_PASSWORD` etc.). The root script simply loads `backend.env` for you.

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
| Cannot connect to MySQL | Start MySQL, create the `carbontrack` database, check `DB_*` in `backend.env` |
| Missing JWT secret | Set `JWT_SECRET` in `backend.env` |
| Email OTP fails | Check `MAIL_USERNAME`/`MAIL_PASSWORD`; Gmail needs an app password |
| Flyway checksum error | See the V10 note above |
| CORS error in browser | Add `CorsConfig.java` and `.cors(Customizer.withDefaults())` |
| Port 8080 or 5173 busy | Stop the other process (the frontend uses a fixed port 5173 because CORS allows only that origin) |
| 401 after login | Check the token field name returned by `/api/auth/login` |
| Changed `.env` files but nothing changed | Restart the dev server |

## Security notes

- Never commit `backend.env`, passwords, JWT secrets or mail credentials.
- Use HTTPS and managed secrets in production; review OTP rate limits and error responses.
- Emission results are estimates based on the configured factors, not an environmental audit.

## License

No license specified yet. Add a `LICENSE` file if you want to publish with explicit reuse terms.
