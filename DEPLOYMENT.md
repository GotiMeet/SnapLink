# SnapLink — Deployment

Frontend on **Vercel** (static Vite build). Backend on any Node host that gives you
a persistent process and a public HTTPS origin — Railway, Render, Fly, a VM.

The two live on different origins. Everything awkward about this deployment follows
from that one fact: cookies have to be cross-site, CORS has to be exact, and the
frontend has to be told where the backend is at build time.

---

## 1. Architecture

```
 Browser
   │
   ├─ https://your-app.vercel.app        Frontend  (Vercel, static)
   │     every path rewrites to index.html; React Router takes over
   │
   └─ https://api.your-domain.com        Backend   (Node + Express)
         /api/v1/*        the API
         /:shortCode      short-link redirects  ← also what QR codes encode
         /api/v1/health   health check
```

The backend serves **both** the API and the short links, from one Express app. That
is why `VITE_API_URL` and `VITE_APP_URL` are normally the same value.

### Redirects that cross back to the frontend

The backend sends browsers to the frontend in three places. All three are why SPA
routing is not optional:

| Situation | Backend responds |
|---|---|
| Private short link, no password supplied | `302 → {CLIENT_URL}/unlock/:shortCode` |
| Unknown, deleted, or not-yet-live short code | `302 → {CLIENT_URL}/link-unavailable` |
| Verification / reset email | link to `{CLIENT_URL}/verify-email?token=…` and `{CLIENT_URL}/reset-password?token=…` |

---

## 2. Frontend deployment (Vercel)

### 2.1 Project settings

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (default) |
| Install Command | `npm install` (default) |
| Node.js Version | 18.x or later |

**Root Directory must be `frontend`.** This is a two-package repository and
`vercel.json` lives in `frontend/`. Left at the repository root, Vercel finds no
project to build and never reads the rewrite config.

### 2.2 SPA routing

`frontend/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Why a catch-all is safe.** Vercel resolves a request in this order:

```
headers → redirects → filesystem → rewrites
                      ^^^^^^^^^^
```

Static files win before rewrites are considered, so `/assets/index-*.js`,
`/favicon.svg`, `/robots.txt` and `/sitemap.xml` are served as themselves. Only
paths with no file behind them — every application route — fall through to
`index.html`.

**Why it is needed.** Without it the CDN looks for a file at each path and finds
none. Every route except `/` returns 404, including the password gate and both
email-link landing pages. The application uses `BrowserRouter` with no `basename`,
so the rewrite target is the root `index.html` and nothing else needs configuring.

### 2.3 Frontend environment variables

Set these in **Project Settings → Environment Variables**, for the Production
environment (and Preview, if you use preview deployments against a staging API).

| Variable | Required | Value | If wrong |
|---|---|---|---|
| `VITE_API_URL` | **Yes** | Backend origin, no trailing slash | Blank white page |
| `VITE_APP_URL` | **Yes** | Short-link origin — normally the same as above | Blank white page |
| `VITE_SITE_URL` | No | `https://your-app.vercel.app` | `sitemap.xml` not emitted |
| `VITE_GOOGLE_CLIENT_ID` | No | Same client id as the backend | Google button hidden; a mismatch rejects every sign-in |
| `VITE_SUPPORT_EMAIL` | No | Support address | `/contact` shows its "no channel" notice |
| `VITE_REPO_URL` | No | Repository URL | `/contact` shows its "no channel" notice |

> **These are compiled into the bundle, not read at runtime.** Changing one in the
> Vercel dashboard does nothing until you redeploy.

---

## 3. Backend deployment

### 3.1 Requirements

- **Node 18+**, a persistent process (`npm start` → `node src/server.js`).
- **A public HTTPS origin.** Cross-site cookies require `Secure`, which requires HTTPS.
- **MongoDB as a replica set.** Not optional — see §3.3.
- **Working SMTP credentials.** The server refuses to start without them in production.
- **A platform that sets `X-Forwarded-Proto`.** The app trusts exactly one proxy hop
  (`app.set('trust proxy', 1)`), which is what lets `Secure` cookies work behind the
  platform's load balancer without letting a client forge the forwarding chain.

### 3.2 Health check endpoint

```
GET /api/v1/health   →   200  {"success":true,"message":"SnapLink Backend is running", …}
```

**Configure your platform to use this exact path.** A bare `/` returns **404** — the
application root belongs to the short-link router, whose only route is
`/:shortCode`, which does not match an empty path. A platform left on its default
health path will mark a perfectly healthy service as down and may restart it in a
loop.

### 3.3 MongoDB replica-set requirement

`createUrl`, `restoreUrl` and the project lifecycle run inside transactions:

```
src/services/project.service.js:69    withTransaction
src/services/url.service.js:254       withTransaction
src/services/url.service.js:525       withTransaction
```

MongoDB supports transactions **only on a replica set**. On a standalone `mongod`
these throw, so creating, deleting and restoring links fail outright rather than
degrading.

- **MongoDB Atlas** — satisfied on every tier, including free. Nothing to do.
- **Self-hosted** — a single-node replica set is enough, but it must be initialised
  as one (`rs.initiate()`), not left standalone.

### 3.4 Backend environment variables

| Variable | Required | Production value | If wrong |
|---|---|---|---|
| `NODE_ENV` | **Yes** | `production` | Cookies default to insecure + `SameSite=Lax` |
| `PORT` | No | Usually injected by the platform | — |
| `CLIENT_URL` | **Yes** | Deployed frontend origin, no trailing slash | Boot fails; redirect + email links point at the wrong host |
| `APP_URL` | **Yes** | Backend's own public origin | Boot fails; QR codes encode the wrong host |
| `CORS_ORIGIN` | No | **Omit** — falls back to `CLIENT_URL` | A stale value silently wins over a correct `CLIENT_URL` |
| `MONGO_URI` | **Yes** | Atlas SRV connection string | Boot fails |
| `JWT_ACCESS_SECRET` | **Yes** | Fresh random secret | Boot fails |
| `JWT_REFRESH_SECRET` | **Yes** | Fresh random secret | Boot fails |
| `JWT_EMAIL_VERIFICATION_SECRET` | **Yes** | Fresh random secret | Boot fails |
| `JWT_PASSWORD_RESET_SECRET` | **Yes** | Fresh random secret | Boot fails |
| `JWT_ACCESS_TTL` | No | `900` | — |
| `JWT_REFRESH_TTL` | No | `604800` | — |
| `JWT_EMAIL_VERIFICATION_TTL` | No | `900` | Any other value and the UI's "expires in 15 minutes" is false |
| `JWT_PASSWORD_RESET_TTL` | No | `900` | — |
| `COOKIE_SECURE` | No | **Leave unset** | `false` breaks authentication silently |
| `COOKIE_SAME_SITE` | No | **Leave unset** | `lax` breaks authentication silently |
| `COOKIE_DOMAIN` | No | **Leave unset** | A wrong domain makes the browser discard the cookie |
| `SMTP_HOST` | **Yes** | SMTP server | Boot fails |
| `SMTP_PORT` | No | `587` | — |
| `SMTP_SECURE` | No | `false` for 587, `true` for 465 | TLS handshake fails |
| `SMTP_USER` | **Yes** | SMTP username | Boot fails |
| `SMTP_PASS` | **Yes** | SMTP password / app password | Boot fails |
| `EMAIL_FROM` | No | `SnapLink <no-reply@your-domain.com>` | Falls back to a `.local` address |
| `GOOGLE_CLIENT_ID` | No | Same client id as the frontend | Google sign-in rejects every token |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> `GOOGLE_CLIENT_SECRET` is **not** used. The backend verifies Google ID tokens,
> which needs no client secret. Do not carry it in production.

---

## 4. Cookie and CORS requirements

### 4.1 Cookies

The frontend never stores tokens. Authentication is two HTTP-only cookies, and with
the frontend and backend on different origins they must be marked cross-site.

With `NODE_ENV=production` and the three `COOKIE_*` variables left unset, the server
produces exactly this — no configuration required:

| Cookie | Flags | Path | Lifetime |
|---|---|---|---|
| `accessToken` | `HttpOnly`, `Secure`, `SameSite=None` | `/` | 15 min |
| `refreshToken` | `HttpOnly`, `Secure`, `SameSite=None` | `/api/v1/auth` | 7 days |

Three things this depends on:

1. **HTTPS on both origins.** `Secure` cookies are not sent over HTTP.
2. **`credentials: 'include'` on every request** — already the case in `lib/api.ts`.
3. **`trust proxy`** so Express sees the original protocol behind the load balancer.

### 4.2 CORS

`Access-Control-Allow-Origin` is never a wildcard: browsers reject `*` on credentialed
requests. The allowed origin is `CORS_ORIGIN` when set, and `CLIENT_URL` otherwise.

**One origin only.** The value is passed to the `cors` package as a single string, so
a comma-separated list is echoed back whole as an invalid header and the browser blocks
the request — even though the separate CSRF origin check *does* split on commas and
will happily allow both. The two layers disagree, so a two-origin setup fails in a
confusing way. If you need apex and `www`, redirect one to the other at the edge.

Origins are compared **exactly**. All of these are different origins:

```
https://app.com      https://www.app.com      http://app.com      https://app.com:443
```

### 4.3 CSRF

State-changing requests are rejected with `403` unless their `Origin` or `Referer`
matches an allowed origin. Requests carrying neither are allowed through, which reaches
only non-browser clients — browsers always attach `Origin` to cross-origin mutations
and page scripts cannot suppress it.

Practical consequence: **if `CORS_ORIGIN` or `CLIENT_URL` is wrong, every mutation
fails with a 403 that mentions CSRF**, which reads like a security bug and is actually
a configuration mismatch.

---

## 5. Deployment order

Deploy the backend first — the frontend build needs its origin.

1. **Provision MongoDB.** Atlas free tier is fine. Allow-list your backend host's
   egress IPs, or `0.0.0.0/0` if the platform has no stable egress.
2. **Deploy the backend** with every required variable from §3.4. Set `CLIENT_URL`
   to the frontend origin you are about to create — on Vercel this is predictable
   (`https://<project>.vercel.app`), or set your custom domain now.
3. **Verify the backend:** `curl https://api.your-domain.com/api/v1/health` → 200.
4. **Deploy the frontend** on Vercel with Root Directory `frontend` and the variables
   from §2.3.
5. **Reconcile the origins.** If Vercel gave you a different hostname than you assumed,
   update `CLIENT_URL` (and `CORS_ORIGIN` if you set it) and restart the backend.
6. **Run the post-deploy checks** in §7.

---

## 6. Common deployment mistakes

Ordered by how often they bite and how badly they present.

### Green build, blank white page

`VITE_API_URL` or `VITE_APP_URL` missing at build time. The variables are validated
when the module first evaluates — *before* React mounts — so the ErrorBoundary never
exists to catch the throw, and Vite never evaluates the module during the build. The
build passes, the deployment is green, the site is blank with one console error.

**Fix:** set both in Vercel and redeploy. Confirm with the first check in §7.

### `localhost` compiled into a production bundle

A production build run on a developer machine picks up `frontend/.env` automatically.
The bundle ships with `http://localhost:5000` baked in and every request fails against
a host that only exists on that laptop.

**Fix:** let Vercel build it. If you must build locally, pass the values explicitly on
the command line.

### Sign-in succeeds, then bounces straight back to the login page

Cross-site cookies are not being sent. Almost always one of:

- `COOKIE_SECURE=false` or `COOKIE_SAME_SITE=lax` copied from the example file
- `NODE_ENV` not set to `production`
- the backend on HTTP rather than HTTPS
- `COOKIE_DOMAIN` set to a domain the API is not served from

There is no error message for any of these — the browser simply declines to attach the
cookie. Check the `Set-Cookie` response header on `POST /api/v1/auth/login`; it should
read `HttpOnly; Secure; SameSite=None`.

### Every mutation returns 403 "Cross-site request forgery forbidden"

`CLIENT_URL` / `CORS_ORIGIN` does not exactly match the browser's origin. Check for a
trailing slash, `http` vs `https`, or `www` vs apex.

### 404 on refresh, or the password gate never loads

`vercel.json` is not being read — nearly always because Root Directory is not set to
`frontend`.

### Health check flapping, or the service restarting in a loop

The platform is checking `/` instead of `/api/v1/health`.

### Link creation fails with a transaction error

MongoDB is a standalone `mongod`, not a replica set.

### Scheduled links never go live

The backend is on a free tier that idles the service to sleep. The scheduler is an
in-process cron running every minute; it does not run while the instance is asleep.
Scheduled activation and expiry resume when traffic wakes it.

### Rate limits behave inconsistently

Counters are in-memory and per-instance: they reset on every redeploy, and running two
instances doubles every effective limit. Expected at this size; worth knowing before
scaling out.

---

## 7. Post-deploy verification

Run these against the live origins. The first four take a minute and catch every
failure mode in §6.

**1 — The frontend renders at all** (catches the blank-page trap)

Open `https://your-app.vercel.app`. You should see the marketing page, not a white
screen. If it is blank, open the console: a `Missing required environment variable`
error means §2.3 is incomplete.

**2 — SPA routing** — every one of these must return 200 and render:

```bash
for p in / /features /about /contact /login /signup \
         /verify-email /reset-password /forgot-password \
         /unlock/testcode /link-unavailable /app/dashboard /app/links; do
  printf '%-24s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' https://your-app.vercel.app$p)"
done
```

**3 — Static assets still served directly** (proves the rewrite did not swallow them):

```bash
curl -sI https://your-app.vercel.app/favicon.svg  | head -1   # 200, image/svg+xml
curl -sI https://your-app.vercel.app/robots.txt   | head -1   # 200, text/plain
curl -sI https://your-app.vercel.app/sitemap.xml  | head -1   # 200, application/xml
```

If any of these return `text/html`, the rewrite is misconfigured — it is intercepting
files instead of only unmatched paths.

**4 — Backend health and CORS**

```bash
curl -s https://api.your-domain.com/api/v1/health

curl -sI -X OPTIONS https://api.your-domain.com/api/v1/auth/login \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" | grep -i access-control
```

`Access-Control-Allow-Origin` must echo your frontend origin **exactly**, and
`Access-Control-Allow-Credentials: true` must be present.

**5 — The full auth round trip**

Register → receive the email → verify → sign in → reload `/app/dashboard`. The reload
is the important part: it exercises the SPA rewrite, the cookie flags and the refresh
path in one action.

**6 — The password gate end to end**

Create a protected link, open its short URL in a private window. You should be
redirected to `/unlock/:shortCode` and the form should submit successfully. This is
the flow that breaks first when SPA routing or `CLIENT_URL` is wrong.
