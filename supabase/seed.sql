-- Sunwai — Database Seed SQL (Sprint 1)

-- Insert Course Prefixes
INSERT INTO course_prefixes (prefix, course_name) VALUES
('PGP', 'Post Graduate Programme in Management'),
('ABM', 'Post Graduate Programme in Agribusiness Management'),
('IPM', 'Integrated Programme in Management'),
('IPMX', 'International Programme in Management for Executives')
ON CONFLICT (prefix) DO NOTHING;

-- Insert Users
INSERT INTO users (id, roll_no, name, email, course, batch, hostel, is_active) VALUES
('user-pres', 'PGP40001', 'Ashwin Narayan', 'president@iiml.ac.in', 'PGP', '40', 'Hostel 3', true),
('user-infra', 'PGP40012', 'Kabir Mehta', 'infra.sec@iiml.ac.in', 'PGP', '40', 'Hostel 3', true),
('user-mess', 'PGP40045', 'Ananya Sen', 'mess.sec@iiml.ac.in', 'PGP', '40', 'Hostel 4', true),
('user-acad', 'PGP40089', 'Rohan Kulkarni', 'acad.sec@iiml.ac.in', 'PGP', '40', 'Hostel 1', true),
('user-sports', 'PGP40104', 'Tanvi Verma', 'sports.sec@iiml.ac.in', 'PGP', '40', 'Hostel 2', true),
('user-events', 'PGP40122', 'Devashish Roy', 'events.sec@iiml.ac.in', 'PGP', '40', 'Hostel 5', true),
('user-cultural', 'PGP40156', 'Meera Iyer', 'cultural.sec@iiml.ac.in', 'PGP', '40', 'Hostel 4', true),
('user-treasurer', 'PGP40188', 'Siddharth Jain', 'treasurer@iiml.ac.in', 'PGP', '40', 'Hostel 3', true),
('user-h3rep', 'PGP41030', 'Vikramaditya Rao', 'h3.rep@iiml.ac.in', 'PGP', '41', 'Hostel 3', true),
('user-h4rep', 'PGP41075', 'Pooja Hegde', 'h4.rep@iiml.ac.in', 'PGP', '41', 'Hostel 4', true),
('user-admin', 'PGP40099', 'Tech Admin', 'techadmin@iiml.ac.in', 'PGP', '40', 'Hostel 3', true),
('user-stu-1', 'PGP41001', 'Rahul Sharma', 'rahul.s@iiml.ac.in', 'PGP', '41', 'Hostel 3', true),
('user-stu-2', 'PGP41002', 'Priya Nair', 'priya.n@iiml.ac.in', 'PGP', '41', 'Hostel 4', true),
('user-stu-3', 'PGP41003', 'Aakash Singhal', 'aakash.s@iiml.ac.in', 'PGP', '41', 'Hostel 3', true),
('user-stu-4', 'PGP41004', 'Sneha Patel', 'sneha.p@iiml.ac.in', 'PGP', '41', 'Hostel 2', true),
('user-stu-5', 'PGP41005', 'Arjun Das', 'arjun.d@iiml.ac.in', 'PGP', '41', 'Hostel 1', true),
('user-stu-6', 'PGP41006', 'Divya Ranganathan', 'divya.r@iiml.ac.in', 'PGP', '41', 'Hostel 4', true),
('user-stu-7', 'PGP41007', 'Karan Joharilal', 'karan.j@iiml.ac.in', 'PGP', '41', 'Hostel 5', true),
('user-stu-8', 'PGP41008', 'Bhavna Menon', 'bhavna.m@iiml.ac.in', 'PGP', '41', 'Hostel 2', true),
('user-stu-9', 'PGP41009', 'Nikhil Agarwal', 'nikhil.a@iiml.ac.in', 'PGP', '41', 'Hostel 3', true),
('user-stu-10', 'PGP41010', 'Shreya Ghosh', 'shreya.g@iiml.ac.in', 'PGP', '41', 'Hostel 4', true),
('user-stu-11', 'ABM20001', 'Abhishek Pandey', 'abhishek.p@iiml.ac.in', 'ABM', '20', 'Hostel 1', true),
('user-stu-12', 'ABM20002', 'Ritika Srivastava', 'ritika.s@iiml.ac.in', 'ABM', '20', 'Hostel 4', true),
('user-stu-13', 'ABM20003', 'Manish Tiwari', 'manish.t@iiml.ac.in', 'ABM', '20', 'Hostel 3', true),
('user-stu-14', 'ABM20004', 'Pallavi Rao', 'pallavi.r@iiml.ac.in', 'ABM', '20', 'Hostel 2', true),
('user-stu-15', 'IPM04001', 'Aditya Mathur', 'aditya.m@iiml.ac.in', 'IPM', '04', 'Hostel 5', true),
('user-stu-16', 'IPM04002', 'Natasha George', 'natasha.g@iiml.ac.in', 'IPM', '04', 'Hostel 4', true),
('user-stu-17', 'IPM04003', 'Kunal Kapoor', 'kunal.k@iiml.ac.in', 'IPM', '04', 'Hostel 3', true),
('user-stu-18', 'IPM04004', 'Anushka Sharma', 'anushka.s@iiml.ac.in', 'IPM', '04', 'Hostel 2', true),
('user-stu-19', 'PGP40050', 'Gaurav Bisht', 'gaurav.b@iiml.ac.in', 'PGP', '40', 'Hostel 3', true),
('user-stu-20', 'PGP40051', 'Harshita Seth', 'harshita.s@iiml.ac.in', 'PGP', '40', 'Hostel 4', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Roles
INSERT INTO roles (id, name, category_domain, inbox_email, holder_user_id) VALUES
('role-president', 'President', NULL, 'president@iiml.ac.in', 'user-pres'),
('role-infra', 'Infra & IT Secretary', 'Infra & IT', 'infra.sec@iiml.ac.in', 'user-infra'),
('role-mess', 'Mess Secretary', 'Mess and food', 'mess.sec@iiml.ac.in', 'user-mess'),
('role-acad', 'Academic Secretary', 'Academics', 'acad.sec@iiml.ac.in', 'user-acad'),
('role-sports', 'Sports Secretary', 'Sports facilities and events', 'sports.sec@iiml.ac.in', 'user-sports'),
('role-events', 'Events Secretary', 'Events', 'events.sec@iiml.ac.in', 'user-events'),
('role-cultural', 'Cultural Secretary', 'Cultural', 'cultural.sec@iiml.ac.in', 'user-cultural'),
('role-treasurer', 'Treasurer', 'Finance and reimbursements', 'treasurer@iiml.ac.in', 'user-treasurer'),
('role-h3rep', 'Hostel Rep H3', NULL, 'h3.rep@iiml.ac.in', 'user-h3rep'),
('role-h4rep', 'Hostel Rep H4', NULL, 'h4.rep@iiml.ac.in', 'user-h4rep'),
('role-student-affairs', 'Student Affairs Office', NULL, 'studentaffairs@iiml.ac.in', 'user-admin')
ON CONFLICT (id) DO NOTHING;

-- Insert Issues (Sample exit test: Hot Water issue)
INSERT INTO issues (
    id, raised_by, title, details, category, scope, hostel, visibility,
    status, severity, owner_role_id, cc_role_ids, ack_deadline, vote_count,
    is_priority, photos, created_at, updated_at
) VALUES (
    'issue-hot-water', 'user-stu-1',
    'Geysers non-functional in Hostel 3 2nd floor washrooms',
    'Multiple geysers across the north and east wing bathrooms of Hostel 3 second floor have stopped heating water. With winter approaching, students are forced to shower with ice-cold water or crowd into the 1st floor common washrooms.',
    'Infra & IT', 'my hostel', 'Hostel 3', 'public',
    'Raised', 'High', 'role-h3rep', ARRAY['role-infra'],
    NOW() + INTERVAL '24 hours', 214, true,
    ARRAY['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'],
    NOW() - INTERVAL '24 hours', NOW() - INTERVAL '24 hours'
) ON CONFLICT (id) DO NOTHING;
