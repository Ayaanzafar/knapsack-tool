# Project Overview

This is a full-stack JavaScript application designed as a "Knapsack tool" for optimizing solar rail cutting. The goal is to solve a variation of the knapsack problem to minimize waste when cutting solar rails to specified lengths.

The application consists of a React front-end and a Node.js/Express back-end.

## Backend

The back-end is a Node.js/Express server responsible for API endpoints, business logic, and database interactions. It uses Prisma as an ORM to manage the database schema and queries.

### Key Technologies

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web application framework for Node.js.
- **Prisma**: Next-generation ORM for Node.js and TypeScript.
- **MySQL**: The database used for the project, as specified in the Prisma schema.

### Database Schema

The database schema is defined in `backend/prisma/schema.prisma` and includes the following models:

- `Project`: Stores project-level information.
- `Tab`: Represents individual buildings or configurations within a project.
- `TabRow`: Stores individual rows (rail configurations) within a tab.
- `BomMasterItem`: A master catalog of all Bill of Materials (BOM) items.
- `BomFormula`: Stores formulas for calculating BOM quantities.
- `RmCode`: Stores vendor codes for each BOM item.
- `GeneratedBom`: Stores generated BOM snapshots.

### Running the Backend

To run the back-end server for development:

```bash
npm run dev
```

To run the back-end server for production:

```bash
npm start
```

Other useful scripts include:

- `npm run prisma:migrate`: To run database migrations.
- `npm run prisma:generate`: To generate the Prisma client.
- `npm run prisma:studio`: To open the Prisma Studio GUI.
- `npm run prisma:seed`: To seed the database with initial data.

## Frontend

The front-end is a React application built with Vite. It provides a user interface for inputting project parameters, managing tabs (configurations), and viewing the optimized results.

### Key Technologies

- **React**: A JavaScript library for building user interfaces.
- **Vite**: A fast build tool for modern web projects.
- **Axios**: A promise-based HTTP client for making API requests.
- **Tailwind CSS**: A utility-first CSS framework.

### Running the Frontend

To run the front-end development server:

```bash
npm run dev
```

To build the front-end for production:

```bash
npm run build
```

To lint the front-end code:

```bash
npm run lint
```
