-- Outcome Tracking Dashboard - Seed Data
-- This file contains realistic demo data to showcase the full functionality of the app
-- Run with: npx supabase db reset (which will run migrations and then seed.sql)

-- ============================================
-- OUTCOMES (5 total)
-- ============================================

-- Outcome 1: Customer Retention (Org level, Active, 65% progress)
INSERT INTO outcomes (id, title, description, status, progress, metrics, cascade_alignment, level, parent_outcome_id, created_at)
VALUES (
  1,
  'Increase Customer Retention by 15%',
  'Improve overall customer retention rate from 72% to 87% by end of Q4. Focus on reducing churn in the first 90 days and increasing engagement with power users.',
  'Active',
  65,
  '{"current_retention_rate": 79.3, "target_retention_rate": 87, "baseline_retention_rate": 72, "monthly_churn_rate": 2.1, "nps_score": 42}',
  ARRAY['HowToWin', 'Capabilities']::cascade_alignment[],
  'Org',
  NULL,
  NOW() - INTERVAL '45 days'
);

-- Outcome 2: Mobile App Launch (Departmental, Active, 40% progress)
INSERT INTO outcomes (id, title, description, status, progress, metrics, cascade_alignment, level, parent_outcome_id, created_at)
VALUES (
  2,
  'Launch Mobile App v2.0',
  'Complete redesign and launch of mobile application with improved UX, offline capabilities, and performance optimizations. Target: 4.5+ star rating on app stores.',
  'Active',
  40,
  '{"target_rating": 4.5, "current_beta_rating": 4.2, "performance_score": 78, "crash_free_rate": 99.2, "features_completed": 12, "features_total": 28}',
  ARRAY['WhereToPlay', 'HowToWin']::cascade_alignment[],
  'Departmental',
  NULL,
  NOW() - INTERVAL '60 days'
);

-- Outcome 3: Support Ticket Resolution (Departmental, Active, 80% progress)
INSERT INTO outcomes (id, title, description, status, progress, metrics, cascade_alignment, level, parent_outcome_id, created_at)
VALUES (
  3,
  'Reduce Support Ticket Resolution Time',
  'Decrease average ticket resolution time from 48 hours to 12 hours while maintaining customer satisfaction above 90%. Implement automation and self-service tools.',
  'Active',
  80,
  '{"baseline_resolution_hours": 48, "current_resolution_hours": 16.5, "target_resolution_hours": 12, "csat_score": 92, "first_response_time_hours": 1.2, "tickets_per_day": 245}',
  ARRAY['Capabilities', 'ManagementSystems']::cascade_alignment[],
  'Departmental',
  NULL,
  NOW() - INTERVAL '90 days'
);

-- Outcome 4: European Expansion (Org level, Stalled, 25% progress)
INSERT INTO outcomes (id, title, description, status, progress, metrics, cascade_alignment, level, parent_outcome_id, created_at)
VALUES (
  4,
  'Expand to European Market',
  'Launch operations in key European markets (UK, Germany, France) with localized product offerings, compliance with GDPR, and local payment methods.',
  'Stalled',
  25,
  '{"target_markets": ["UK", "Germany", "France"], "gdpr_compliance": 85, "localization_complete": 40, "payment_integrations": 2, "legal_setup_status": "in_progress"}',
  ARRAY['WinningAspiration', 'WhereToPlay']::cascade_alignment[],
  'Org',
  NULL,
  NOW() - INTERVAL '120 days'
);

-- Outcome 5: Data Analytics Platform (Departmental, Completed, 100% progress)
INSERT INTO outcomes (id, title, description, status, progress, metrics, cascade_alignment, level, parent_outcome_id, created_at)
VALUES (
  5,
  'Implement Data Analytics Platform',
  'Deploy comprehensive data analytics platform with real-time dashboards, self-service reporting, and predictive analytics capabilities for all departments.',
  'Completed',
  100,
  '{"dashboards_created": 24, "active_users": 156, "queries_per_day": 1250, "data_sources_integrated": 12, "report_generation_time_seconds": 3.2}',
  ARRAY['Capabilities']::cascade_alignment[],
  'Departmental',
  NULL,
  NOW() - INTERVAL '180 days'
);

-- Reset sequence for outcomes
SELECT setval('outcomes_id_seq', 5);

-- ============================================
-- EXPERIMENTS
-- ============================================

-- Experiments for Outcome 1: Customer Retention
INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  1,
  1,
  'A/B Test Onboarding Flow',
  'InProgress',
  70,
  '{"sample_size": 5000, "test_duration_days": 30, "variants": ["control", "streamlined", "gamified"]}',
  '{"user_segment": "new_signups", "regions": ["US", "Canada"], "platforms": ["web", "mobile"]}',
  'Test three variations of the onboarding flow to identify which approach leads to highest 30-day retention. Control: existing 7-step flow. Variant A: Streamlined 4-step flow. Variant B: Gamified flow with progress rewards.',
  NOW() - INTERVAL '21 days'
);

INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  2,
  1,
  'Loyalty Program Pilot',
  'InProgress',
  45,
  '{"pilot_users": 1000, "reward_tiers": 3, "budget": 25000}',
  '{"user_segment": "power_users", "min_account_age_days": 90, "regions": ["US"]}',
  'Launch pilot loyalty program with tiered rewards based on usage and engagement. Track impact on retention, upsells, and referrals over 60-day period.',
  NOW() - INTERVAL '14 days'
);

INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  3,
  1,
  'Churn Prediction Model',
  'Done',
  100,
  '{"model_type": "gradient_boosting", "features": 47, "training_data_months": 18}',
  '{"prediction_horizon_days": 30, "minimum_confidence": 0.75}',
  'Build ML model to predict customer churn 30 days in advance. Use historical behavior, engagement metrics, and support interactions as features. Deploy for proactive outreach.',
  NOW() - INTERVAL '35 days'
);

-- Experiments for Outcome 2: Mobile App Launch
INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  4,
  2,
  'Beta Testing Program',
  'InProgress',
  60,
  '{"beta_users": 500, "feedback_channels": ["in_app", "email", "discord"], "build_frequency": "weekly"}',
  '{"platforms": ["iOS", "Android"], "min_os_versions": {"ios": "15.0", "android": "11"}}',
  'Run structured beta program with 500 power users. Collect feedback on new features, performance, and stability. Iterate based on findings before public launch.',
  NOW() - INTERVAL '28 days'
);

INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  5,
  2,
  'Performance Optimization Sprint',
  'Backlog',
  0,
  '{"target_app_size_mb": 35, "target_cold_start_ms": 1500, "target_memory_mb": 150}',
  '{"platforms": ["iOS", "Android"], "priority_screens": ["home", "feed", "profile"]}',
  'Two-week sprint focused on app performance. Reduce app size by 30%, improve cold start time to under 1.5s, and reduce memory footprint. Profile and optimize critical paths.',
  NOW() - INTERVAL '7 days'
);

-- Experiments for Outcome 3: Support Ticket Resolution
INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  6,
  3,
  'AI Chatbot Implementation',
  'InProgress',
  85,
  '{"model": "gpt-4-turbo", "knowledge_base_articles": 450, "fallback_threshold": 0.7}',
  '{"channels": ["web_chat", "mobile_app"], "languages": ["en", "es"], "ticket_categories": ["billing", "technical", "general"]}',
  'Deploy AI-powered chatbot for first-line support. Handle common queries automatically, collect context for complex issues, and seamlessly escalate to human agents when needed.',
  NOW() - INTERVAL '42 days'
);

INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  7,
  3,
  'Knowledge Base Revamp',
  'Done',
  100,
  '{"articles_reviewed": 320, "new_articles": 85, "video_tutorials": 24}',
  '{"categories": ["getting_started", "troubleshooting", "integrations", "billing"], "formats": ["text", "video", "interactive"]}',
  'Complete overhaul of customer-facing knowledge base. Update outdated articles, add video tutorials, implement better search, and create interactive troubleshooting guides.',
  NOW() - INTERVAL '56 days'
);

-- Experiments for Outcome 4: European Expansion (even though stalled)
INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  8,
  4,
  'UK Market Research',
  'Done',
  100,
  '{"survey_respondents": 1200, "competitor_analysis_depth": "comprehensive", "focus_groups": 8}',
  '{"regions": ["London", "Manchester", "Birmingham"], "segments": ["SMB", "Enterprise"]}',
  'Comprehensive market research for UK launch. Understand local competition, pricing expectations, feature requirements, and go-to-market channels.',
  NOW() - INTERVAL '90 days'
);

INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  9,
  4,
  'GDPR Compliance Audit',
  'InProgress',
  60,
  '{"audit_firm": "DataProtect EU", "data_categories_reviewed": 15}',
  '{"regulations": ["GDPR", "ePrivacy"], "systems": ["core_platform", "analytics", "marketing"]}',
  'External audit of all systems for GDPR compliance. Identify gaps, implement required changes, document data processing activities, and prepare for certification.',
  NOW() - INTERVAL '75 days'
);

-- Experiments for Outcome 5: Data Analytics (Completed)
INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  10,
  5,
  'Data Warehouse Migration',
  'Done',
  100,
  '{"source_systems": 8, "data_volume_tb": 12, "migration_windows": 4}',
  '{"target_platform": "Snowflake", "retention_years": 7}',
  'Migrate from legacy data warehouse to Snowflake. Ensure zero data loss, maintain historical data integrity, and improve query performance by 10x.',
  NOW() - INTERVAL '150 days'
);

INSERT INTO experiments (id, outcome_id, title, status, progress, inputs, scope, spec, created_at)
VALUES (
  11,
  5,
  'Self-Service BI Rollout',
  'Done',
  100,
  '{"training_sessions": 12, "power_users_trained": 45, "dashboard_templates": 15}',
  '{"departments": ["Sales", "Marketing", "Product", "Finance"], "tool": "Looker"}',
  'Roll out self-service BI capabilities to all departments. Train power users, create starter templates, establish governance framework, and set up support channels.',
  NOW() - INTERVAL '120 days'
);

-- Reset sequence for experiments
SELECT setval('experiments_id_seq', 11);

-- ============================================
-- TASKS
-- ============================================

-- Tasks for Experiment 1: A/B Test Onboarding Flow
INSERT INTO tasks (id, experiment_id, title, description, assignee, due_date, status)
VALUES
  (1, 1, 'Design mockups for streamlined flow', 'Create high-fidelity mockups for the 4-step streamlined onboarding variant', 2, NOW() + INTERVAL '3 days', 'Done'),
  (2, 1, 'Implement variant A frontend', 'Build React components for streamlined onboarding flow', 3, NOW() + INTERVAL '7 days', 'Done'),
  (3, 1, 'Set up A/B testing infrastructure', 'Configure feature flags and analytics tracking for the test', 3, NOW() + INTERVAL '5 days', 'Done'),
  (4, 1, 'Implement gamified flow animations', 'Add Lottie animations and progress indicators for variant B', 2, NOW() + INTERVAL '10 days', 'InProgress'),
  (5, 1, 'Analyze interim results', 'Review 2-week data and prepare preliminary findings report', 4, NOW() + INTERVAL '14 days', 'Backlog');

-- Tasks for Experiment 2: Loyalty Program Pilot
INSERT INTO tasks (id, experiment_id, title, description, assignee, due_date, status)
VALUES
  (6, 2, 'Design reward tier structure', 'Define benefits, thresholds, and mechanics for each loyalty tier', 1, NOW() - INTERVAL '5 days', 'Done'),
  (7, 2, 'Build points tracking system', 'Implement backend service to track and calculate user points', 3, NOW() + INTERVAL '5 days', 'InProgress'),
  (8, 2, 'Create loyalty dashboard UI', 'Design and implement user-facing loyalty status dashboard', 2, NOW() + INTERVAL '12 days', 'InProgress'),
  (9, 2, 'Set up reward fulfillment', 'Integrate with gift card and discount code providers', 5, NOW() + INTERVAL '20 days', 'Backlog'),
  (10, 2, 'Draft pilot communication plan', 'Create email templates and in-app notifications for pilot users', 4, NULL, 'Backlog');

-- Tasks for Experiment 3: Churn Prediction Model (Done)
INSERT INTO tasks (id, experiment_id, title, description, assignee, due_date, status)
VALUES
  (11, 3, 'Extract and clean training data', 'Prepare 18 months of historical data for model training', 5, NOW() - INTERVAL '30 days', 'Done'),
  (12, 3, 'Feature engineering', 'Create and validate 47 predictive features from raw data', 5, NOW() - INTERVAL '25 days', 'Done'),
  (13, 3, 'Train and validate model', 'Train gradient boosting model with cross-validation', 5, NOW() - INTERVAL '20 days', 'Done'),
  (14, 3, 'Deploy prediction pipeline', 'Set up automated daily scoring pipeline in production', 3, NOW() - INTERVAL '15 days', 'Done');

-- Tasks for Experiment 4: Beta Testing Program
INSERT INTO tasks (id, experiment_id, title, description, assignee, due_date, status)
VALUES
  (15, 4, 'Recruit beta testers', 'Identify and onboard 500 power users for beta program', 4, NOW() - INTERVAL '14 days', 'Done'),
  (16, 4, 'Set up feedback collection', 'Configure in-app feedback widget and Discord channel', 2, NOW() - INTERVAL '10 days', 'Done'),
  (17, 4, 'Weekly build release process', 'Establish CI/CD pipeline for weekly beta releases', 3, NOW() - INTERVAL '7 days', 'Done'),
  (18, 4, 'Triage and prioritize feedback', 'Review week 2 feedback and update backlog priorities', 1, NOW() + INTERVAL '3 days', 'InProgress'),
  (19, 4, 'Prepare beta summary report', 'Compile insights and recommendations from beta program', 4, NOW() + INTERVAL '21 days', 'Backlog');

-- Tasks for Experiment 5: Performance Optimization Sprint
INSERT INTO tasks (id, experiment_id, title, description, assignee, due_date, status)
VALUES
  (20, 5, 'Profile app startup sequence', 'Use profiling tools to identify cold start bottlenecks', 3, NULL, 'Backlog'),
  (21, 5, 'Audit and remove unused assets', 'Identify and remove unused images, fonts, and libraries', 2, NULL, 'Backlog'),
  (22, 5, 'Implement lazy loading', 'Add lazy loading for non-critical screens and components', 3, NULL, 'Backlog'),
  (23, 5, 'Optimize image compression', 'Implement WebP format and responsive image loading', 2, NULL, 'Backlog');

-- Tasks for Experiment 6: AI Chatbot Implementation
INSERT INTO tasks (id, experiment_id, title, description, assignee, due_date, status)
VALUES
  (24, 6, 'Curate knowledge base content', 'Select and format 450 articles for chatbot training', 4, NOW() - INTERVAL '28 days', 'Done'),
  (25, 6, 'Implement chat UI component', 'Build responsive chat widget for web and mobile', 2, NOW() - INTERVAL '21 days', 'Done'),
  (26, 6, 'Set up LLM integration', 'Configure GPT-4 API with custom system prompts', 3, NOW() - INTERVAL '14 days', 'Done'),
  (27, 6, 'Build escalation workflow', 'Implement seamless handoff to human agents', 3, NOW() + INTERVAL '5 days', 'InProgress'),
  (28, 6, 'Monitor and tune responses', 'Review chatbot interactions and adjust prompts', 4, NOW() + INTERVAL '14 days', 'Backlog');

-- Tasks for Experiment 7: Knowledge Base Revamp (Done)
INSERT INTO tasks (id, experiment_id, title, description, assignee, due_date, status)
VALUES
  (29, 7, 'Audit existing articles', 'Review all 320 articles for accuracy and relevance', 4, NOW() - INTERVAL '45 days', 'Done'),
  (30, 7, 'Rewrite outdated content', 'Update articles flagged during audit', 4, NOW() - INTERVAL '35 days', 'Done'),
  (31, 7, 'Record video tutorials', 'Produce 24 video tutorials for common workflows', 2, NOW() - INTERVAL '25 days', 'Done'),
  (32, 7, 'Implement new search', 'Deploy Algolia-powered search with typo tolerance', 3, NOW() - INTERVAL '20 days', 'Done');

-- Tasks for Experiment 8: UK Market Research (Done)
INSERT INTO tasks (id, experiment_id, title, description, assignee, due_date, status)
VALUES
  (33, 8, 'Design survey questionnaire', 'Create comprehensive market research survey', 1, NOW() - INTERVAL '80 days', 'Done'),
  (34, 8, 'Conduct competitor analysis', 'Analyze top 10 UK competitors on features and pricing', 1, NOW() - INTERVAL '70 days', 'Done'),
  (35, 8, 'Run focus groups', 'Facilitate 8 focus group sessions across UK regions', 4, NOW() - INTERVAL '60 days', 'Done');

-- Tasks for Experiment 9: GDPR Compliance Audit
INSERT INTO tasks (id, experiment_id, title, description, assignee, due_date, status)
VALUES
  (36, 9, 'Complete data inventory', 'Document all personal data categories and processing activities', 5, NOW() - INTERVAL '30 days', 'Done'),
  (37, 9, 'Review consent mechanisms', 'Audit and update all consent collection flows', 3, NOW() + INTERVAL '7 days', 'InProgress'),
  (38, 9, 'Implement data portability', 'Build user data export functionality', 3, NOW() + INTERVAL '21 days', 'Backlog'),
  (39, 9, 'Update privacy policies', 'Revise privacy policy with legal team review', 1, NOW() + INTERVAL '14 days', 'Backlog');

-- Reset sequence for tasks
SELECT setval('tasks_id_seq', 39);

-- ============================================
-- RACI ASSIGNMENTS
-- ============================================

-- RACI for Outcomes
-- Outcome 1: Customer Retention
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (1, 'Outcome', 'Accountable', 1),
  (1, 'Outcome', 'Responsible', 3),
  (1, 'Outcome', 'Consulted', 4),
  (1, 'Outcome', 'Informed', 5);

-- Outcome 2: Mobile App Launch
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (2, 'Outcome', 'Accountable', 2),
  (2, 'Outcome', 'Responsible', 3),
  (2, 'Outcome', 'Consulted', 1),
  (2, 'Outcome', 'Support', 5);

-- Outcome 3: Support Ticket Resolution
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (3, 'Outcome', 'Accountable', 4),
  (3, 'Outcome', 'Responsible', 4),
  (3, 'Outcome', 'Support', 3),
  (3, 'Outcome', 'Informed', 1);

-- Outcome 4: European Expansion
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (4, 'Outcome', 'Accountable', 1),
  (4, 'Outcome', 'Responsible', 1),
  (4, 'Outcome', 'Consulted', 5),
  (4, 'Outcome', 'Informed', 2);

-- Outcome 5: Data Analytics Platform
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (5, 'Outcome', 'Accountable', 5),
  (5, 'Outcome', 'Responsible', 5),
  (5, 'Outcome', 'Consulted', 3);

-- RACI for Experiments
-- Experiment 1: A/B Test Onboarding
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (1, 'Experiment', 'Responsible', 3),
  (1, 'Experiment', 'Accountable', 1),
  (1, 'Experiment', 'Support', 2);

-- Experiment 2: Loyalty Program
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (2, 'Experiment', 'Responsible', 4),
  (2, 'Experiment', 'Accountable', 1),
  (2, 'Experiment', 'Support', 3);

-- Experiment 4: Beta Testing
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (4, 'Experiment', 'Responsible', 2),
  (4, 'Experiment', 'Accountable', 2),
  (4, 'Experiment', 'Support', 4);

-- Experiment 6: AI Chatbot
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (6, 'Experiment', 'Responsible', 3),
  (6, 'Experiment', 'Accountable', 4),
  (6, 'Experiment', 'Consulted', 5);

-- Experiment 9: GDPR Compliance
INSERT INTO raci (entity_id, entity_type, role, user_id) VALUES
  (9, 'Experiment', 'Responsible', 5),
  (9, 'Experiment', 'Accountable', 1),
  (9, 'Experiment', 'Consulted', 3);

-- ============================================
-- ANALYSIS
-- ============================================

-- Analysis for Outcome 1: Customer Retention
INSERT INTO analysis (entity_id, entity_type, current_state, process_breakdown, solutions)
VALUES (
  1,
  'Outcome',
  '{"findings": ["High churn rate in first 30 days (28%)", "Power users have 3x better retention", "Email engagement correlates with retention", "Mobile users churn 15% less than web-only", "Support ticket creators have 40% higher churn"], "data_sources": ["Amplitude", "Mixpanel", "Zendesk", "Stripe"], "analysis_date": "2026-01-15"}',
  '{"steps": [{"name": "Signup", "conversion": 100, "drop_off": 0}, {"name": "Onboarding Start", "conversion": 85, "drop_off": 15}, {"name": "Onboarding Complete", "conversion": 62, "drop_off": 23}, {"name": "First Value Action", "conversion": 48, "drop_off": 14}, {"name": "Day 7 Active", "conversion": 41, "drop_off": 7}, {"name": "Day 30 Active", "conversion": 32, "drop_off": 9}], "bottleneck": "Onboarding Complete"}',
  '{"quick_wins": ["Simplify onboarding to 4 steps", "Add progress indicator", "Send day 3 re-engagement email", "Offer live chat during onboarding"], "systemic_fixes": ["Build personalized onboarding paths", "Implement in-app guidance system", "Create mobile-first onboarding", "Develop churn prediction model for proactive outreach"]}'
);

-- Analysis for Outcome 3: Support Ticket Resolution
INSERT INTO analysis (entity_id, entity_type, current_state, process_breakdown, solutions)
VALUES (
  3,
  'Outcome',
  '{"findings": ["60% of tickets are repeat questions", "Billing issues take longest to resolve", "First response time is good (1.2h)", "Knowledge base search has 45% bounce rate", "Tier 2 escalations increased 20%"], "data_sources": ["Zendesk", "Intercom", "Internal KB Analytics"], "analysis_date": "2026-01-20"}',
  '{"steps": [{"name": "Ticket Created", "avg_time_hours": 0}, {"name": "First Response", "avg_time_hours": 1.2}, {"name": "Initial Triage", "avg_time_hours": 2.5}, {"name": "Investigation", "avg_time_hours": 8}, {"name": "Resolution Proposed", "avg_time_hours": 12}, {"name": "Customer Confirmed", "avg_time_hours": 16.5}], "bottleneck": "Investigation"}',
  '{"quick_wins": ["Deploy FAQ chatbot for common questions", "Add billing self-service portal", "Improve KB search relevance", "Create video troubleshooting guides"], "systemic_fixes": ["Implement AI-powered ticket routing", "Build integrated knowledge base with chatbot", "Create customer health scoring", "Develop proactive support alerts"]}'
);

-- Analysis for Experiment 6: AI Chatbot Implementation
INSERT INTO analysis (entity_id, entity_type, current_state, process_breakdown, solutions)
VALUES (
  6,
  'Experiment',
  '{"findings": ["Chatbot handling 35% of incoming queries", "Resolution rate without human: 72%", "Average conversation length: 4.2 messages", "User satisfaction with bot: 4.1/5", "Peak usage hours: 9-11am, 2-4pm"], "data_sources": ["Intercom", "Custom Analytics", "User Surveys"], "analysis_date": "2026-01-28"}',
  '{"steps": [{"name": "User Initiates Chat", "success_rate": 100}, {"name": "Intent Recognition", "success_rate": 89}, {"name": "Knowledge Retrieval", "success_rate": 82}, {"name": "Response Generation", "success_rate": 95}, {"name": "User Satisfied", "success_rate": 72}], "bottleneck": "Knowledge Retrieval"}',
  '{"quick_wins": ["Add more billing FAQs to knowledge base", "Improve intent detection for edge cases", "Add quick-reply buttons for common followups", "Implement typing indicators"], "systemic_fixes": ["Build feedback loop for continuous learning", "Implement conversation memory across sessions", "Add multi-language support", "Create escalation prediction model"]}'
);

-- ============================================
-- AUDIT LOGS (Sample entries)
-- ============================================

INSERT INTO audit_logs (action, user_id, entity_id, timestamp) VALUES
  ('outcome_created', 1, 1, NOW() - INTERVAL '45 days'),
  ('outcome_created', 2, 2, NOW() - INTERVAL '60 days'),
  ('outcome_created', 4, 3, NOW() - INTERVAL '90 days'),
  ('outcome_created', 1, 4, NOW() - INTERVAL '120 days'),
  ('outcome_created', 5, 5, NOW() - INTERVAL '180 days'),
  ('experiment_created', 3, 1, NOW() - INTERVAL '21 days'),
  ('experiment_created', 4, 2, NOW() - INTERVAL '14 days'),
  ('experiment_status_changed', 5, 3, NOW() - INTERVAL '10 days'),
  ('outcome_progress_updated', 1, 1, NOW() - INTERVAL '7 days'),
  ('experiment_status_changed', 3, 7, NOW() - INTERVAL '5 days'),
  ('outcome_status_changed', 5, 5, NOW() - INTERVAL '3 days'),
  ('task_completed', 3, 1, NOW() - INTERVAL '2 days'),
  ('analysis_updated', 4, 3, NOW() - INTERVAL '1 day'),
  ('experiment_progress_updated', 3, 6, NOW() - INTERVAL '12 hours');
