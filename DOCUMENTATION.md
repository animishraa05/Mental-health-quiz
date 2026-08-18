# System Documentation

This document provides a technical overview of the Mental Health and Learning Styles Assessment application, including data flow, scoring methodologies, and database structure.

## 1. System Architecture

The application follows a modern decoupled architecture:
*   Frontend: Next.js handles routing, state management, and UI rendering. The App Router paradigm is used for defining pages.
*   Backend (BaaS): Supabase handles database storage, authentication, and API endpoints via the Supabase Client SDK. The frontend communicates directly with the Supabase PostgreSQL database.
*   State Management: React's `useState` and `useEffect` hooks manage local component state, while browser `localStorage` is used to persist session tokens and quiz progress to allow seamless navigation across different assessments without requiring a registered user account.

## 2. Authentication Flow

### Anonymous User Flow
1.  A user lands on the registration page (`/app/page.tsx`).
2.  They fill out their demographic information (Name, Email, Age, Gender, City, Course, Semester).
3.  Upon submission, the data is inserted into the `users` table.
4.  A unique session is generated and inserted into the `quiz_sessions` table, linked to the newly created user ID.
5.  Session keys (`quiz_user_id`, `quiz_session_id`, `quiz_session_token`) are stored in the browser's local storage.
6.  The user is redirected to the first quiz.

### Admin Authentication
1.  Administrators navigate to `/admin/login`.
2.  They authenticate using Supabase Auth (email and password).
3.  A secondary check is performed against the `admin_users` table to verify administrative privileges.
4.  If successful, a secure session is established and they are redirected to the protected `/admin` dashboard.
5.  The admin dashboard verifies the auth state on load and will eject unauthorized users back to the login screen.

## 3. Quiz Methodologies and Scoring

The application implements three specific psychological frameworks:

### VAK Learning Style Assessment
*   Format: Multiple-choice questions.
*   Logic: Determines whether a user prefers Visual (V), Auditory (A), or Kinesthetic (K) learning.
*   Scoring: Responses are tallied based on their associated letter. The highest score dictates the dominant learning style. In the event of a tie, multiple dominant styles can be returned.

### Emotional Intelligence (EI) Evaluation
*   Format: Likert scale (1 to 5).
*   Logic: Assesses self-awareness, self-regulation, motivation, empathy, and social skills.
*   Scoring: The values selected (1-5) are aggregated to provide a total EI score, which falls into predefined categories (e.g., Needs Improvement, Average, High).

### Representational System Preference Test
*   Format: Rank-order questions (1 to 4).
*   Logic: Identifies preference among Visual, Auditory, Kinesthetic, and Auditory Digital processing systems.
*   Scoring: Users rank statements from 1 (most descriptive) to 4 (least descriptive). The system with the lowest total score is identified as the dominant representational system.

## 4. Database Schema Overview

The Supabase PostgreSQL database consists of several interconnected tables:

*   `users`: Stores demographic information provided during initial onboarding.
*   `quiz_sessions`: Tracks the lifecycle of a user's quiz attempt, including boolean flags for the completion of each individual module (`vak_completed`, `ei_completed`, `rep_system_completed`).
*   `vak_responses`, `ei_responses`, `rep_system_responses`: Granular tables that store the exact answers provided for every single question, enabling deep analytics.
*   `vak_results`, `ei_results`, `rep_system_results`: Tables that store the calculated final scores and dominant traits for each module.
*   `comprehensive_quiz_export`: A SQL View that joins user demographics with their completion status and scores, optimized for the Admin Dashboard's data export functionality.

## 5. Security Considerations

*   Row Level Security (RLS): Supabase RLS policies must be configured to ensure anonymous users can only insert records and cannot perform `SELECT` queries on other users' data.
*   Input Validation: All forms utilize standard validation techniques to ensure required fields are present and data formats (like emails) are correct before hitting the database.
*   Admin Protection: The `/admin` route explicitly queries the authentication state and verifies `admin_users` table inclusion before fetching any aggregate data.
