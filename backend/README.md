# SnapLink — Backend

Backend foundation for **SnapLink**, a URL shortening service, built with Node.js, Express, and MongoDB following an MVC architecture.

> This milestone establishes the project foundation only. Authentication, URL shortening, database models, and business logic are intentionally **not** implemented yet.

## Tech Stack

- **Node.js** with **ES Modules**
- **Express.js** — web framework
- **MongoDB** with **Mongoose** — database & ODM
- **Helmet**, **CORS**, **Cookie Parser** — security & request handling
- **Morgan** — HTTP request logging (development only)
- **dotenv** — environment variable management

## Prerequisites

- Node.js `>= 18.0.0`
- A running MongoDB instance (local or hosted, e.g. MongoDB Atlas)

## Installation

1. Clone the repository and move into the backend directory:

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

Configure the following variables in your `.env` file:

| Variable      | Description                                   | Required | Default                              |
| ------------- | --------------------------------------------- | -------- | ------------------------------------ |
| `PORT`        | Port the server listens on                    | No       | `5000`                               |
| `NODE_ENV`    | Runtime environment (`development`/`production`) | No    | `development`                        |
| `MONGO_URI`   | MongoDB connection string                     | **Yes**  | —                                    |
| `CORS_ORIGIN` | Allowed CORS origin(s)                        | No       | `*`                                  |

The application fails fast on startup if a required variable is missing.

## Run Commands

Start the server in development mode (auto-restart via nodemon):

```bash
npm run dev
```

Start the server in production mode:

```bash
npm start
```

## Health Check

Once running, verify the server:

```bash
curl http://localhost:5000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "SnapLink Backend is running",
  "data": {}
}
```

## API Response Format

All responses follow a consistent structure.

**Success**

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

**Error**

```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}
```

## Project Structure

```
backend/
│
├── src/
│   ├── config/            # Environment config & database connection
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/       # Thin request handlers
│   │   └── health.controller.js
│   ├── middleware/        # Global error handler & 404 handler
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── models/            # Mongoose models (added in later milestones)
│   ├── routes/            # API route definitions
│   │   ├── health.routes.js
│   │   └── index.js
│   ├── services/          # Business logic (added in later milestones)
│   ├── utils/             # Reusable helpers (responses, errors, async wrapper)
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── asyncHandler.js
│   ├── validators/        # Request validation schemas (added in later milestones)
│   ├── app.js             # Express app configuration
│   └── server.js          # Entry point: DB connection & server startup
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Architecture Notes

- **MVC** with a dedicated service layer — controllers stay thin, business logic lives in `services/`.
- **API versioning** — all routes are mounted under `/api/v1`.
- **Centralized configuration** — environment access is isolated in `config/env.js`; nothing is hardcoded.
- **Consistent responses** — helpers in `utils/ApiResponse.js` standardize every payload.
- **Centralized error handling** — a custom `ApiError` class plus a global error handler produce uniform error responses.
