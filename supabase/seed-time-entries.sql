-- ============================================================
-- COMPLETE SEED DATA
-- Urutan: clients → projects → tasks → timesheets → time_entries
-- Jalankan di Supabase SQL Editor (role: postgres)
-- ============================================================

-- Ambil organization_id secara otomatis
-- (ganti jika ada lebih dari satu organisasi)
DO $$
DECLARE
  v_org_id    INTEGER;
  v_member_id INTEGER;
  v_client1   INTEGER;
  v_client2   INTEGER;
  v_proj1     INTEGER;
  v_proj2     INTEGER;
  v_proj3     INTEGER;
  v_task1     INTEGER;
  v_task2     INTEGER;
  v_task3     INTEGER;
  v_ts_id     INTEGER;
  v_status_id INTEGER;
BEGIN

  -- Ambil org pertama
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  -- Ambil member pertama
  SELECT id INTO v_member_id FROM organization_members WHERE organization_id = v_org_id LIMIT 1;
  -- Ambil status task pertama
  SELECT id INTO v_status_id FROM task_statuses LIMIT 1;

  RAISE NOTICE 'org_id=%, member_id=%, status_id=%', v_org_id, v_member_id, v_status_id;

  -- ──────────────────────────────────────────────────────────
  -- 1. CLIENTS
  -- ──────────────────────────────────────────────────────────
  INSERT INTO clients (organization_id, name, email, status)
  VALUES (v_org_id, 'Patricia Design Co', 'patricia@example.com', 'active')
  RETURNING id INTO v_client1;

  INSERT INTO clients (organization_id, name, email, status)
  VALUES (v_org_id, 'Tech Corp', 'contact@techcorp.com', 'active')
  RETURNING id INTO v_client2;

  RAISE NOTICE 'client1=%, client2=%', v_client1, v_client2;

  -- ──────────────────────────────────────────────────────────
  -- 2. PROJECTS
  -- ──────────────────────────────────────────────────────────
  INSERT INTO projects (organization_id, code, name, client_id, status, is_billable, color_code)
  VALUES (v_org_id, 'WR-001', 'Website Redesign', v_client1, 'active', true, '#3B82F6')
  RETURNING id INTO v_proj1;

  INSERT INTO projects (organization_id, code, name, client_id, status, is_billable, color_code)
  VALUES (v_org_id, 'MA-001', 'Mobile App Development', v_client2, 'active', true, '#10B981')
  RETURNING id INTO v_proj2;

  INSERT INTO projects (organization_id, code, name, client_id, status, is_billable, color_code)
  VALUES (v_org_id, 'MC-001', 'Marketing Campaign', v_client1, 'active', false, '#F59E0B')
  RETURNING id INTO v_proj3;

  RAISE NOTICE 'proj1=%, proj2=%, proj3=%', v_proj1, v_proj2, v_proj3;

  -- ──────────────────────────────────────────────────────────
  -- 3. TASKS
  -- ──────────────────────────────────────────────────────────
  INSERT INTO tasks (project_id, name, priority, status_id, position_in_column)
  VALUES (v_proj1, 'Design Homepage Concept', 'high', v_status_id, 1)
  RETURNING id INTO v_task1;

  INSERT INTO tasks (project_id, name, priority, status_id, position_in_column)
  VALUES (v_proj2, 'Prototype Mobile Flow', 'medium', v_status_id, 1)
  RETURNING id INTO v_task2;

  INSERT INTO tasks (project_id, name, priority, status_id, position_in_column)
  VALUES (v_proj3, 'Create Campaign Brief', 'low', v_status_id, 1)
  RETURNING id INTO v_task3;

  RAISE NOTICE 'task1=%, task2=%, task3=%', v_task1, v_task2, v_task3;

  -- ──────────────────────────────────────────────────────────
  -- 4. TIMESHEET (periode bulan ini)
  -- ──────────────────────────────────────────────────────────
  INSERT INTO timesheets (
    organization_member_id,
    start_date,
    end_date,
    status,
    total_tracked_seconds,
    total_manual_seconds
  ) VALUES (
    v_member_id,
    DATE_TRUNC('month', CURRENT_DATE)::date,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
    'open',
    21600,   -- 6 jam total
    14400    -- 4 jam manual
  )
  RETURNING id INTO v_ts_id;

  RAISE NOTICE 'timesheet_id=%', v_ts_id;

  -- ──────────────────────────────────────────────────────────
  -- 5. TIME ENTRIES
  -- ──────────────────────────────────────────────────────────

  -- Entry 1: Desktop tracked, project Website Redesign, task Design Homepage
  INSERT INTO time_entries (
    organization_member_id, project_id, task_id, timesheet_id,
    entry_date, starts_at, stops_at,
    duration_seconds, focus_seconds, idle_seconds,
    source, time_type, notes, is_billable
  ) VALUES (
    v_member_id, v_proj1, v_task1, v_ts_id,
    CURRENT_DATE,
    (CURRENT_DATE || ' 09:00:00+07')::timestamptz,
    (CURRENT_DATE || ' 11:00:00+07')::timestamptz,
    7200, 4680, 0,       -- 2 jam, activity 65%
    'desktop_app', 'tracked', 'Morning design session', true
  );

  -- Entry 2: Manual, project Mobile App
  INSERT INTO time_entries (
    organization_member_id, project_id, task_id, timesheet_id,
    entry_date, starts_at, stops_at,
    duration_seconds, focus_seconds, idle_seconds,
    source, time_type, notes, is_billable
  ) VALUES (
    v_member_id, v_proj2, v_task2, v_ts_id,
    CURRENT_DATE,
    (CURRENT_DATE || ' 13:00:00+07')::timestamptz,
    (CURRENT_DATE || ' 17:00:00+07')::timestamptz,
    14400, 0, 0,
    'api', 'manual', 'Manual entry - forgot to track', true
  );

  RAISE NOTICE 'Done! 2 clients, 3 projects, 3 tasks, 1 timesheet, 2 time_entries inserted.';

END $$;


-- ──────────────────────────────────────────────────────────
-- VERIFIKASI
-- ──────────────────────────────────────────────────────────
SELECT 'clients'     AS tabel, COUNT(*) FROM clients     UNION ALL
SELECT 'projects'    AS tabel, COUNT(*) FROM projects    UNION ALL
SELECT 'tasks'       AS tabel, COUNT(*) FROM tasks       UNION ALL
SELECT 'timesheets'  AS tabel, COUNT(*) FROM timesheets  UNION ALL
SELECT 'time_entries'AS tabel, COUNT(*) FROM time_entries;
