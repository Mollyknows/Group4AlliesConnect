-- Assumes a fresh database created from schema.sql
-- Intended for development and demo/testing only

-- 1. Roles
INSERT INTO Role (role_name) VALUES 
('user'), ('volunteer'), ('provider'), ('admin');

-- 2. Users (Passwords are dummy hashes)
INSERT INTO `User` (username, email, password_hash, status) VALUES
('alice', 'alice@example.com', '$2y$10$abcdefghijklmnopqrstuv', 'active'),
('bob', 'bob@volunteer.org', '$2y$10$abcdefghijklmnopqrstuv', 'active'),
('charlie', 'charlie@charity.com', '$2y$10$abcdefghijklmnopqrstuv', 'active'),
('admin', 'admin@system.com', '$2y$10$abcdefghijklmnopqrstuv', 'active'),
('dave', 'dave@provider.io', '$2y$10$abcdefghijklmnopqrstuv', 'active');

-- 3. User Profiles
INSERT INTO UserProfile (user_id, first_name, last_name, phone, zip_code) VALUES
(1, 'Alice', 'Smith', '3105550101', '90210'),
(2, 'Bob', 'Jones', '2125550102', '10001'),
(3, 'Charlie', 'Brown', '3125550103', '60601'),
(4, 'Admin', 'User', '2025550000', '20001'),
(5, 'Dave', 'Miller', '4155550105', '94105');

-- 4. User Roles
INSERT INTO UserRole (user_id, role_id) VALUES
(1, 1), -- Alice is a User
(2, 2), -- Bob is a Volunteer
(3, 3), -- Charlie is a Provider
(4, 4), -- Admin is an Admin
(5, 3); -- Dave is a Provider

-- 5. Locations
INSERT INTO Location (latitude, longitude, street_address_1, city, state, zip) VALUES
(34.0522, -118.2437, '123 Hope St', 'Los Angeles', 'CA', '90012'),
(40.7128, -74.0060, '456 Charity Ln', 'New York', 'NY', '10007'),
(41.8781, -87.6298, '789 Civic Plaza', 'Chicago', 'IL', '60604');

-- 6. Service Providers
INSERT INTO ServiceProvider (location_id, name, ein, common_name, phone_number, website, organization_type, status) VALUES
(1, 'Community Food Bank', '11-1111111', 'The Food Bank', '2135551212', 'https://foodbank.org', 'value1', 'active'),
(2, 'City Shelter Services', '22-2222222', 'Downtown Shelter', '2125553434', 'https://cityshelter.org', 'value2', 'active'),
(3, 'Tech for All', '33-3333333', 'Tech4All', '3125555656', 'https://techforall.io', 'value3', 'active');

-- 7. Service Provider Users & Claims
INSERT INTO ServiceProviderUser (provider_id, user_id) VALUES (1, 3), (2, 5);
INSERT INTO ServiceProviderClaim (provider_id, user_id, status, verification_method) VALUES 
(1, 3, 'approved', 'ein'),
(2, 5, 'approved', 'manual');

-- 8. Posting Policies
INSERT INTO ProviderPostingPolicy (provider_id, max_events_per_month, max_opportunities_per_month) VALUES
(1, 10, 20),
(2, 5, 10),
(3, 15, 30);

-- 9. Categories
INSERT INTO Category (name, type) VALUES
('Food Assistance', 'both'),
('Housing', 'both'),
('Education', 'both'),
('Events','event'),
('Legal', 'both'),
('Social Advocacy', 'both'),
('Unions', 'both'),
('Community Gathering', 'both'),
('Employment', 'both'),
('Environment', 'both'),
('Arts and Culture', 'both');


-- 10. Resources
INSERT INTO Resource (provider_id, category_id, location_id, name, description, hours, image_url, eligibility_requirements, contact_name, contact_email, contact_phone, languages_spoken, accessibility, social_media_links, volunteer_application_prompt) VALUES
(1, 1, 1, 'Emergency Food Pantry', 'Weekly groceries for families in need.',
  '{"monday":{"closed":false,"open":"09:00","close":"17:00"},"tuesday":{"closed":false,"open":"09:00","close":"17:00"},"wednesday":{"closed":false,"open":"09:00","close":"17:00"},"thursday":{"closed":false,"open":"09:00","close":"17:00"},"friday":{"closed":false,"open":"09:00","close":"17:00"},"saturday":{"closed":true,"open":"","close":""},"sunday":{"closed":true,"open":"","close":""}}',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Please describe any relevant experience you have with food handling or community service, and indicate your available days.'),
(2, 2, 2, 'Overnight Beds', 'Safe sleeping environment for individuals.',
  '{"monday":{"closed":false,"open":"18:00","close":"08:00"},"tuesday":{"closed":false,"open":"18:00","close":"08:00"},"wednesday":{"closed":false,"open":"18:00","close":"08:00"},"thursday":{"closed":false,"open":"18:00","close":"08:00"},"friday":{"closed":false,"open":"18:00","close":"08:00"},"saturday":{"closed":false,"open":"18:00","close":"08:00"},"sunday":{"closed":false,"open":"18:00","close":"08:00"}}',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 3, 3, 'Public Computer Lab', 'Free internet and computer access.',
  '{"monday":{"closed":false,"open":"08:00","close":"20:00"},"tuesday":{"closed":false,"open":"08:00","close":"20:00"},"wednesday":{"closed":false,"open":"08:00","close":"20:00"},"thursday":{"closed":false,"open":"08:00","close":"20:00"},"friday":{"closed":false,"open":"08:00","close":"16:00"},"saturday":{"closed":false,"open":"10:00","close":"14:00"},"sunday":{"closed":true,"open":"","close":""}}',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Please describe your technical background and any experience teaching or helping others with computers.');

-- 11. Events
INSERT INTO Event (provider_id, category_id, location_id, title, start_datetime, end_datetime, registration_required, image_url, flyer_url, attendance) VALUES
(1, 1, 1, 'Community Thanksgiving Dinner', '2026-11-26 17:00:00', '2026-11-26 21:00:00', 'no', NULL, NULL, 2),
(3, 3, 3, 'Coding 101 Workshop', '2026-04-10 10:00:00', '2026-04-10 14:00:00', 'yes', NULL, NULL, 1);

-- 12. Event RSVPs
INSERT INTO EventRSVP (event_id, user_id, status) VALUES
(1, 1, 'yes'),
(2, 1, 'yes'),
(1, 2, 'no');

-- 13. Volunteer Opportunities & Shifts
INSERT INTO VolunteerOpportunity (provider_id, location_id, title, status) VALUES
(1, 1, 'Food Sorting Volunteer', 'open'),
(2, 2, 'Night Shift Monitor', 'open');

INSERT INTO VolunteerShift (opportunity_id, start_datetime, end_datetime, capacity) VALUES
(1, '2026-05-01 09:00:00', '2026-05-01 13:00:00', 10),
(2, '2026-05-01 22:00:00', '2026-05-02 06:00:00', 2);

-- 14. Volunteer Signups
INSERT INTO VolunteerSignup (shift_id, user_id, status) VALUES
(1, 2, 'registered');

-- 15. Volunteer Resource Connections
INSERT INTO VolunteerResourceConnection (resource_id, user_id, active, status, application_text) VALUES
(1, 2, TRUE, 'approved', 'I have experience sorting food donations and would love to help.'),
(3, 2, TRUE, 'approved', 'I am comfortable with computers and enjoy teaching others.');

-- 16. Volunteer Availability
INSERT INTO VolunteerAvailability (user_id, day_of_week, available, start_time, end_time) VALUES
(2, 'Monday',    TRUE,  '09:00:00', '17:00:00'),
(2, 'Wednesday', TRUE,  '09:00:00', '17:00:00'),
(2, 'Friday',    TRUE,  '09:00:00', '13:00:00'),
(2, 'Tuesday',   FALSE, NULL,       NULL),
(2, 'Thursday',  FALSE, NULL,       NULL),
(2, 'Saturday',  FALSE, NULL,       NULL),
(2, 'Sunday',    FALSE, NULL,       NULL);

-- 17. Volunteer Unavailable Dates
INSERT INTO VolunteerUnavailableDate (user_id, unavailable_date, reason) VALUES
(2, '2026-05-26', 'Memorial Day'),
(2, '2026-07-04', 'Independence Day');

-- 18. Service Areas
INSERT INTO ServiceArea (serviceprovider_id, label, `order`) VALUES
(1, 'Los Angeles County', 1),
(2, 'Manhattan Borough', 1),
(3, 'Greater Chicago Area', 1);

-- 19. Logs
INSERT INTO EmailLog (user_id, event_id, email_type, send_at, status) VALUES
(1, 2, 'event_confirmation', NOW(), 'sent');

INSERT INTO AuditLog (actor_user_id, action, entity_type, entity_id, occured_at) VALUES
(4, 'APPROVE_CLAIM', 'ServiceProviderClaim', 1, NOW());
