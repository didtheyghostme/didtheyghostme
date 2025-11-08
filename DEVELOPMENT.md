# Development Guide

This document explains how to run the project locally with **Supabase** and **Clerk**.


## 1. Prerequisites

- **Node.js** and **npm**
- A **Supabase** account and project
- A **Clerk** account and application


## 2. Clone & install

Clone the project:

```bash
git clone <ENTER_PROJECT_URL>
```

Ensure you're using the correct Node.js version, using [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm use # Uses the version specified in .nvmrc
```
Install dependencies:

```bash
npm ci
```

## 3. Environment variables

Ensure you have the `.env` file in the root directory. You can copy the `.env.example` file and rename it to `.env`

> [!IMPORTANT]
> Replace all the `ENTER_YOUR_KEY` values with your API keys

```bash
cp .env.example .env
```

## 4. Supabase setup
Follow these steps to link your local project to your Supabase database and apply migrations. ([Supabase docs](https://supabase.com/docs/guides/local-development))

### 4.1 Install Supabase CLI

```bash
npm install supabase --save-dev
```

### 4.2 Login to Supabase CLI

```bash
npx supabase login
```
This will open a browser window to authenticate.

### 4.3 Link your local Supabase project

```
npx supabase link --project-ref $PROEJCT_ID
```

You can get `$PROJECT_ID` from your project's dashboard URL: `https://supabase.com/dashboard/project/$PROJECT_ID`

### 4.4 Verify linked project

```bash
npx supabase projects list
```
You should see all your projects in the list, and one of them is the linked project from step 4.3.

### 4.5 Push local migrations to database

```bash
npx supabase db push
```

This runs everything in `supabase/migrations` against your remote database. Check **Table Editor** in the Supabase dashboard to confirm database tables are created correctly.




## 5. Clerk setup (JWT Template)

Reference: [Supabase x Clerk docs](https://supabase.com/partners/integrations/clerk#:~:text=5%3A%20Create%20a%20Supabase%20JWT%20template)

- In Clerk Dashboard -> **Configure** -> **JWT Templates**

- Click **Add new template**, then choose **Supabase**

- Enter **Name** field: `supabase`

- Under **Signing Key**, paste your Supabase JWT secret from Supabase dashboard -> **Project Settings** -> **JWT Keys** -> **Legacy JWT Secret**

This allows Clerk to issue Supabase-compatible JWTs for authenticated requests and Row Level Security.



## 6. Syncing users into Supabase

You need user rows in the `user_data` table after signing up, with the same `user_id` as in Clerk. This ensures all database actions (queries, inserts, updates protected by RLS) can correctly associate requests with the authenticated user.

To sync user creation and updates from Clerk to Supabase locally, you have two options:

**Option 1 - Manual (simple and quick):**

- In **Clerk dashboard -> Users**, copy a user's `user_id`
- Go to **Supabase Dashboard -> Table Editor -> user_data**
- Insert a new row with
  - the copied `user_id`
  - any other required fields


**Option 2 - Webhooks (more advanced, require extra installation):**
- Expose your local dev server with ngrok ([docs](https://ngrok.com/docs/integrations/webhooks/clerk-webhooks))
- In Clerk dashboard -> **Configure -> Webhooks** for `user.created` / `user.updated` / `user.deleted`

Either option should result in a row being created in Supabase `user_data` table whenever a user sign up.


After completing these steps, you should be able to sign up or log in and successfully create a company from the `/companies` page.



---

> [!TIP]
> Below are some optional commands that you might need during development

Reset local db completely: drops and recreates db, re-applies migrations, then run `supabase/seed.sql` if present:

```bash
npx supabase db reset
```

Get schema changes from remote database, which will create `<time_stamp>_remote_schema.sql` in `supabase/migrations` folder docs:

```bash
npx supabase db pull
```

