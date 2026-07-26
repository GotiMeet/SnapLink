# SnapLink — Backend

Backend for **SnapLink**, a URL shortening service, built with Node.js, Express, and MongoDB following an MVC architecture.

> Implemented so far: project foundation, database schema, and the authentication system. URL shortening, analytics, and QR codes are **not** implemented yet.

## Tech Stack

- **Node.js** with **ES Modules**
- **Express.js** — web framework
- **MongoDB** with **Mongoose** — database & ODM
- **JWT** (`jsonwebtoken`) — access + refresh token authentication
- **bcrypt** — password hashing
- **express-validator** — request validation
- **google-auth-library** — Google OAuth ID-token verification
- **nodemailer** — email delivery (verification & password reset)
- **Helmet**, **CORS**, **Cookie Parser** — security & request handling
- **Morgan** — HTTP request logging (development only)
- **dotenv** — environment variable management

## Prerequisites

- Node.js `>= 18.0.0`
- A running MongoDB instance (local or hosted, e.g. MongoDB Atlas)

## Installation

1. Move into the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file from the example and update the values:

   ```bash
   cp .env.example .env
   ```

## Environment Variables

The application fails fast on startup if a required variable is missing.

| Variable                        | Description                                          | Required | Default                        |
| ------------------------------- | ---------------------------------------------------- | -------- | ------------------------------ |
| `PORT`                          | Port the server listens on                           | No       | `5000`                         |
| `NODE_ENV`                      | `development` / `production`                          | No       | `development`                  |
| `CLIENT_URL`                    | Frontend base URL (used in email links)              | No       | `http://localhost:3000`        |
| `MONGO_URI`                     | MongoDB connection string                            | **Yes**  | —                              |
| `CORS_ORIGIN`                   | Allowed CORS origin(s)                               | No       | `*`                            |
| `BCRYPT_SALT_ROUNDS`            | bcrypt cost factor                                   | No       | `12`                           |
| `JWT_ACCESS_SECRET`             | Secret for access tokens                             | **Yes**  | —                              |
| `JWT_REFRESH_SECRET`            | Secret for refresh tokens                            | **Yes**  | —                              |
| `JWT_EMAIL_VERIFICATION_SECRET` | Secret for email-verification tokens                 | **Yes**  | —                              |
| `JWT_PASSWORD_RESET_SECRET`     | Base secret for password-reset tokens                | **Yes**  | —                              |
| `JWT_ACCESS_TTL`                | Access token lifetime (seconds)                      | No       | `900` (15m)                    |
| `JWT_REFRESH_TTL`               | Refresh token lifetime (seconds)                     | No       | `604800` (7d)                  |
| `JWT_EMAIL_VERIFICATION_TTL`    | Verification token lifetime (seconds)                | No       | `86400` (1d)                   |
| `JWT_PASSWORD_RESET_TTL`        | Reset token lifetime (seconds)                       | No       | `900` (15m)                    |
| `COOKIE_SECURE`                 | Send cookies only over HTTPS                         | No       | `true` in production           |
| `COOKIE_SAME_SITE`              | Cookie `SameSite` policy                             | No       | `lax`                          |
| `COOKIE_DOMAIN`                 | Cookie domain scope                                  | No       | —                              |
| `GOOGLE_CLIENT_ID`              | Google OAuth client ID (required for Google login)   | No\*     | —                              |
| `SMTP_HOST`                     | SMTP host (required for email delivery in production)| No\*     | —                              |
| `SMTP_PORT`                     | SMTP port                                            | No       | `587`                          |
| `SMTP_SECURE`                   | Use TLS on connect                                   | No       | `false`                        |
| `SMTP_USER` / `SMTP_PASS`       | SMTP credentials                                     | No       | —                              |
| `EMAIL_FROM`                    | From address for outgoing email                      | No       | `SnapLink <no-reply@…>`        |

\* Feature-specific: without `GOOGLE_CLIENT_ID`, Google login returns a configuration error; without SMTP, emails are logged to the console in development and error in production.

## Run Commands

```bash
npm run dev    # development (nodemon auto-restart)
npm start      # production
```

## Authentication Endpoints

All routes are prefixed with `/api/v1`. Access and refresh tokens are issued as HTTP-only cookies.

| Method | Endpoint                | Protected | Description                                        |
| ------ | ----------------------- | --------- | -------------------------------------------------- |
| POST   | `/auth/register`        | No        | Register a local account; sends a verification email |
| POST   | `/auth/verify-email`    | No        | Verify email using the token from the email link   |
| POST   | `/auth/login`           | No        | Log in; sets access + refresh cookies              |
| POST   | `/auth/refresh`         | No        | Rotate tokens using the refresh cookie             |
| POST   | `/auth/logout`          | No        | Revoke the current session and clear cookies       |
| POST   | `/auth/forgot-password` | No        | Request a password-reset email                     |
| POST   | `/auth/reset-password`  | No        | Set a new password using the reset token           |
| POST   | `/auth/google`          | No        | Log in / register with a Google ID token           |
| GET    | `/auth/me`              | Yes       | Return the currently authenticated user            |

Email verification and password-reset links point to `CLIENT_URL` (the frontend), which then calls the corresponding endpoint with the token.

## API Response Format

**Success**

```json
{ "success": true, "message": "Success", "data": {} }
```

**Error**

```json
{ "success": false, "message": "Something went wrong", "errors": [] }
```

## Project Structure

```
backend/
│
├── src/
│   ├── config/            # env config & database connection
│   ├── constants/         # frozen enums (status, role, tokenType, …)
│   ├── controllers/       # thin request handlers (auth.controller.js)
│   ├── middleware/         # errorHandler, notFound, authenticate, validate
│   ├── models/            # user, shortUrl, analytics, session
│   ├── routes/            # versioned routers (index, auth, health)
│   ├── services/          # business logic (auth, token, session, email, google)
│   ├── utils/             # ApiResponse, ApiError, asyncHandler, password, crypto, cookie, sanitizeUser
│   ├── validators/        # express-validator chains (auth.validator.js)
│   ├── app.js             # Express app configuration
│   └── server.js          # entry point: DB connection & server startup
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Architecture Notes

- **MVC + services** — controllers stay thin; business logic lives in `services/`.
- **API versioning** — all routes are mounted under `/api/v1`.
- **JWT auth** — short-lived access tokens (15m) and rotating refresh tokens (7d), both in HTTP-only cookies.
- **Sessions** — each login creates a `Session` document storing only a hashed refresh token, so multiple concurrent sessions are supported and refresh tokens are never persisted in plain text.
- **Password security** — bcrypt hashing (12 rounds); email verification is required before local login.
- **Centralized configuration & error handling** — env access is isolated in `config/env.js`; a custom `ApiError` and global handler produce uniform responses.
