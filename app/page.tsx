"use client";

import { Button, Card, CardBody, CardHeader, Tabs, Tab, Image } from "@nextui-org/react";
import { SignedOut, SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

const features = [
  {
    title: "Browse Job Postings",
    description: "Discover and explore job opportunities that are currently available",
    screenshot: {
      dark: "/screenshots/homefeature1.png",
      light: "/screenshots/homefeature1.png",
    }, // Place screenshot in public/screenshots/applications.webp
    details: [
      "Updated daily with the latest tech internship roles",
      "Open positions sourced from the community and curated by the platform",
      "See job postings shared by others in the community, making it easier to find hidden opportunities",
      "View when jobs were posted with 'New' tags for recent listings",
    ],
  },
  {
    title: "Track Applications",
    description: "Keep track of your job applications with detailed insights for each stage of the hiring process",
    screenshot: {
      dark: "/screenshots/homefeature1.png",
      light: "/screenshots/homefeature1.png",
    }, // Place screenshot in public/screenshots/applications.webp
    details: [
      "'Applied' tab: view response timelines: Check when you can expect the first response from a company after applying",
      "Filter by application status: Applied, Interviewing, Rejected, Ghosted, or Offered",
      "'Questions' tab: Engage with other applicants by asking or answering questions about the interview process.",
    ],
  },
  {
    title: "Online Assessment / Recorded Interview",
    description: "Share and learn from online assessment experiences to help others prepare",
    screenshot: {
      dark: "/screenshots/homefeature1.png",
      light: "/screenshots/homefeature1.png",
    }, // Place screenshot in public/screenshots/interviews.webp
    details: [
      `'Online Assessment' tab: View interview experience of applicants who have completed online assessments`,

      `Examples: Take home assignments, HackerRank, LeetCode, HireVue, recorded video questions, etc. (usually not with a human interviewer)`,

      `View interview date and whether / when others received their response`,
    ],
  },
  {
    title: "Interview Experiences",
    description: "Get insights into the interview processes shared by the community",
    screenshot: {
      dark: "/screenshots/homefeature1.png",
      light: "/screenshots/homefeature1.png",
    }, // Place screenshot in public/screenshots/company.webp
    details: [
      "Share and learn from interview experiences across different companies and roles",
      "Read detailed interview experiences by round",
      "View interview types and LeetCode questions",
      "Track company response timelines",
    ],
  },
];

const faqs = [
  {
    question: "How do I track a new job application?",
    answer: "Simply click on any job posting and use the 'Track this job' button. You can then add details about your application and track its progress through the interview process.",
  },
  {
    question: "Can I share my interview experience anonymously?",
    answer: "Yes! When adding an interview experience, you can choose to share it anonymously. Your identity will be protected while helping others prepare.",
  },
  {
    question: "What kind of interview information can I share?",
    answer: "You can share interview rounds, types (technical, behavioral), LeetCode questions, and general experience. Please avoid sharing confidential or proprietary information.",
  },
  {
    question: "How can I find specific company interviews?",
    answer: "Use the search function or browse companies directly. Each company page shows all related interview experiences and job postings.",
  },
];

export default function HomePage() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleFindJobs = () => {
    router.push("/jobs");
  };

  const handleFindCompanies = () => {
    router.push("/companies");
  };

  return (
    <div className="flex flex-col items-center gap-16 py-8 md:py-10">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-4 text-center">
        <motion.div animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
            Track Your Job Search
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">All in One Place</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-default-600">Organize your job applications, share interview experiences, and connect with a community of job seekers.</p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button color="default" size="lg" variant="faded" onClick={handleFindCompanies}>
              Find Companies
            </Button>
            <Button color="primary" size="lg" variant="bordered" onClick={handleFindJobs}>
              Find Jobs
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features with Screenshots Section */}
      <section className="w-full max-w-7xl px-6">
        <h2 className="mb-8 text-center text-3xl font-bold">Platform Features</h2>
        <Tabs aria-label="Features" className="flex w-full flex-col" color="primary" variant="bordered">
          {features.map((feature) => (
            <Tab key={feature.title} title={feature.title}>
              <Card className="mt-4">
                <CardBody className="flex flex-col gap-8 lg:flex-row">
                  <div className="flex-1">
                    <h3 className="mb-4 text-2xl font-semibold">{feature.title}</h3>
                    <p className="mb-6 text-default-600">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.details.map((detail, i) => (
                        <motion.li key={i} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2" initial={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.1 }}>
                          <span className="text-primary">•</span>
                          {detail}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1">
                    <Image alt={feature.title} className="rounded-lg object-cover shadow-lg" height={400} src={feature.screenshot[theme === "dark" ? "dark" : "light"]} width={600} />
                  </div>
                </CardBody>
              </Card>
            </Tab>
          ))}
        </Tabs>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl px-6">
        <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <motion.div key={index} animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: index * 0.1 }}>
              <Card>
                <CardHeader className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-primary">Q</span>
                  </div>
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-default-600">{faq.answer}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl px-6">
        <Card className="bg-gradient-to-r from-primary/20 to-secondary/20">
          <CardBody className="flex flex-col items-center gap-4 p-12 text-center">
            <h2 className="text-3xl font-bold">Ready to Start Your Journey?</h2>
            <p className="max-w-lg text-default-600">Join thousands of job seekers who are already using our platform to manage their job search process.</p>
            <SignedOut>
              <SignInButton mode="modal">
                <Button color="primary" size="lg" variant="shadow">
                  Get Started Now
                </Button>
              </SignInButton>
            </SignedOut>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
