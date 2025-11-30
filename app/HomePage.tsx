"use client";

import { Card, CardBody, Tabs, Tab, AccordionItem, Accordion, Link, Spinner, Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import mixpanel from "mixpanel-browser";
import React, { useState } from "react";
import Image from "next/image";

import { CustomButton } from "@/components/CustomButton";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { GithubIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { useGithubStars } from "@/lib/hooks/useGithubStars";
import { ShimmerButton } from "@/components/ShimmerButton";

type Screenshot = {
  desktop: {
    dark: string;
    light: string;
  };
  mobile: {
    dark: string;
    light: string;
  };
};

type BaseFeature = {
  title: string;
  description: string;
  details: string[];
};

type LoomFeature = BaseFeature & {
  type: "loom";
  loomEmbed: string;
  screenshot?: never;
};

type ScreenshotFeature = BaseFeature & {
  type: "screenshot";
  screenshot: Screenshot;
  loomEmbed?: never;
};

type Feature = LoomFeature | ScreenshotFeature;

// TODO: replace screenshots with actual screenshots
const FEATURES: readonly Feature[] = [
  {
    type: "loom",
    title: "Track Applications",
    description: "Keep track of your job applications with detailed insights for each stage of the hiring process",
    loomEmbed: `https://www.loom.com/embed/31d70974d4cc4a45a4ec11d76cc40e61?sid=120ee916-e8e4-46fa-995f-dc80d69d3f62`,
    details: [
      "'Applied' tab: The first stage, view response timelines: check when you can expect the first response date from a company after applying",
      "Filter by application status: Applied, Interviewing, Rejected, Ghosted, or Offered",
      "'Questions' tab: Engage with other applicants by asking or answering questions about the interview process.",
    ],
  },
  {
    type: "screenshot",
    title: "Online Assessment / Recorded Interview",
    description: "Share and learn from online assessment experiences to help others prepare",
    screenshot: {
      desktop: {
        dark: "/screenshots/homefeature1_desktopdark.png",
        light: "/screenshots/homefeature1_desktoplight.png",
      },
      mobile: {
        dark: "/screenshots/homefeature1_mobiledark.png",
        light: "/screenshots/homefeature1_mobilelight.png",
      },
    }, // Place screenshot in public/screenshots/interviews.webp
    details: [
      `'Online Assessment' tab: View interview experience of applicants who have completed online assessments`,

      `Examples: Take home assignments, HackerRank, LeetCode, HireVue, recorded video questions, etc. (usually not with a human interviewer)`,

      `View interview date and whether or when others received their response`,
    ],
  },
  {
    type: "screenshot",
    title: "Interview Experiences",
    description: "Get insights into the interview processes shared by the community",
    screenshot: {
      desktop: {
        dark: "/screenshots/homefeature2_desktopdark.png",
        light: "/screenshots/homefeature2_desktoplight.png",
      },
      mobile: {
        dark: "/screenshots/homefeature2_mobiledark.png",
        light: "/screenshots/homefeature2_mobilelight.png",
      },
    }, // Place screenshot in public/screenshots/company.webp
    details: [
      "Share and learn from interview experiences across different companies and roles",
      "Read detailed interview experiences by round",
      "View interview types (Online Assessment, Technical, Behavioral, HR/Hiring Manager, Final Round) and LeetCode questions",
      "Track company response timelines to better plan your job search",
    ],
  },
  {
    type: "screenshot",
    title: "Browse jobs",
    description: "Discover and explore job opportunities that are currently available",
    screenshot: {
      desktop: {
        dark: "/screenshots/homefeature3_desktopdark.png",
        light: "/screenshots/homefeature3_desktoplight.png",
      },
      mobile: {
        dark: "/screenshots/homefeature3_mobiledark.png",
        light: "/screenshots/homefeature3_mobilelight.png",
      },
    }, // Place screenshot in public/screenshots/applications.webp
    details: [
      "Updated daily with the latest tech internship roles in Singapore",
      "Open positions sourced from the community and curated by the platform",
      "See job postings shared by others in the community, making it easier to find hidden opportunities",
      "View when jobs were posted with 'New' tags for recent listings",
    ],
  },
];

type Faq = {
  question: string;
  answer: string | React.ReactNode;
};

const FAQS: readonly Faq[] = [
  {
    question: "Who is this for and what is this platform about?",
    answer: (
      <>
        <p className="mb-4">This platform is designed for anyone applying for internships or jobs, especially in Singapore. It&apos;s for you if you&apos;ve ever wondered:</p>
        <ul className="mb-6 ml-4 space-y-2">
          <li>• How long does it usually take to get a response after applying?</li>
          <li>• What can I expect in Company X&apos;s Online Assessments?</li>
          <li>• Has anyone gone through Company X&apos;s interview process? What was it like?</li>
          <li>• Has anyone heard back from Company X after round X?</li>
          <li>• What are the current tech internship postings in Singapore?</li>
        </ul>

        <h4 className="mb-2 text-lg font-bold">Default Job Filters</h4>
        <p className="mb-2">On the jobs page, the default filters have been set to:</p>
        <ul className="mb-4 ml-4 space-y-1">
          <li>• Country: Singapore</li>
          <li>• Job Type: Internship</li>
          <li>• Job Category: Tech</li>
        </ul>
        <p className="mb-6">
          If you&apos;re searching for roles in other countries, or for different job types such as Fresh Grad positions or fields like Product Management, you can easily adjust the filters to suit
          your preferences.
        </p>

        <h4 className="mb-2 text-lg font-bold">A Community-Driven Platform</h4>
        <p className="mb-3">
          The success of this platform depends on contributions from the community. The more users share their experiences, the more helpful the platform becomes. If you find this platform useful,
          share it with your friends, classmates, and colleagues! Together, we can:
        </p>
        <ul className="ml-4 space-y-1">
          <li>• Get real interview insights and timeline expectations</li>
          <li>• Make the job search process more transparent by uncovering opportunities others may not know about</li>
          <li>• Support one another throughout the application process</li>
        </ul>
      </>
    ),
  },

  {
    question: "How do I track a new job application?",
    answer: `Simply click on any job posting and use the 'Track this job' button. If the job posting or company is not in our database, you can add it.\n
    By contributing, you can monitor the progress of your applications and compare your status with others applying for the same role.\n
    Our platform is community-driven, so we rely on contributions from users like you to keep our database up-to-date.`,
  },
  {
    question: "How do I figure out what interview rounds / types / questions were asked?",
    answer: `In the job posting page, there are 4 tabs: 
    Applied, Online Assessment, Interview Experience, and Questions.\n
    • "The 'Applied' tab shows the dates when other applicants submitted their applications and when they received their first response from the company (excluding automated replies).\n
    • The 'Online Assessment' tab shows interview experiences of applicants who have completed online assessments.\n
    • The 'Interview Experience' tab shows the detailed interview experiences of other applicants.\n
    • The 'Questions' tab allows you to ask and start discussions with others about that job posting.`,
  },
  {
    question: "What kind of interview information can I share?",
    answer: `You can share interview rounds, types (technical, behavioral), LeetCode questions, and general experience.\n
    Please avoid sharing confidential or proprietary information.`,
  },
  {
    question: "How do I know when do companies begin and end their hiring process?",
    answer: `Under each company's profile on our platform, the current job openings will be listed. \n
    You can report if the position have been closed and after we have verified, the end date will be that.`,
  },
  {
    question: "Have I been ghosted?",
    answer: `A good guideline is 1 - 2 weeks if there is no response. A lot of companies won't bother with rejection emails. \n
    If you suspect you've been ghosted, you can use our platform to check if others have received responses from the same employer. \n
    This information can help you decide whether to follow up with the employer or move on to other opportunities.`,
  },
  {
    question: "I have more questions or feedback to share. Who can I contact?",
    answer: (
      <>
        <p className="mb-4">We&apos;d love to hear from you! Whether you want to share your feedback, ideas for features, or have any questions - we&apos;re here to help.</p>
        <ul className="ml-4 space-y-2">
          <li>
            • Visit our{" "}
            <Link className="text-primary" href="/contact">
              contact page
            </Link>{" "}
            to get in touch with our support team
          </li>
        </ul>
      </>
    ),
  },
];

function LoomFeature({ feature, isMobile }: { feature: LoomFeature; isMobile: boolean }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-lg shadow-lg"
      style={{
        paddingBottom: isMobile ? "75%" : "60%",
        height: 0,
      }}
    >
      {!iframeLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-default-100/50">
          <Spinner color="primary" />
        </div>
      )}
      <iframe allowFullScreen className="absolute left-0 top-0 h-full w-full border-0" src={feature.loomEmbed} title={feature.title} onLoad={() => setIframeLoaded(true)} />
    </div>
  );
}

function ScreenshotFeature({ feature, isMobile, theme }: { feature: ScreenshotFeature; isMobile: boolean; theme: string | undefined }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setTimeout(() => {
      setImageLoaded(true);
    }, 150);
  };

  return (
    <div className="relative w-full max-w-[600px]">
      <Skeleton className="rounded-lg" isLoaded={imageLoaded}>
        <Image
          alt={feature.title}
          className="h-auto w-full rounded-lg object-contain shadow-lg"
          height={400}
          loading="lazy"
          src={feature.screenshot[isMobile ? "mobile" : "desktop"][theme === "dark" ? "dark" : "light"]}
          width={600}
          onLoad={handleImageLoad}
        />
      </Skeleton>
    </div>
  );
}

export function HomePage() {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { githubStars, isLoading: githubLoading } = useGithubStars();

  const [selectedTab, setSelectedTab] = useState<string>("Track Applications");

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const mixpanelTrackFindJobsButtonClick = () => {
    mixpanel.track("Find Jobs Button Clicked home hero section");
  };

  const mixpanelTrackFindCompaniesButtonClick = () => {
    mixpanel.track("Find Companies Button Clicked home hero section");
  };

  const handleTabChange = (tabName: React.Key) => {
    setSelectedTab(String(tabName));
    mixpanel.track("Home Page Features Tab Changed", {
      action: "changed",
      tab: tabName,
    });
  };

  const handleFaqSelectionChange = (faqTitle: string) => {
    const isOpen = selectedKeys.has(faqTitle);

    mixpanel.track("Home Page FAQ Item Selected", {
      faq_title: faqTitle,
      opening_tab: isOpen ? true : false,
      closing_tab: isOpen ? false : true,
    });
  };

  const handleGithubClick = () => {
    mixpanel.track("Github Link Clicked", {
      action: "hero_banner",
    });
  };

  return (
    <div className="flex flex-col items-center gap-16 pb-12 md:py-10">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-4 text-center">
        <motion.div animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
          <div className="mx-auto mb-2">
            <ShimmerButton
              isExternal
              as={Link}
              borderRadius="9999px"
              className="gap-2 py-2.5 pl-5 pr-4 text-sm font-medium"
              href={siteConfig.githubRepoUrl}
              shimmerColor="rgba(0, 172, 255, 0.8)"
              shimmerDuration="2s"
              onPress={handleGithubClick}
            >
              <div className="flex items-center gap-2">
                <div className="relative h-2 w-2">
                  <div className="absolute h-2 w-2 animate-ping rounded-full bg-[#0AC8FF] opacity-75" />
                  <div className="relative h-2 w-2 rounded-full bg-[#0AC8FF]" />
                </div>
                <span className="hidden sm:inline">We&apos;re open source! Check it out</span>
                <span className="inline sm:hidden">We&apos;re open source!</span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-white">
                <GithubIcon className="h-4 w-4" />
                <span className="text-xs font-medium">{githubLoading ? "" : githubStars}</span>
                <svg className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
            </ShimmerButton>
          </div>

          <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
            Track Your Job Search
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">All in One Place</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-default-600">Organize your job applications, share interview experiences, and connect with a community of job seekers.</p>

          <div className="flex flex-wrap justify-center gap-4">
            <CustomButton
              as={Link}
              className="transition ease-in-out hover:scale-[1.02] hover:bg-default-100"
              color="default"
              href="/companies"
              size="lg"
              variant="bordered"
              onPress={mixpanelTrackFindCompaniesButtonClick}
            >
              Find Companies
            </CustomButton>
            <CustomButton
              as={Link}
              className="transition ease-in-out hover:scale-[1.02] hover:bg-primary/20"
              color="primary"
              href="/jobs"
              size="lg"
              variant="bordered"
              onPress={mixpanelTrackFindJobsButtonClick}
            >
              Find Jobs
            </CustomButton>
          </div>
        </motion.div>
      </section>

      {/* Features with Screenshots Section */}
      <section className="w-full max-w-7xl">
        <h2 className="mb-8 text-center text-3xl font-bold">Platform Features</h2>
        <Tabs aria-label="Features" className="flex w-full flex-col" color="primary" selectedKey={selectedTab} variant="bordered" onSelectionChange={handleTabChange}>
          {FEATURES.map((feature) => (
            <Tab key={feature.title} title={feature.title}>
              <Card className="mt-4">
                <CardBody className="flex flex-col-reverse gap-8 lg:flex-row">
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
                  <div className="w-full flex-1">
                    {feature.type === "loom" ? <LoomFeature feature={feature} isMobile={isMobile} /> : <ScreenshotFeature feature={feature} isMobile={isMobile} theme={theme} />}
                  </div>
                </CardBody>
              </Card>
            </Tab>
          ))}
        </Tabs>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl">
        <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
          <Accordion selectedKeys={selectedKeys} selectionMode="multiple" variant="bordered" onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}>
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={index}
                aria-label={faq.question}
                title={faq.question}
                classNames={{
                  title: "text-lg font-semibold",
                  content: "text-default-600",
                }}
                startContent={
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-primary">Q</span>
                  </div>
                }
                onPress={() => handleFaqSelectionChange(faq.question)}
              >
                {typeof faq.answer === "string" ? <p className="whitespace-pre-line">{faq.answer}</p> : faq.answer}
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>
    </div>
  );
}
