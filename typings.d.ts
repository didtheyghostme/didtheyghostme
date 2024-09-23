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
  status?: string;
  user_id?: string;
};

type JobPosting = {
  id: number;
  company_id: number;
  title: string;
  created_at: string;
  user_id?: string;
};

type Application = {
  id: number;
  job_posting_id: number;
  user_id: number;
  status: ApplicationStatus;
  created_at: string;
};

type InterviewExperience = {
  id: string;
  application_id: string;
  round_no: number;
  created_at: string;
};
