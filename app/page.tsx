import { Metadata } from "next";

import { HomePage } from "./HomePage";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.name} | Singapore's Tech & Software Internship Tracker`,
  },
  description: `Discover the latest software and tech internships in Singapore. Track your job applications, share interview experiences, and stay updated on SG internship opportunities.`,
};

export default function Home() {
  return <HomePage />;
}
