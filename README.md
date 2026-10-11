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
