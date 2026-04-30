# Allies Connect

Allies Connect is a mobile-first web platform designed to connect Georgia residents with community resources, nonprofit services, events, and volunteer opportunities through a single, centralized system.

*GitHub Copilot has been used to provide coding assistance with this project, as well as for writing unit tests and some documentation.*  

## Overview

Allies Connect addresses a major problem in community outreach: critical information about food assistance, housing support, nonprofit events, and volunteer opportunities is often scattered across websites, social media, flyers, and word of mouth.

This platform brings that information together into one accessible application so users can more easily find support, organizations can manage listings, and administrators can maintain data quality.

The system supports multiple user roles:
- Public users searching for resources and events  
- Volunteers registering for opportunities and shifts  
- Service providers managing listings, events, and volunteer opportunities  
- Admin users moderating providers, content, and logs  

---

## Core Features

### Public Users
- Browse community resources  
- Search by category and location  
- View resource details  
- Browse events and event details  

### Volunteers
- Create accounts and log in  
- Sign up for volunteer opportunities and shifts  
- Manage availability and commitments  
- Track volunteer participation  

### Service Providers
- Register organization accounts  
- Manage organization profiles  
- Create and manage resources  
- Create and manage events  
- Create and manage volunteer opportunities  
- Export volunteer signup data  

### Admin Users
- Approve or reject provider registrations  
- Moderate resources, events, and opportunities  
- View audit and system activity logs  
- Maintain platform integrity  

---

## System Architecture

The platform follows a three-tier architecture:

- **Frontend:** React application in `allies-connect/`  
- **Backend:** Node.js and Express API in `backend/`  
- **Database:** SQL schema and seed files in `database/`  

### External Integrations
- Google Maps  
- Gmail SMTP  
- GivingTuesday EIN validation  

---

## API Documentation

Swagger-based API documentation is included for the backend.

- The backend serves Swagger UI at `/api-docs/`  
- A PDF export is included in the `docs/` folder  

---

## Repository Structure

```text
Group4AlliesConnect/
├── allies-connect/        # React frontend
├── backend/               # Express backend and API
├── database/              # Schema and seed files
├── docs/                  # Project documentation
├── Server_Setup.md        # Deployment notes
├── LICENSE
└── README.md
```

---

## Documentation

Project documentation is located in the `docs/` folder and includes:

- Project Plan  
- Software Requirements Specification (SRS)  
- System Design Document  
- Architecture Diagram  
- Entity Relationship Diagram (ERD)  
- Data Dictionary  
- User Personas & Stories  
- User Flow Diagram  
- API Documentation (Swagger)  
- Test Documentation  

See `docs/README.md` for a guide to the documentation files.

---

## Setup and Installation

### Prerequisites
- Node.js  
- npm  
- MySQL-compatible database  

### Frontend Setup
```
cd allies-connect
npm install
npm start
```

### Backend Setup
```
cd backend
npm install
npm start
```

### Backend Development Mode
```
cd backend
npm run dev
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory.

Example:

```
PORT=5000
NODE_ENV=production

DB_URL=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

DEV_DB_URL=your_dev_database_host
DEV_DB_USER=your_dev_database_user
DEV_DB_PASSWORD=your_dev_database_password
DEV_DB_NAME=your_dev_database_name
```

---

## Testing

The project implements a layered testing strategy to validate both individual components and full user workflows.

### Frontend Testing
- Jest and React Testing Library are used for unit testing React components and UI behavior  
- Tests verify rendering, user input handling, and navigation  

Run frontend unit tests:
```
cd allies-connect
npm test
```

---

### Backend Testing
- Jest is used as the testing framework  
- Supertest is used to test API endpoints and validate request/response behavior  
- Tests cover authentication, resources, events, organizations, volunteers, and admin functionality  

Run backend unit tests:
```
cd backend
npm test
```

---

### End-to-End Integration Testing
- Cypress is used to simulate real user workflows across the application  
- Tests validate key features such as:
  - Organization registration and approval  
  - Volunteer signup and management  
  - Event attendance  
  - Availability and scheduling  
  - Resource filtering (including map-based distance filtering)  

Run Cypress tests:
```
cd allies-connect
npm run cypress:run
```

---

## Database

Database files are located in the `database/` folder:

- `schema.sql` – database schema  
- `seed.sql` – seed data  

---

## Deployment Notes

See `Server_Setup.md` for server configuration and deployment steps.

---

## Project Context

This project was developed as part of a Kennesaw State University capstone project for Allies Way, Inc.

---

## Team

- Molly Calhoun  
- Takeshia Banks  
- David Castro  
- Ryan Hanrahan  
- Tarik Davis  

---

## License

MIT License included in the LICENSE file in the repository.
