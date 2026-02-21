-- ===========================================
-- SEED DATA FOR PEPPERBERRY FARM TASK BOARD
-- ===========================================
-- All PINs are hashed with pgcrypto crypt/bf
-- Test PINs listed in comments for dev use only

-- ===========================================
-- USERS
-- ===========================================

-- Admins (farm owners) — PIN: 1234
insert into public.users (id, name, pin_hash, role) values
  ('a1000000-0000-0000-0000-000000000001', 'Nick', crypt('1234', gen_salt('bf')), 'admin'),
  ('a1000000-0000-0000-0000-000000000002', 'Sarah', crypt('1234', gen_salt('bf')), 'admin');

-- Tradespeople — PIN: 5678
insert into public.users (id, name, pin_hash, role, trade_type) values
  ('b1000000-0000-0000-0000-000000000001', 'Dave the Fencer', crypt('5678', gen_salt('bf')), 'tradesperson', 'fencer'),
  ('b1000000-0000-0000-0000-000000000002', 'Mick the Plumber', crypt('5678', gen_salt('bf')), 'tradesperson', 'plumber'),
  ('b1000000-0000-0000-0000-000000000004', 'Jim', crypt('5678', gen_salt('bf')), 'tradesperson', 'handyman');

-- Riding school staff — PIN: 9012
insert into public.users (id, name, pin_hash, role) values
  ('c1000000-0000-0000-0000-000000000001', 'Emma', crypt('9012', gen_salt('bf')), 'riding_school'),
  ('c1000000-0000-0000-0000-000000000002', 'Lisa', crypt('9012', gen_salt('bf')), 'riding_school');

-- ===========================================
-- TASKS
-- ===========================================

-- 1. Fencing: Western paddock fence down after storm
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Repair fallen fence — Front paddock',
   'Three posts down along the northern boundary after last week''s storm. Wire is tangled and needs replacing for about 20m.',
   'todo', 'high', 'fencing', 'Front_paddock',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   current_date + interval '3 days');

-- 2. Fencing: Big paddock gate not closing
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Fix Big Paddock gate latch',
   'Gate latch is bent and won''t close properly. Horses could get out. Might need a new latch from the hardware store.',
   'in_progress', 'urgent', 'fencing', 'Big_Paddock',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   current_date);

-- 3. Plumbing: Leaking tap at workshop
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Fix leaking tap in workshop',
   'The outside tap on the eastern wall has been dripping constantly. Washer probably needs replacing.',
   'todo', 'medium', 'maintenance', 'workshop',
   'b1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000001',
   current_date + interval '7 days');

-- 4. Plumbing: Trough not filling
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Water trough not filling — Back paddock',
   'Float valve seems stuck. Trough is only half filling. Check the ball cock and replace if needed.',
   'todo', 'high', 'maintenance', 'Back_paddock',
   'b1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002',
   current_date + interval '2 days');

-- 5. Workshop lights flickering
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Workshop fluorescent lights flickering',
   'Two of the fluorescent tubes in the workshop are flickering badly. Might be the starters or the tubes themselves.',
   'todo', 'low', 'maintenance', 'workshop',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001',
   current_date + interval '14 days');

-- 6. Outdoor light at front gate
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Replace front gate security light',
   'The sensor light at the front gate has stopped working. Might be the sensor or the bulb. Check wiring too.',
   'todo', 'medium', 'maintenance', 'front_gate',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000002',
   current_date + interval '5 days');

-- 7. General handyman: Driveway pothole
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Fill potholes on driveway',
   'Several large potholes near the front gate after the rain. Need gravel and compaction. About 4-5 holes.',
   'todo', 'medium', 'general', 'driveway',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001',
   current_date + interval '10 days');

-- 8. General handyman: Workshop door
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Workshop sliding door off track',
   'The big sliding door on the workshop has jumped off its track. Need to lift it back on and check the rollers.',
   'in_progress', 'high', 'maintenance', 'workshop',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001',
   current_date + interval '1 day');

-- 9. Riding school: Arena surface
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Grade riding arena surface',
   'Arena surface is uneven and getting compacted in the corners. Needs harrowing and fresh sand in the low spots.',
   'todo', 'medium', 'riding_school', 'riding_arena',
   null,
   'a1000000-0000-0000-0000-000000000001',
   current_date + interval '7 days');

-- 10. Riding school: Feed PB horses
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Morning feed — PB horses',
   'Feed the 3 PB horses their morning hay and hard feed. Check water troughs are full.',
   'done', 'medium', 'riding_school', 'stables',
   'c1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000002',
   current_date);

-- 11. Riding school: Stable door repair
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Fix stable door — stall 2',
   'Bottom hinge on stall 2 door is loose. The door drags on the ground when opening.',
   'todo', 'high', 'riding_school', 'stables',
   null,
   'a1000000-0000-0000-0000-000000000002',
   current_date + interval '3 days');

-- 12. Horses: Vet check reminder
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Schedule vet check for PB horses',
   'Annual vet check and vaccinations due for all 3 PB horses. Call Dr. Wilson at Coolongatta Vet.',
   'todo', 'medium', 'horses', 'Big_Paddock',
   'c1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002',
   current_date + interval '14 days');

-- 13. General: Veggie patch fence
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Repair veggie patch chicken wire',
   'Rabbits have been getting into the veggie patch. The chicken wire along the back is torn in two spots.',
   'todo', 'low', 'fencing', 'VegebtalePatch',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000002',
   current_date + interval '10 days');

-- 14. Completed task: Driveway clearing
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date, completed_at) values
  ('Clear fallen branch from driveway',
   'Large branch came down across the driveway entrance. Needs chainsaw and ute to clear.',
   'done', 'urgent', 'general', 'driveway',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001',
   current_date - interval '2 days',
   now() - interval '1 day');

-- 15. Garden maintenance
insert into public.tasks (title, description, status, priority, category, location, assigned_to, created_by, due_date) values
  ('Mow and edge front garden',
   'Front garden is overgrown. Mow the lawn, edge along the path, and trim the hedges by the gate.',
   'todo', 'low', 'general', 'Front_garden',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001',
   current_date + interval '7 days');

-- ===========================================
-- TASK COMMENTS
-- ===========================================

-- Comment on the fence repair (task 1-ish — we use subquery to find it)
insert into public.task_comments (task_id, user_id, content) values
  ((select id from public.tasks where title = 'Repair fallen fence — Front paddock'),
   'a1000000-0000-0000-0000-000000000001',
   'Dave, there are spare star pickets in the workshop. Wire is in the back corner.');

insert into public.task_comments (task_id, user_id, content) values
  ((select id from public.tasks where title = 'Repair fallen fence — Front paddock'),
   'b1000000-0000-0000-0000-000000000001',
   'Cheers Nick, I''ll grab them when I''m out Thursday.');

-- Comment on the gate latch
insert into public.task_comments (task_id, user_id, content) values
  ((select id from public.tasks where title = 'Fix Big Paddock gate latch'),
   'b1000000-0000-0000-0000-000000000001',
   'Had a look — latch is completely bent. Picked up a new one from the hardware store, will fit it tomorrow.');

-- Comment on the completed driveway task
insert into public.task_comments (task_id, user_id, content) values
  ((select id from public.tasks where title = 'Clear fallen branch from driveway'),
   'b1000000-0000-0000-0000-000000000004',
   'All cleared. Cut it up and stacked the wood behind the workshop.');

insert into public.task_comments (task_id, user_id, content) values
  ((select id from public.tasks where title = 'Clear fallen branch from driveway'),
   'a1000000-0000-0000-0000-000000000001',
   'Thanks Jim, looks great.');

-- Comment on PB horse feeding
insert into public.task_comments (task_id, user_id, content) values
  ((select id from public.tasks where title = 'Morning feed — PB horses'),
   'c1000000-0000-0000-0000-000000000001',
   'All fed and watered. Noticed Biscuit has a small cut on his front left — nothing serious but worth keeping an eye on.');
