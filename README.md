# Expense Tracker with Analytics

A full-stack MERN application where users log income and expenses, organise them by category, set monthly budgets, and see analytics about their spending.

> **Status:** the backend (REST API) is complete and tested. The React frontend is in progress.

## Features

**Authentication**
- Register, login and logout
- JWT stored in an httpOnly cookie, with an auth middleware
- `GET /me` to restore the session after a page refresh

**Transactions**
- Create, edit and delete income and expense entries
- Fields: amount, type, category, date, note, payment method
- Filtering (type, category, date range), search, sorting and pagination

**Categories**
- 11 default categories created automatically on registration
- Custom categories with a name, colour and type
- A category that has transactions cannot be deleted or have its type changed

**Budgets**
- Monthly budget per expense category
- Spent vs limit with a status: `ok`, `warning` (80% or more) and `exceeded` (100% or more)

**Analytics** (MongoDB aggregation pipelines)
- Income, expense and balance for a month
- Spending by category (for pie or donut charts)
- Monthly trend for the last N months (for line and bar charts)
- Daily spending for a month
- Top expenses of the month
- Comparison with the previous month, with percentage change

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB (Atlas) with Mongoose |
| Auth | JWT in an httpOnly cookie, bcrypt password hashing |
| Validation | Zod |
| Frontend (planned) | React (Vite), Recharts, Axios |

## Design decisions

- **Money is stored as integer paise** (Rs 250.75 is saved as `25075`) to avoid floating-point errors. The API accepts and returns rupees.
- **Every query is scoped to the logged-in user** (`user: req.user.id`). The user id comes from the token, never from the request body. Another user's data returns `404`, so its existence is not revealed.
- **Analytics use aggregation pipelines**, not JavaScript loops, with `$match` first so the compound index `{ user, date }` is used. An explain plan over 5,000 seeded transactions shows an index scan (`IXSCAN`) that examines only as many documents as it returns.
- **Timezone-aware dates.** Month boundaries and day or month grouping use a configurable timezone (`APP_TIMEZONE`), so a transaction at 11:30 PM is not counted in the wrong day or month.
- **Layered validation:** Zod at the request, business rules in the controller (for example, a category must belong to the user and match the transaction type), and Mongoose at the schema.
- **One error format.** A global error handler turns custom, Mongoose and JWT errors into `{ success, message, errors }`.
- **Missing days and months are filled in on the server**, so charts receive continuous series.

## Project structure

```
expense-tracker/
  backend/
    server.js
    src/
      app.js
      db/db.js
      models/        user, category, transaction, budget
      controller/    auth, category, transaction, budget, analytics
      routes/        auth, category, transaction, budget, analytics
      middleware/    auth, validate, error
      validators/    auth, category, transaction, budget, analytics
      utils/         ApiError, asyncHandler, token, money, dateRange, defaultCategories
      seed/          seed.js, explain.js
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local MongoDB

### Setup

```bash
git clone https://github.com/Anamikakathait12/expense-tracker.git
cd expense-tracker/backend
npm install
```

Create your environment file from the example (Windows: `copy .env.example .env`, macOS or Linux: `cp .env.example .env`), then fill in the values.

### Environment variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string, including the database name, e.g. `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority` |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin allowed by CORS, e.g. `http://localhost:5173` |
| `APP_TIMEZONE` | Timezone for month and day boundaries, e.g. `Asia/Kolkata` |
| `DNS_SERVERS` | Optional. See Troubleshooting |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Never commit `.env`. It is listed in `.gitignore`.

### Run

```bash
npm run dev
```

You should see `MongoDB connected` and `Server running on port 5000`. Check `http://localhost:5000/api/health`.

### Seed test data (development only)

Register a user with the email `rahul@test.com` through the API and make sure that user has at least one income and one expense category (new users get defaults automatically). Then:

```bash
npm run seed -- --reset
```

This inserts 5,000 transactions spread over the last 12 months. Never run it against a production database.

To check that queries use the index:

```bash
npm run explain
```

## API reference

All routes except auth and health require a logged-in user (the `token` cookie). Every response has `success: true` or `success: false` with a `message`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account and log in |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Current user |

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | List my categories |
| POST | `/api/categories` | Create a category |
| PUT | `/api/categories/:id` | Update name, colour or type |
| DELETE | `/api/categories/:id` | Delete (blocked if it has transactions) |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transactions` | Create |
| GET | `/api/transactions` | List with filters |
| GET | `/api/transactions/:id` | Get one |
| PUT | `/api/transactions/:id` | Update the fields sent |
| DELETE | `/api/transactions/:id` | Delete |

List query parameters: `type`, `category`, `from`, `to`, `search`, `page` (default 1), `limit` (default 10, max 100), `sort` (`date`, `-date`, `amount`, `-amount`).

### Budgets

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/budgets` | Set a budget for a category and month |
| GET | `/api/budgets?month=2026-10` | Budgets with `spent`, `remaining`, `percentUsed` and `status` |
| PUT | `/api/budgets/:id` | Change the limit |
| DELETE | `/api/budgets/:id` | Delete |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/summary?month=2026-10` | Income, expense, balance |
| GET | `/api/analytics/by-category?month=2026-10&type=expense` | Totals and percent per category |
| GET | `/api/analytics/monthly-trend?months=6` | Income, expense, balance per month |
| GET | `/api/analytics/daily?month=2026-10&type=expense` | Total for every day of the month |
| GET | `/api/analytics/top-expenses?month=2026-10&limit=5` | Largest expenses |
| GET | `/api/analytics/compare?month=2026-10` | This month vs the previous month |

If `month` is omitted, the current month is used.

### Example

```http
POST /api/transactions
Content-Type: application/json

{ "type": "expense", "amount": 250.75, "category": "<category id>", "note": "Lunch", "paymentMethod": "upi" }
```

```json
{
  "success": true,
  "transaction": {
    "_id": "...",
    "type": "expense",
    "amount": 250.75,
    "category": { "name": "Food", "color": "#ef4444", "type": "expense" },
    "note": "Lunch",
    "paymentMethod": "upi"
  }
}
```

Error responses always look like this:

```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "amount", "message": "Amount must be greater than 0" }] }
```

## Testing

Endpoints were tested manually with Postman, including validation failures, ownership checks (a second user receives `404` on another user's data), timezone boundaries, and a 5,000-transaction dataset. Automated tests with Jest and Supertest are planned.

## Troubleshooting

- **`ERR_MODULE_NOT_FOUND`:** local imports need the `.js` extension (the project uses ES modules).
- **`querySrv ECONNREFUSED` when connecting to Atlas:** some networks cannot resolve Atlas SRV records. Set `DNS_SERVERS=8.8.8.8,8.8.4.4` in `.env`.
- **Data appears in a database called `test`:** the database name is missing from `MONGO_URI`. Add it after the host: `.../expense-tracker?retryWrites=true`.
- **`401` right after logging in from a browser or Postman:** the `token` cookie was not sent. Check that cookies are enabled and the request goes to the same host.

## Roadmap

- [x] Auth, error handling, auth middleware
- [x] Categories (defaults, edit, delete protection)
- [x] Transactions CRUD with filters, search, sorting, pagination
- [x] Budgets with spent vs limit
- [x] Analytics endpoints
- [ ] React frontend: auth pages, dashboard, transactions, budgets, analytics charts
- [ ] CSV export
- [ ] Recurring transactions
- [ ] Rate limiting, Helmet, production CORS and cookie settings
- [ ] Deployment (Render or Railway for the API, Vercel for the frontend, MongoDB Atlas)
- [ ] Refresh tokens, forgot password, receipt upload, savings goals, unit tests

## License

MIT
