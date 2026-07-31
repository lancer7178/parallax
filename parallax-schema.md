# parallax - Digital Agency Workspace Documentation

## 1. Overview
A cloud-based (SaaS) platform tailored for managing internal operations of a digital agency. The platform aims to centralize client communication, manage software and design projects, and track the team's daily tasks within a single, seamless dashboard.

---

## 2. Tech Stack

### Frontend & UI/UX
* **Framework:** Next.js (App Router) for high performance and fast routing.
* **Language:** TypeScript to ensure code quality and type safety.
* **Styling:** Tailwind CSS for rapid and responsive UI development.
* **UI Components:** Shadcn UI and Radix UI for accessible, highly customizable components.
* **Data Visualization:** Recharts for rendering financial and project statistics.

### Backend & Database
* **Server Logic:** Next.js Server Actions & Route Handlers.
* **Database:** PostgreSQL hosted on Neon (leveraging built-in connection pooling and fast response times).
* **ORM:** Prisma for database schema modeling and type-safe queries.
* **Authentication:** NextAuth.js (Auth.js) for session management and role-based access control.

---

## 3. Core Features

1. **Client Portal:** A dedicated interface for clients to track project progress, view invoices, review designs, and leave feedback.
2. **Task Management (Kanban Board):** An interactive drag-and-drop board to track task statuses (To Do, In Progress, In Review, Done).
3. **Financial Dashboard:** A visual tracking system for agency revenue, pending invoices, and project billable hours.
4. **Role-Based Access Control (RBAC):** A strict permission system separating views for Admins, Developers, Designers, and Clients.

---

## 4. Database Schema (Prisma)

This is the complete database schema, covering users, projects, tasks, and invoices to ensure both operational and financial tracking.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- Enums ---

enum Role {
  ADMIN
  DEVELOPER
  DESIGNER
  CLIENT
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  IN_REVIEW
  COMPLETED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
}

enum InvoiceStatus {
  DRAFT
  PENDING
  PAID
  OVERDUE
}

// --- Models ---

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String   // Hashed password if using Credentials provider
  role      Role     @default(CLIENT)
  avatarUrl String?  
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  clientProjects  Project[] @relation("ClientProjects")
  assignedTasks   Task[]    @relation("AssignedTasks")
}

model Project {
  id          String        @id @default(uuid())
  title       String
  description String?
  status      ProjectStatus @default(PLANNING)
  deadline    DateTime?     
  budget      Float?        // Allocated budget for the project
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  clientId    String
  client      User          @relation("ClientProjects", fields: [clientId], references: [id])
  
  tasks       Task[]
  invoices    Invoice[]
}

model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Int        @default(1) // 1: Low, 2: Medium, 3: High
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  projectId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)

  assigneeId  String?
  assignee    User?      @relation("AssignedTasks", fields: [assigneeId], references: [id])
}

model Invoice {
  id          String        @id @default(uuid())
  amount      Float         // Invoice total amount
  status      InvoiceStatus @default(DRAFT)
  dueDate     DateTime      
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  projectId   String
  project     Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
}