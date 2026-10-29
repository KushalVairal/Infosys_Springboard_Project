# CarbonTrack — Docker Setup Guid e

This guide explains how teammates can configure and run CarbonTrack locally with Docker Compose.

## 1. Services and ports

| Service | Purpose | Host address / port |
|---|---|---|
| `frontend` | React/Vite interface | http://localhost:5173 |
| `carbontrack-backend` | Spring Boot REST API | http://localhost:8080 |
| `mysql` | MySQL database | `127.0.0.1:3307` (container port `3306`) |
| `redis` | Redis service | `127.0.0.1:6379` |

Inside Docker Compose, the backend should connect to MySQL at `mysql:3306` and Redis at `redis:6379`. From Windows, MySQL is exposed at port `3307`.

## 2. Prerequisites

Install and start Docker Desktop. In PowerShell, check:

```powershell
docker --version
docker compose version
docker info
```

Git is needed if you are cloning the repository.

## 3. Get the project

Clone using your team's real repository URL:

```powershell
cd "$HOME\Desktop"
git clone <YOUR_TEAM_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
```

If already cloned, navigate to the project root and pull updates:

```powershell
git pull
```

Replace placeholders with the actual repository URL, folder, and branch names.

## 4. Configure `.env`

The `compose.yaml` expects a local `.env` file in the project root. If the repository includes a safe `.env.example`, copy it:

```powershell
Copy-Item .env.example .env
notepad .env
```

If no example exists, create `.env` with the variable names required by `compose.yaml` and the backend. Typical variables for this project include:

```dotenv
MYSQL_DATABASE=carbontrack
MYSQL_USER=carbontrack_app
MYSQL_PASSWORD=REPLACE_WITH_STRONG_DATABASE_PASSWORD
MYSQL_ROOT_PASSWORD=REPLACE_WITH_STRONG_ROOT_PASSWORD

JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

MAIL_USERNAME=YOUR_EMAIL_ADDRESS
MAIL_PASSWORD=YOUR_EMAIL_APP_PASSWORD
```

Only configure optional services when needed. Do not put real secrets in this README or commit them to Git. Make sure `.env` is in `.gitignore`. Rotate credentials if they have been exposed.

## 5. Validate Compose configuration

Run from the folder containing `compose.yaml`:

```powershell
docker compose -f compose.yaml config --services
```

Expected service names:

```text
mysql
redis
carbontrack-backend
frontend
```

Do not share the full output of `docker compose config`, because resolved environment values may contain secrets.

## 6. Start all services

Build images and start the full stack:

```powershell
docker compose -f compose.yaml up --build -d
```

Check status:

```powershell
docker compose -f compose.yaml ps -a
```

View logs:

```powershell
docker compose -f compose.yaml logs --tail=100
```

Follow backend logs:

```powershell
docker compose -f compose.yaml logs -f carbontrack-backend
```

Press `Ctrl+C` to stop following logs; this normally does not stop the container.

## 7. Open and test the application

- Frontend: http://localhost:5173
- Backend base address: http://localhost:8080

The backend root URL may not show a page if no root endpoint exists. In Postman, use an actual route defined by your controllers. For example, `/api/activities` is valid only if that route exists; use the correct HTTP method, request body, and authentication.

Test Redis:

```powershell
docker compose -f compose.yaml exec redis redis-cli ping
```

Expected output:

```text
PONG
```

Review backend startup and database migration logs:

```powershell
docker compose -f compose.yaml logs --tail=100 carbontrack-backend
```

Look for successful Spring Boot startup, a MySQL connection, and Flyway migration validation.

## 8. Run only the backend with MySQL and Redis

```powershell
docker compose -f compose.yaml up -d mysql redis
docker compose -f compose.yaml up --build -d carbontrack-backend
docker compose -f compose.yaml ps
```

This starts the backend and its supporting services without intentionally starting the frontend.

View backend logs:

```powershell
docker compose -f compose.yaml logs -f carbontrack-backend
```

## 9. Run backend directly on Windows (without a backend container)

Start MySQL and Redis from the project root:

```powershell
docker compose -f compose.yaml up -d mysql redis
```

Then run Spring Boot from the backend directory:

```powershell
cd .\carbontrack-backend
.\mvnw.cmd spring-boot:run
```

For this mode, check `application.properties` and environment variables. MySQL published on host port `3307` is usually accessed as `localhost:3307` by a backend running on Windows. A backend running inside Compose should use `mysql:3306`.

## 10. Stop safely

```powershell
docker compose -f compose.yaml down
```

This stops and removes Compose containers and the default network. Named volumes are normally retained.

**Do not use `docker compose down -v` unless you intentionally want to remove Compose volumes and understand that persisted database data may be deleted.**

## 11. Troubleshooting

### Port 8080 is busy

Check containers:

```powershell
docker ps
```

Check the Windows process listening on port 8080:

```powershell
netstat -ano | findstr :8080
```

Identify the process before stopping it. Do not terminate an unfamiliar process.

### A service failed

```powershell
docker compose -f compose.yaml ps -a
docker compose -f compose.yaml logs --tail=100 <SERVICE_NAME>
```

Replace `<SERVICE_NAME>` with `frontend`, `carbontrack-backend`, `mysql`, or `redis`.

### Database connection failed

- Confirm MySQL is healthy.
- Check that `.env` variable names and values match the Compose configuration.
- Backend inside Compose should use `mysql:3306`, not `localhost:3307`.
- Backend running directly on Windows should usually use `localhost:3307`.
- Do not share passwords when asking for help.

### Frontend opens but API calls fail

Check browser developer tools and the frontend API base URL. For local use, the browser normally reaches the backend at `http://localhost:8080`. Confirm the backend is running, the endpoint exists, authentication is correct, and CORS permits the request.

## 12. Security and data notes

- `.env` contains secrets and must not be committed.
- Never put passwords, OAuth secrets, mail app passwords, or JWT secrets in this README, screenshots, or public issues.
- Use strong, unique credentials and rotate any that were exposed.
- `docker compose down` normally preserves named volumes. Removing volumes can delete database data.
- Container startup alone does not prove every API feature works; test endpoints separately.

## 13. Quick command reference

```powershell
# Start all services
docker compose -f compose.yaml up -d

# Rebuild and start all services
docker compose -f compose.yaml up --build -d

# Check status
docker compose -f compose.yaml ps -a

# View logs
docker compose -f compose.yaml logs --tail=100

# Test Redis
docker compose -f compose.yaml exec redis redis-cli ping

# Start only MySQL and Redis
docker compose -f compose.yaml up -d mysql redis

# Start backend and its dependencies
docker compose -f compose.yaml up --build -d carbontrack-backend

# Stop containers but preserve named volumes
docker compose -f compose.yaml down
```

---
**Note:** This guide reflects the development Compose setup and ports discussed for CarbonTrack. Confirm the actual repository branch, `.env` variables, and API routes before running on another computer.
