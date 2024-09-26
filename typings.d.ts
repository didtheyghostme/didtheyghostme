type Note = {
  id?: number; // Optional for new entries
  title: string;
};

type Company = {
  id: number; // Optional for new entries
  company_name: string;
  company_url: string;
  created_at: string;
  user_id: string;
  status?: string;
};

type JobPosting = {
  id: number;
  title: string;
  country: string;
  url: string | null;
  created_at: string;
  closed_at: string | null;
  user_id: string;
  company_id: number;
};

type ApplicationStatus = "Applied" | "Interviewing" | "Rejected" | "Hired" | "Ghosted" | "Offer";

type Application = {
  id: number;
  status: ApplicationStatus; // default start with APPLIED
  applied_at: string;
  first_response_at: string | null;
  created_at: string;
  user_id: string;
  job_posting_id: number;
};

type InterviewExperience = {
  id: number;
  round_no: number;
  difficulty: "Easy" | "Medium" | "Hard";
  created_at: string;
  user_id: string;
  application_id: number;
};
