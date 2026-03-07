-- 1. Roles
INSERT INTO Role (role_name) VALUES 
('user'), ('volunteer'), ('provider'), ('admin');

-- 2. Users (Passwords are dummy hashes)
INSERT INTO `User` (email, password_hash, status) VALUES
('alice@example.com', '$2y$10$abcdefghijklmnopqrstuv', 'active'),
('bob@volunteer.org', '$2y$10$abcdefghijklmnopqrstuv', 'active'),
('charlie@charity.com', '$2y$10$abcdefghijklmnopqrstuv', 'active'),
('admin@system.com', '$2y$10$abcdefghijklmnopqrstuv', 'active'),
('dave@provider.io', '$2y$10$abcdefghijklmnopqrstuv', 'active');

-- 3. User Profiles
INSERT INTO UserProfile (user_id, first_name, last_name, phone, zip_code) VALUES
(1, 'Alice', 'Smith', '555-0101', '90210'),
(2, 'Bob', 'Jones', '555-0102', '10001'),
(3, 'Charlie', 'Brown', '555-0103', '60601'),
(4, 'Admin', 'User', '555-0000', '20001'),
(5, 'Dave', 'Miller', '555-0105', '94105');

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
INSERT INTO ServiceProvider (location_id, name, common_name, phone_number, website, organization_type, status) VALUES
(1, 'Community Food Bank', 'The Food Bank', '2135551212', 'https://foodbank.org', 'value1', 'active'),
(2, 'City Shelter Services', 'Downtown Shelter', '2125553434', 'https://cityshelter.org', 'value2', 'active'),
(3, 'Tech for All', 'Tech4All', '3125555656', 'https://techforall.io', 'value3', 'active');

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
('Housing', 'resource'),
('Educational Workshop', 'event');

-- 10. Resources
INSERT INTO Resource (provider_id, category_id, location_id, name, description) VALUES
(1, 1, 1, 'Emergency Food Pantry', 'Weekly groceries for families in need.'),
(2, 2, 2, 'Overnight Beds', 'Safe sleeping environment for individuals.'),
(3, 3, 3, 'Public Computer Lab', 'Free internet and computer access.');

-- 11. Events
INSERT INTO Event (provider_id, category_id, location_id, title, start_datetime, end_datetime, registration_required) VALUES
(1, 1, 1, 'Community Thanksgiving Dinner', '2026-11-26 17:00:00', '2026-11-26 21:00:00', 'no'),
(3, 3, 3, 'Coding 101 Workshop', '2026-04-10 10:00:00', '2026-04-10 14:00:00', 'yes');

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

-- 15. Service Areas
INSERT INTO ServiceArea (serviceprovider_id, label, `order`) VALUES
(1, 'Los Angeles County', 1),
(2, 'Manhattan Borough', 1),
(3, 'Greater Chicago Area', 1);

-- 16. Logs
INSERT INTO EmailLog (user_id, event_id, email_type, status) VALUES
(1, 2, 'event_confirmation', 'sent');

INSERT INTO AuditLog (actor_user_id, action, entity_type, entity_id, occured_at) VALUES
(4, 'APPROVE_CLAIM', 'ServiceProviderClaim', 1, NOW());