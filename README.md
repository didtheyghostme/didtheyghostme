# didtheyghost.me - Job Tracking Platform

A community-driven platform that helps students and job seekers track their internship applications, share interview experiences, and discover tech opportunities in Singapore.

## Key Features

### 🎯 Track Applications

- Monitor your job applications across different stages
- View response timelines and track application status
- Filter applications by status: Applied, Interviewing, Rejected, Ghosted, or Offered

### 📝 Interview Insights

- Share and learn from online assessment experiences
- Access detailed interview experiences by round
- View interview types (Technical, Behavioral, HR) and LeetCode questions
- Track company response timelines

### 💼 Job Discovery

- Browse latest tech internship roles in Singapore
- Updated daily with new positions
- Community-sourced job postings
- Easy filtering by job type, location, and category

### 💬 Community Engagement

- Ask questions about specific job postings
- Engage with other applicants
- Share interview experiences
- Help others prepare for interviews

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started) - React framework with App Router
- [NextUI v2](https://nextui.org/) - Modern UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Clerk](https://clerk.com/) - Authentication
- [Supabase](https://supabase.com/) - Database
- [SWR](https://swr.vercel.app/) - Data fetching

## How to Use

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@nextui-org/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## License

Licensed under the [MIT license](https://github.com/nextui-org/next-app-template/blob/main/LICENSE).
