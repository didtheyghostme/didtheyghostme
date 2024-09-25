type Note = {
  id?: number; // Optional for new entries
  title: string;
};

enum ApplicationStatus {
  APPLIED = "APPLIED",
  INTERVIEWING = "INTERVIEWING",
  REJECTED = "REJECTED",
  HIRED = "HIRED",
}

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
  created_at: string;
  closed_at: string | null;
  user_id: string;
  company_id: number;
};

type Application = {
  id: number;
  status: ApplicationStatus;
  created_at: string;
  job_posting_id: number;
  user_id: string;
};

type InterviewExperience = {
  id: number;
  round_no: number;
  difficulty: "Easy" | "Medium" | "Hard";
  created_at: string;
  application_id: number;
  user_id: string;
};
