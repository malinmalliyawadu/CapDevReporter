# 🕒 ***REMOVED*** Timesheet

Automated timesheet app for ***REMOVED*** employees.

## 🚀 Technology Stack

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Prisma ORM](https://www.prisma.io/)
- [Playwright](https://playwright.dev/) (E2E Testing)
- [Recharts](https://recharts.org/)

## 📋 Pre-requisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- [MySQL](https://www.mysql.com/) (easiest option is to run in Docker)

Optional tools:

- [Docker](https://www.docker.com/) - for running as a container
- [Terraform](https://www.terraform.io/) - for making changes to infrastructures

## 🏃‍♂️ Get Started

1. Install dependencies:

```bash
npm install
```

2. Setup the database with seed data:

```bash
npx prisma migrate dev
```

3. Start the development server:

```bash
npm run dev
```

3. Navigate to [http://localhost:3000](http://localhost:3000) to access the application.

## 🧪 Testing

Execute the test suite using the following commands:

```bash
# Standard E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Unit tests
npm run test

# Unit tests with watch
npm run test:watch
```

## 🔐 Environment Variables

You can copy the `.env.example` file as a starting point:

```bash
cp .env.example .env
```

Then update the values with your actual credentials.

## 💾 Database Management

Initialize or reset the database:

```bash
npm run db:reset
```

Database GUI:

```bash
npx prisma studio
```

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [iPayroll](docs/IPAYROLL.md)
