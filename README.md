# SplitLedger Backend 💸

SplitLedger Backend is the REST API server for SplitLedger, a full-stack expense management application that helps groups track shared expenses and settle debts.

The backend handles business logic, database operations, user authorization, group management, expenses, payments, and balance calculations.

## Features

- User synchronization with Supabase Auth.
- Group creation and management.
- Group membership management.
- User invitations.
- Project-based expense organization.
- Expense tracking.
- Payment tracking.
- Automatic balance calculation.
- Debt settlement logic to determine who owes whom.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Supabase (Authentication & Database)
- REST APIs

## Database Structure

Main tables:

- Users
- Groups
- Group Members
- Invitations
- Projects
- Expenses
- Payments

## Purpose

Built as the backend foundation of SplitLedger, providing APIs and business logic for managing shared expenses and simplifying group debt settlement.
