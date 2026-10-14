<<<<<<< HEAD
# CarbonTrack — Backend API

CarbonTrack is a backend application for recording everyday activities and estimating their carbon footprint. It provides authentication, protected activity logging, user profile management, emission-factor-based calculations, and password-reset workflows.

> **Current implementation:** This repository contains the Spring Boot backend. The database is MySQL, managed with Flyway migrations. The frontend and Docker setup can be added as later project milestones.

## Features

- User registration and login with JWT-based authentication
- Protected API endpoints
- Activity logging and carbon-emission calculation
- User profile retrieval and updates
- Forgot-password workflow using email OTP verification
- MySQL persistence through Spring Data JPA / Hibernate
- Versioned database schema migrations using Flyway
- Request validation and centralized exception handling
- Health-check endpoint

## Technology Stack

- **Java:** 17
- **Spring Boot:** 4.1.1 (as configured in `pom.xml`)
- **Spring Web MVC**
- **Spring Security**
- **Spring Data JPA / Hibernate**
- **MySQL**
- **Flyway**
- **JWT:** JJWT 0.12.6
- **Maven Wrapper**
- **Spring Boot Test / JUnit ecosystem**

## Prerequisites

Install the following before running the application:

1. JDK 17
2. MySQL Server and MySQL Workbench (Workbench is optional but useful)
3. Git (optional, for cloning)
4. An email account/app password if you want to test email OTP features

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/challavenkateswarlu78/CarbonTrack.git
cd CarbonTrack/carbontrack-backend
```

If you downloaded only the backend ZIP, extract it and open the `carbontrack-backend` folder in your IDE or terminal.

### 2. Create the MySQL database

Open MySQL Workbench and run:

```sql
CREATE DATABASE carbontrack;
```

The application uses Flyway to create and update the tables from migration scripts in:

```text
src/main/resources/db/migration/
```

Do not manually create tables already managed by Flyway.

### 3. Configure environment variables

The application reads database, JWT, and mail credentials from environment variables. **Do not commit real passwords, mail credentials, or JWT secrets to Git.**

For Windows PowerShell, set the values in the terminal you will use to run the application:

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/carbontrack"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your_mysql_password"
$env:JWT_SECRET = "replace_with_a_long_random_secret_value"
$env:MAIL_USERNAME = "your_email@gmail.com"
$env:MAIL_PASSWORD = "your_email_app_password"
```

Use a strong, randomly generated JWT secret appropriate for your environment. For Gmail SMTP, use an app password when required by your account settings. Keep these values private.

`DB_URL` defaults to `jdbc:mysql://localhost:3306/carbontrack` and `DB_USERNAME` defaults to `root`; set `DB_PASSWORD` and `JWT_SECRET` before starting the app. Mail variables are needed for email-based OTP flows.

### 4. Run the tests

From the `carbontrack-backend` directory:

```powershell
.\mvnw.cmd clean test
```

On macOS/Linux:

```bash
./mvnw clean test
```

### 5. Start the backend

Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

macOS/Linux:

```bash
./mvnw spring-boot:run
```

The API runs on:

```text
http://localhost:8080
```

Flyway migrations run automatically when the application starts, provided the database connection and credentials are valid.

## API Endpoints

Base URL: `http://localhost:8080`

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Log in and obtain an authentication response/token |
| `POST` | `/api/auth/forgot-password` | Start the password-reset flow |
| `POST` | `/api/auth/verify-otp` | Verify the email OTP |
| `POST` | `/api/auth/reset-password` | Reset the password after verification |
| `GET` | `/api/users/me` | Get the authenticated user's profile |
| `PUT` | `/api/users/me` | Update the authenticated user's profile |
| `POST` | `/api/activities` | Create an activity log |
| `GET` | `/api/activities/me` | Get the authenticated user's activity logs |
| `GET` | `/api/test/protected` | Protected endpoint for checking authentication |

Protected endpoints require the JWT returned by the login endpoint. In Postman, choose **Authorization → Bearer Token** and paste the token. The exact request fields and validation rules are defined by the request DTO classes in `src/main/java/com/carbontrack/carbontrackbackend/dto/`.

### Example: Health check

```http
GET http://localhost:8080/api/health
```

### Example: Create an activity

Send a `POST` request to:

```text
http://localhost:8080/api/activities
```

Set `Content-Type: application/json` and include a valid Bearer token if the endpoint requires authentication. Use the fields defined in `ActivityLogRequestDTO.java`; the service looks up the configured emission factor and calculates the activity's emissions. An emission factor must exist for the activity/unit combination for a meaningful calculation.

## Database Migrations

Flyway migration files currently included in the project:

- `V1__create_organisations.sql`
- `V2__create_users.sql`
- `V3__create_emission_factors.sql`
- `V4__create_activity_logs.sql`
- `V5__create_goals.sql`
- `V6__create_badges.sql`
- `V7__create_user_badges.sql`
- `V8__create_email_otp_verifications.sql`
- `V9__add_password_reset_token.sql`
- `V10__insert_test_emission_factors.sql`
- `V11__add_user_profile_details.sql`

Flyway tracks applied migrations in its schema-history table. Once a migration has been applied to a shared database, add a new versioned migration for schema changes rather than editing an already-applied migration.

## Project Structure

```text
carbontrack-backend/
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/carbontrack/carbontrackbackend/
    │   │   ├── config/
    │   │   ├── controller/
    │   │   ├── dto/
    │   │   ├── entity/
    │   │   ├── exception/
    │   │   ├── repository/
    │   │   ├── security/
    │   │   └── service/
    │   └── resources/
    │       ├── application.properties
    │       └── db/migration/
    └── test/
```

## Troubleshooting

- **Cannot connect to MySQL:** Confirm MySQL is running, the `carbontrack` database exists, and `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` are correct.
- **Missing JWT secret:** Set `JWT_SECRET` in the same terminal session before starting the application.
- **Email OTP fails:** Verify `MAIL_USERNAME` and `MAIL_PASSWORD`, SMTP access, and any provider-specific app-password requirements.
- **Flyway migration fails:** Read the first migration error in the application logs. Check database permissions and migration SQL. Avoid deleting Flyway history or manually changing applied migrations without understanding the impact.
- **Port 8080 is busy:** Stop the other process using the port or change `server.port` in configuration.
- **401 Unauthorized:** Log in again and send the returned JWT as a Bearer token.
- **Emission is not calculated as expected:** Verify that the relevant emission factor exists and matches the activity's category/unit.

## Security Notes

- Never commit real database passwords, email credentials, JWT secrets, or other tokens.
- Use environment variables or a local, untracked environment file for secrets.
- Use HTTPS and appropriately managed secrets for production deployments.
- Review authentication, authorization, OTP rate limits, and error responses before deploying publicly.
- Emission results depend on the accuracy and units of the configured emission factors; they are estimates, not a substitute for a verified environmental audit.

## Current Scope and Future Work

This README describes the backend found in this repository archive. A React frontend, Docker/Docker Compose configuration, deployment workflow, and API documentation UI should only be listed as available after those components have been added and tested.

## License

No license is specified in the project files yet. Add a `LICENSE` file if you intend to publish the project with explicit reuse terms.
=======
# CarbonTrack Backend


## Prerequisites

Install and configure:

-   JDK version required by the project's `pom.xml`
-   Maven (or use the Maven Wrapper if the repository contains
    `mvnw.cmd`)
-   MySQL Server

## 1. Create the database

In MySQL, create the database if it does not already exist:

``` sql
CREATE DATABASE carbontrack;
```

Do not share or commit database passwords.

## 2. Configure environment variables in PowerShell

Open PowerShell in the backend project directory:

``` powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/carbontrack"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = Read-Host "Enter your MySQL password"
```

Enter the MySQL password when prompted. It will not be written into this
README.

These variables apply only to the current PowerShell session. Set them
again in a new terminal session.

If your local MySQL uses a different database name, host, port, or
username, update `DB_URL` and `DB_USERNAME` accordingly.

## 3. Run the backend

From the directory containing `pom.xml`:

``` powershell
mvn spring-boot:run
```

If the project includes the Maven Wrapper, this may also be run with:

``` powershell
.\mvnw.cmd spring-boot:run
```

Spring Boot normally starts on `http://localhost:8080`, unless the
project configuration specifies another port.

Stop the server with `Ctrl+C`.

## 4. Run a build or tests

Compile the project:

``` powershell
mvn clean compile
```

Run tests:

``` powershell
mvn test
```

A successful compile does not mean tests passed. Check the final Maven
result.

## Database migration note

This project uses Flyway migrations. The database used by the developer
who created this README had a **V10 checksum mismatch** because the
local V10 migration file differed from the version previously applied to
that database. A teammate using a fresh database should test the
migrations from the beginning. If an existing database reports a Flyway
checksum mismatch, do not manually edit Flyway history or run `repair`
without first checking the schema and coordinating with the team.

## Before committing or pushing

-   Never commit `.env` files containing passwords, database
    credentials, or tokens.
-   Confirm `mvn clean compile` and `mvn test` results.
-   Check `git status` and make sure database backups are not staged.
-   Confirm the intended branch and pull-request status before merging.
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
