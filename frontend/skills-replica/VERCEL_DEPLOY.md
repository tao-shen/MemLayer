# Deploying Skills Replica to Vercel

This guide explains how to deploy the `frontend/skills-replica` application to Vercel.

## Prerequisites

- A Vercel account ([vercel.com](https://vercel.com/))
- Access to this GitHub repository

## Steps

### 1. Import Project

1.  Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Find your `MemLayer` (or `TacitLayer`) repository in the list and click **"Import"**.

### 2. Configure Project

You will see a "Configure Project" screen. Make the following settings:

*   **Project Name:** `skills-replica` (or any name you prefer)
*   **Framework Preset:** `Vite` (Vercel should detect this automatically, but double-check)
*   **Root Directory:**
    *   Click **"Edit"** next to Root Directory.
    *   Select `frontend/skills-replica`.
    *   Click **"Continue"**.

### 3. Environment Variables

Expand the **"Environment Variables"** section and add the following variables. You can find these values in your local `.env` file or from your Supabase project settings.

| Key | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | *Your Supabase Project URL* |
| `VITE_SUPABASE_ANON_KEY` | *Your Supabase Anon Key* |

> [!NOTE]
> Ensure you copy the values exactly as they appear in your `.env` file or Supabase dashboard.

### 4. Deploy

1.  Click **"Deploy"**.
2.  Wait for the build and deployment to complete.
3.  Once finished, you will be redirected to the success page with a screenshot of your app.

## Verifying the Deployment

1.  Click the **"Visit"** button to open your deployed app.
2.  Navigate through the app (e.g., try to open a chat or different page) to ensure client-side routing works. The `vercel.json` file we added ensures that refreshing pages on sub-routes works correctly.
