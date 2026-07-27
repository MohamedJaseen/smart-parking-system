# Project Documentation: Smart Parking Management System (College Final Year Project)

This document contains the System Requirements Specification (SRS), Relational Database Schema, ER & Sequence Diagrams, and Installation Guides required for your final year college evaluation.

---

## 1. Software Requirements Specification (SRS)

### 1.1 Scope
The **Smart Parking Management System** is a responsive web application that streamlines vehicle slot reservation and management. The system is designed with a **Dual-Mode architecture**:
- **Mock Mode (Default):** Runs entirely client-side using `localStorage` as a mock DB, making it extremely easy to showcase and run on any presentation machine.
- **API Mode:** Integrates with a Java Spring Boot backend and PostgreSQL database, demonstrating enterprise full-stack development skills.

### 1.2 System Actors
1. **User (Driver / Vehicle Owner):**
   - Register an account, log in, manage vehicle details.
   - Search parking plazas, view live slot availability grids.
   - Reserves slots and pays simulated transactions.
   - Downloads/prints e-tickets containing a secure QR code.
   - Views history, cancels upcoming reservations.
2. **Admin (Facility Manager):**
   - Monitors general analytics dashboard (Revenue, users, parking rates, active bays).
   - Manages parking locations (Create, Read, Update, Delete).
   - Oversees bays/slots status (forces Maintenance status to block slot booking).
   - Validates tickets using the QR scanner verifier simulator.
   - Extracts business logs as CSV/Excel files and prints daily operations reports.

---

## 2. System Architecture

```mermaid
graph TD
    User([User Device]) -->|React Web App| FE[Vite / React Frontend]
    Admin([Admin Device]) -->|React Web App| FE
    
    subgraph Frontend Client
        FE --> Context[Auth & Booking Contexts]
        Context -->|localStorage DB| LocalDB[(Local Storage)]
        Context -->|Axios REST API| REST[API Client]
    end
    
    subgraph Full-Stack Backend
        REST -->|HTTP JSON / JWT| SB[Spring Boot REST Controllers]
        SB -->|Spring Security| Filters[JWT Filter & Spring Security]
        Filters --> Services[Services & Business Logic]
        Services --> JPA[Spring Data JPA Repositories]
        JPA --> DB[(PostgreSQL Database)]
    end
```

---

## 3. Database Design (ER Diagram)

The system relies on a PostgreSQL relational database. The diagram below illustrates the schema relationships:

```mermaid
erDiagram
    users ||--o{ user_roles : has
    roles ||--o{ user_roles : contains
    users ||--o{ vehicles : registers
    users ||--o{ bookings : reserves
    parking_locations ||--o{ parking_slots : holds
    parking_slots ||--o{ bookings : allocated_to
    bookings ||--|| payments : processes
    users ||--o{ notifications : receives

    users {
        varchar_50 id PK
        varchar_100 name
        varchar_100 email UK
        varchar_255 password_hash
        varchar_15 phone
        timestamp created_at
    }
    roles {
        serial id PK
        varchar_20 name UK
    }
    user_roles {
        varchar_50 user_id FK
        int role_id FK
    }
    vehicles {
        varchar_50 id PK
        varchar_50 user_id FK
        varchar_20 license_plate UK
        varchar_20 vehicle_type
        varchar_50 model_name
        timestamp created_at
    }
    parking_locations {
        varchar_50 id PK
        varchar_100 name
        varchar_255 address
        int total_slots
        int available_slots
        decimal hourly_rate
        decimal daily_rate
        decimal latitude
        decimal longitude
        timestamp created_at
    }
    parking_slots {
        varchar_50 id PK
        varchar_50 location_id FK
        varchar_10 slot_number
        varchar_20 vehicle_type
        varchar_20 status
    }
    bookings {
        varchar_50 id PK
        varchar_50 user_id FK
        varchar_50 location_id FK
        varchar_10 slot_number
        varchar_20 vehicle_type
        varchar_20 vehicle_number
        timestamp start_time
        timestamp end_time
        decimal amount
        varchar_20 status
        text qr_code_data
        timestamp created_at
    }
    payments {
        varchar_50 id PK
        varchar_50 booking_id FK, UK
        decimal amount
        varchar_20 method
        varchar_20 status
        varchar_100 transaction_id UK
        timestamp created_at
    }
    notifications {
        varchar_50 id PK
        varchar_50 user_id FK
        varchar_100 title
        text message
        varchar_30 type
        boolean is_read
        timestamp created_at
    }
```

---

## 4. Sequence Diagram: Slot Booking & Verification Flow

This sequence diagram explains how a booking transaction is processed and verified:

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    actor A as Admin
    participant FE as React Frontend
    participant SB as Spring Boot Backend
    participant DB as PostgreSQL Database

    U->>FE: Pick Location, Vehicle, and Slot (e.g. A1)
    FE->>FE: Calculate Total Fee
    U->>FE: Submit payment info (UPI / Card)
    FE->>SB: POST /api/v1/bookings (Booking & Payment Details)
    SB->>DB: Check slot availability status
    alt Slot is Available
        DB-->>SB: Slot status = Available
        SB->>DB: Save Booking & Payment Record
        SB->>DB: Update Slot status = 'occupied'
        SB->>DB: Decrement available_slots count
        SB->>SB: Generate ticket details & JSON QR Code
        SB-->>FE: Return 201 Created (Booking Details + QR Data)
        FE-->>U: Render Booking Confirmation with downloadable QR
    else Slot is Unavailable / Maintenance
        DB-->>SB: Slot status = maintenance
        SB-->>FE: Return 409 Conflict
        FE-->>U: Alert: "Selected Slot has already been booked"
    end

    Note over A, SB: Booking Verification Process
    A->>FE: Scan QR code or enter Booking ID (Admin console)
    FE->>SB: GET /api/v1/bookings/{id}
    SB->>DB: Query Database for reservation details
    DB-->>SB: Return Booking logs
    SB-->>FE: Return Booking details
    FE->>FE: Match time-slots & license plates
    FE-->>A: Visual feedback: "ACCESS GRANTED" / "TICKET EXPIRED"
```

---

## 5. Installation & Setup Guide

### 5.1 Prerequisites
- **Node.js** (v18+) & **npm**
- **Java SE Development Kit (JDK 17)**
- **Apache Maven**
- **PostgreSQL Database Server**

### 5.2 Frontend Setup (React)
1. Open terminal in the `project/` directory:
   ```bash
   npm install
   ```
2. Run the local development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
4. *Note:* By default, the application runs in **Mock Mode** using `localStorage` data. To switch to the database, open `src/config/api.ts` and set:
   ```typescript
   export const API_MODE = true;
   ```

### 5.3 Backend Setup (Spring Boot)
1. Open PostgreSQL Shell / Admin tool (pgAdmin) and create a database:
   ```sql
   CREATE DATABASE quickpark_db;
   ```
2. Navigate to the `project/backend/` folder.
3. Open `src/main/resources/application.properties` and verify your PostgreSQL credentials:
   ```properties
   spring.datasource.username=postgres
   spring.datasource.password=your_db_password
   ```
4. Build and compile the Spring Boot application using Maven:
   ```bash
   mvn clean install
   ```
5. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   The backend will boot up at `http://localhost:8080/api/v1` and auto-initialize the database using `schema.sql` and `data.sql`.
