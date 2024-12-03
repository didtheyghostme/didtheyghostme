-- Insert job categories into job_category table
INSERT INTO "public"."job_category" ("id", "job_category_name", "created_at") 
VALUES 
  ('23895806-d4a9-4154-80e6-b3a47d9cf5f8', 'Other', '2024-12-03 06:27:15.194642+00'),
  ('37d90cfd-de33-4443-9055-b7e0901d6074', 'Tech', '2024-12-03 06:22:28.976491+00'),
  ('d5000f87-1f9a-455c-bec4-b0ae422df0b0', 'Quant', '2024-12-03 06:25:03.209902+00'),
  ('ee495f2e-6764-4b00-943f-67e2b53761d7', 'Product Management', '2024-12-03 06:23:39.808743+00')
ON CONFLICT (job_category_name) DO NOTHING;


-- Insert Tech category into job_posting_job_category table for all job_postings
INSERT INTO job_posting_job_category (job_posting_id, job_category_id)
SELECT jp.id, jc.id
FROM job_posting jp
JOIN job_category jc ON jc.job_category_name = 'Tech'
WHERE NOT EXISTS (
    SELECT 1
    FROM job_posting_job_category jpc
    WHERE jpc.job_posting_id = jp.id AND jpc.job_category_id = jc.id
);