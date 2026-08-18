# Mental Health and Learning Styles Assessment

This application provides a comprehensive suite of psychological and learning style assessments designed to help individuals understand their cognitive preferences and emotional intelligence. The platform is built for seamless anonymous participation while providing robust administrative tools for data analysis.

## Features

*   Comprehensive Assessments: Three distinct assessments are included:
    *   Visual-Auditory-Kinesthetic (VAK) Learning Style Assessment
    *   Emotional Intelligence (EI) Evaluation
    *   Representational System Preference Test
*   Frictionless Onboarding: Users can participate anonymously by providing basic demographic information without the need for complex account creation or passwords.
*   Persistent Sessions: Progress is saved locally, allowing users to navigate between quizzes without losing their state.
*   Admin Dashboard: A secure, authenticated dashboard for administrators to view, filter, and analyze participation metrics.
*   Data Export: Administrators can export filtered datasets as CSV files for further analysis.
*   Modern Interface: A responsive, accessible, and carefully designed user interface powered by Next.js and Tailwind CSS.

## Architecture and Technology Stack

*   Frontend Framework: Next.js (App Router)
*   Language: TypeScript
*   Styling: Tailwind CSS
*   UI Components: shadcn/ui (Radix UI primitives)
*   Backend Database: Supabase (PostgreSQL)
*   Form Handling: React Hook Form with Zod validation
*   Icons: Lucide React

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   pnpm package manager
*   A Supabase project instance

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your_username/mental-health-quiz.git
    cd mental-health-quiz
    ```

2.  Install dependencies using pnpm:
    ```bash
    pnpm install
    ```

3.  Configure Environment Variables:
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    Note: Never commit your `.env.local` file to version control.

4.  Database Setup:
    Ensure your Supabase PostgreSQL database is configured with the correct tables, views, and Row Level Security (RLS) policies.

5.  Start the Development Server:
    ```bash
    pnpm dev
    ```
    The application will be available at http://localhost:3000.

## Project Structure Overview

*   `/app`: Contains all Next.js routes, including the main landing page, quiz interfaces, and the admin dashboard.
*   `/components`: Reusable UI components, including the shadcn/ui library components and quiz question data.
*   `/lib`: Core utility functions, including the Supabase client initialization, authentication helpers, and scoring algorithms.
*   `/public`: Static assets like images and fonts.

## Additional Documentation

For a deeper dive into the system architecture, database schema, and scoring methodologies, please refer to the DOCUMENTATION.md file included in this repository.
