# CafeServe

A full-stack restaurant ordering and management application built with React, Node.js, Express, and PostgreSQL. CafeServe provides customers with a digital menu and ordering experience, while giving administrators tools to manage menu items, users, and orders.

## Features

### Customer experience
- Browse menu items and categories.
- Add items to a shopping cart and proceed to checkout.
- Create an account and sign in.
- Place orders and view order details and status.
- Save delivery details through the ordering workflow.

### Administration
- View dashboard metrics and order activity.
- Create and manage menu items and categories.
- Review orders and update their statuses.
- Manage user roles and account status.
- Upload menu images to Cloudinary through an authenticated, admin-only endpoint.

### Security and data handling
- JWT-based authentication.
- Password hashing with bcrypt.
- Role-based authorization for administrative endpoints.
- PostgreSQL data persistence through Prisma ORM.
- Validation and size limits for menu-image uploads.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Image uploads | Multer, Cloudinary |

## Application Architecture

```text
Customer / Administrator
          |
          v
 React + Vite Frontend
          |
          | HTTP / REST API
          v
   Node.js + Express
          |
          v
       Prisma ORM
          |
          v
      PostgreSQL

Menu image uploads -----> Cloudinary
```

The frontend communicates with the Express API. The backend applies authentication and authorization where required, and Prisma is used to access PostgreSQL. Menu images are stored in Cloudinary; their URLs can be saved with menu-item data.

## Project Structure

```text
CafeServe/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── backend/
    ├── prisma/
    │   ├── migrations/
    │   ├── schema.prisma
    │   └── seed.js
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── routes/
    │   └── server.js
    └── package.json
```

## Getting Started

### Prerequisites

Install the following before running the application:

- Node.js and npm
- PostgreSQL
- A Cloudinary account for menu-image uploads

### 1. Clone the repository

```bash
git clone https://github.com/sajjadabdullah90/CafeServe.git
cd CafeServe
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
FRONTEND_URL="http://localhost:5173"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

Replace the example values with your own credentials. Keep `.env` private and never commit real credentials to GitHub. Use a strong, unique `JWT_SECRET`, especially outside local development.

### 3. Apply database migrations

From the `backend/` directory, run:

```bash
npx prisma generate
npx prisma migrate deploy
```

These commands generate the Prisma client and apply migrations already present in the repository. If setting up a new database, review the migration history and schema first. Do not reset a database containing data to resolve migration issues.

### 4. (Optional) Seed menu data

To insert or update the sample menu items:

```bash
npm run db:seed
```

Run this only against a database where you are comfortable adding or updating the sample menu data.

### 5. Start the backend

```bash
npm run dev
```

The API defaults to `http://localhost:5000`. Check its health endpoint at:

`http://localhost:5000/api/health`

### 6. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local frontend URL in the terminal; the default is usually `http://localhost:5173`.

For a production frontend build, run:

```bash
npm run build
```

## API Overview

The backend exposes REST endpoints for the following resources:

| Base path | Purpose |
| --- | --- |
| `GET /api/health` | Backend health check |
| `/api/auth` | Registration, login, and current-user details |
| `/api/menu` | Public menu browsing |
| `/api/orders` | Customer order creation and order history |
| `/api/admin` | Administrative dashboard, order management, menu management, and image uploads |
| `/api/admin/users` | Administrative user management |

Protected endpoints require authentication, and administrative routes require the appropriate role.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Port used by the backend (defaults to `5000`) |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `FRONTEND_URL` | Allowed frontend origin for CORS; multiple origins can be comma-separated |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Deployment Notes

For production deployment:

1. Deploy the frontend as a static Vite application using `npm run build` and the `frontend/dist` output directory.
2. Deploy the backend as a Node.js service with the start command `npm start` from `backend/`.
3. Provision a PostgreSQL database and set `DATABASE_URL` in the backend service.
4. Configure `JWT_SECRET`, `FRONTEND_URL`, and the Cloudinary credentials in the backend service's environment settings.
5. Apply reviewed Prisma migrations before routing production traffic.
6. Set `FRONTEND_URL` to the deployed frontend origin and verify the health endpoint, authentication, menu, checkout, order history, and admin workflows.

Do not use local development URLs or commit production credentials. Verify your hosting provider's current pricing, service limits, and networking requirements before deployment.

## Development Scripts

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the backend with nodemon |
| `npm start` | Start the backend with Node.js |
| `npm run db:seed` | Seed sample menu data |

## License

No license has been specified yet. All rights are reserved by default unless a license is added to this repository.
