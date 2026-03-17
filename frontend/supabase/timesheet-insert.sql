-- SQL to add data to both timesheets (approvals) and time_entries (time logs)
-- Updated based on your database screenshot

-- ==========================================
-- STEP 0: Find your organization_member_id
-- ==========================================
SELECT 
    om.id as organization_member_id,
    up.display_name,
    up.email
FROM organization_members om
JOIN user_profiles up ON om.user_id = up.id
WHERE up.email = 'user@example.com'; -- Replace with the member's email


-- ==========================================
-- OPTION 1: Step-by-Step (Manual)
-- ==========================================

-- 1. Create the parent timesheet period first
INSERT INTO timesheets (
    organization_member_id, 
    start_date, 
    end_date, 
    status,
    total_billable_seconds,
    total_tracked_seconds
) VALUES (
    1319,            -- Using your actual organization_member_id
    '2026-02-01', 
    '2026-02-28', 
    'open',
    0, 
    0
) RETURNING id; -- Note down this ID (e.g., 1)


-- 2. Add an actual time entry linked to that timesheet
-- Using the Correct Table Name: time_entries
INSERT INTO time_entries (
    timesheet_id, 
    organization_member_id, 
    project_id,
    task_id,
    entry_date, 
    starts_at, 
    stops_at, 
    duration_seconds, 
    time_type,       -- Added from your screenshot
    source, 
    notes,
    is_billable,
    is_paid,         -- Added from your screenshot
    is_locked        -- Added from your screenshot
) VALUES (
    1,               -- The ID from step 1
    1319, 
    17, 
    1, 
    '2026-02-10', 
    '2026-02-10 09:00:00+07', 
    '2026-02-10 17:00:00+07', 
    28800, 
    'work',          -- time_type example
    'web',           -- Changed from 'manual' to 'web' to satisfy chk_time_entry_source
    'Initial research and setup',
    true,
    false,
    false
);


-- ==========================================
-- OPTION 2: Single Execution (Using CTE)
-- ==========================================

WITH new_ts AS (
    INSERT INTO timesheets (organization_member_id, start_date, end_date, status)
    VALUES (1319, '2026-03-01', '2026-03-31', 'open')
    RETURNING id, organization_member_id
)
INSERT INTO time_entries (
    timesheet_id, 
    organization_member_id, 
    entry_date, 
    starts_at, 
    stops_at, 
    duration_seconds, 
    time_type,
    source, 
    notes
)
SELECT 
    id, 
    organization_member_id, 
    '2026-03-05', 
    '2026-03-05 08:30:00+07', 
    '2026-03-05 12:00:00+07', 
    12600, 
    'work',
    'web',           -- Changed from 'manual' to 'web'
    'Project documentation'
FROM new_ts;
