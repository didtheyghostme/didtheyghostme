type BaseUser = {
  user_id: string;
};

type ClerkUserProfileData = {
  // add other user fields in future, like name, profile pic, etc.
  full_name: string;
  profile_pic_url: string;
};

type JoinedUser = {
  user_data: ClerkUserProfileData; // user refer to the database table user, referenced by DBTable.USER_DATA
};

// user settings? default Singapore

// type User = BaseUser & ClerkUserProfileData;

// Supabase database tables
type CompanyTable = {
  id: string;
  company_name: string; // todo: rename to name
  company_url: string;
  logo_url: string;
  created_at: string;
} & BaseUser;

type JobStatus = "Pending" | "Verified" | "Closed" | "Rejected" | "No URL"; // default start with "No URL" or "Pending"

type JobPostingTable = {
  id: string;
  title: string;
  url: string | null;
  closed_date: string | null;
  company_id: string;
  job_status: JobStatus;
  job_posted_date: string | null; // for admin to set date, show new on UI if set
  job_url_linkedin: string | null;
  created_at: string;
  updated_at: string; // for updated date when url is posted? should there be a input field for people to update url?
} & BaseUser;

type JobCategoryName = "Tech" | "Product Management" | "Quant" | "Other";

type JobCategoryTable = {
  id: string;
  job_category_name: JobCategoryName;
  created_at: string;
};

type JobPostingJobCategoryTable = {
  id: string;
  job_posting_id: string;
  job_category_id: string;
  created_at: string;
};

type CountryTable = {
  id: string;
  country_name: string;
  created_at: string;
};

type JobPostingCountryTable = {
  id: string;
  job_posting_id: string;
  country_id: string;
  created_at: string;
};

type ExperienceLevel = "Internship" | "New Grad" | "Junior" | "Mid Level" | "Senior";

type ExperienceLevelTable = {
  id: string;
  experience_level: ExperienceLevel;
  created_at: string;
};

type JobPostingExperienceLevelTable = {
  id: string;
  job_posting_id: string;
  experience_level_id: string;
  created_at: string;
};

type StrictOmit<T, K extends keyof T> = Omit<T, K>;

type JobPostingChangelogTable = {
  id: string;
  job_posting_id: string;
  history: {
    [K in keyof StrictOmit<JobPostingTable, keyof BaseUser | "id" | "created_at" | "updated_at">]?: {
      old: JobPostingTable[K] | null;
      new: JobPostingTable[K] | null;
    };
  };
  handled_by: string;
  created_at: string;
  changelog_notes: string | null;
};

type ApplicationStatus = "Applied" | "Interviewing" | "Rejected" | "Ghosted" | "Offered";

type ApplicationTable = {
  id: string;
  status: ApplicationStatus; // default start with APPLIED
  applied_date: string;
  first_response_date: string | null;
  created_at: string;
  updated_at: string;
  job_posting_id: string;
} & BaseUser;

type InterviewTag = "Online Assessment" | "HR/Recruiter" | "Technical" | "Behavioral" | "Hiring Manager" | "Final Round";

type InterviewTagTable = {
  id: string;
  tag_name: InterviewTag;
  created_at: string;
};

type InterviewTagMappingTable = {
  id: string;
  interview_experience_id: string;
  interview_tag_id: string;
  created_at: string;
} & BaseUser;

type InterviewExperienceTable = {
  id: string;
  round_no: number;
  description: string;
  interview_date: string;
  response_date: string | null;
  created_at: string;
  updated_at: string;
  application_id: string;
} & BaseUser;

type LeetcodeDifficulty = "Easy" | "Medium" | "Hard";

type LeetcodeQuestionTable = {
  id: string;
  question_number: number;
  difficulty: LeetcodeDifficulty;
  leetcode_title: string;
  leetcode_url: string;
};

type InterviewExperienceLeetcodeQuestionTable = {
  id: string;
  interview_experience_id: string;
  leetcode_question_number: number;
  interview_experience_round_no: number;
  created_at: string;
} & BaseUser;

// Question is same table as CommentTable
type CommentEntityType = "job_posting" | "question" | "interview_experience";

type CommentTable = {
  id: string;
  content: string;
  entity_type: CommentEntityType;
  entity_id: string;
  created_at: string;
} & BaseUser;

type ReportEntityType = CommentEntityType | "contact_us";

type ContactType = "Bug Report" | "Feature Request" | "General Feedback" | "Data Issue";

type ReportJobPostingType = "Link Expired" | "Invalid Link" | "Suggest Link" | "Other";

type ReportAdminReportType = ReportJobPostingType | ContactType;

type ReportAdminTable = {
  id: string;
  entity_type: ReportEntityType;
  entity_id: string;
  report_type: ReportAdminReportType;
  report_message: string | null;
  report_status: "Pending" | "Rejected" | "Resolved"; // default Pending in DB
  created_at: string;
  resolution_notes: string | null;
  handled_by: string | null;
  handled_at: string | null;
} & BaseUser;

type UserPreferencesKey =
  | "default_countries"
  | "default_job_categories"
  | "default_experience_levels"
  | "insert_default_countries"
  | "insert_default_job_categories"
  | "insert_default_experience_levels";

type UserPreferencesTable = {
  id: string;
  preference_key: UserPreferencesKey;
  preference_value: string;
  created_at: string;
} & BaseUser;

// Utility Types (for insert)

type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

type GlobalGeneratedKeys = "id" | "created_at" | "updated_at";

type ExcludeGeneratedKeys<T> = Omit<T, NullableKeys<T> | GlobalGeneratedKeys | keyof ClerkUserProfileData>;

type InsertApplication = ExcludeGeneratedKeys<ApplicationTable>;

// Response types below

type WithCurrentUserFlag = {
  isCurrentUserItem: boolean;
};

type DataRequired = {
  id: string;
  user_id: string;
};

type ProcessedDataObject<T extends DataRequired> = Omit<T, "user_id"> & WithCurrentUserFlag;

// process to convert T[] to ProcessedData<T>, boolean if current user_id is in T[]
type ProcessedDataArray<T extends DataRequired> = {
  data: Array<ProcessedDataObject<T>>;
  currentUserItemId: string | null;
};

type JoinedApplication = ApplicationTable & JoinedUser;

type ProcessedApplication = ProcessedDataObject<JoinedApplication>;
type ProcessedApplications = ProcessedDataArray<JoinedApplication>;

type Company = CompanyTable;

type JobPosting = JobPostingTable;

// job posting country

type JobPostingCountryItem = {
  country: Pick<CountryTable, "id" | "country_name">;
};

type JobPostingCountry = {
  job_posting_country: JobPostingCountryItem;
};

type JobPostingCountryJoined = {
  job_posting_country: JobPostingCountryItem[];
};

// job posting experience level

type JobPostingExperienceLevelItem = {
  experience_level: Pick<ExperienceLevelTable, "id" | "experience_level">;
};

type JobPostingExperienceLevel = {
  job_posting_experience_level: JobPostingExperienceLevelItem;
};

type JobPostingExperienceLevelJoined = {
  job_posting_experience_level: JobPostingExperienceLevelItem[];
};

// job posting job category

type JobPostingJobCategoryItem = {
  job_category: Pick<JobCategoryTable, "id" | "job_category_name">;
};

type JobPostingJobCategory = {
  job_posting_job_category: JobPostingJobCategoryItem;
};

type JobPostingJobCategoryJoined = {
  job_posting_job_category: JobPostingJobCategoryItem[];
};
