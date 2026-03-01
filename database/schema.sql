SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables
DROP TABLE IF EXISTS ServiceArea;
DROP TABLE IF EXISTS AuditLog;
DROP TABLE IF EXISTS EmailLog;
DROP TABLE IF EXISTS VolunteerSignup;
DROP TABLE IF EXISTS VolunteerShift;
DROP TABLE IF EXISTS VolunteerOpportunity;
DROP TABLE IF EXISTS EventRSVP;
DROP TABLE IF EXISTS Event;
DROP TABLE IF EXISTS Resource;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS ProviderPostingPolicy;
DROP TABLE IF EXISTS ServiceProviderClaim;
DROP TABLE IF EXISTS ServiceProviderUser;
DROP TABLE IF EXISTS ServiceProvider;
DROP TABLE IF EXISTS Location;
DROP TABLE IF EXISTS UserRole;
DROP TABLE IF EXISTS Role;
DROP TABLE IF EXISTS UserProfile;
DROP TABLE IF EXISTS `User`;

SET FOREIGN_KEY_CHECKS = 1;

-- User Identity
CREATE TABLE `User` (
  user_id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_user_email (email(191))
);

CREATE TABLE UserProfile (
  user_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_userprofile_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Role (
  role_id INT NOT NULL AUTO_INCREMENT,
  role_name ENUM('user','volunteer','provider','admin') NOT NULL,
  PRIMARY KEY (role_id),
  UNIQUE KEY uq_role_name (role_name)
);

CREATE TABLE UserRole (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_userrole_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_userrole_role
    FOREIGN KEY (role_id) REFERENCES Role(role_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Location & Provider
CREATE TABLE Location (
  location_id INT NOT NULL AUTO_INCREMENT,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  street_address_1 VARCHAR(255) NULL,
  street_address_2 VARCHAR(255) NULL,
  city VARCHAR(255) NULL,
  state VARCHAR(2) NULL,
  zip VARCHAR(9) NULL,
  PRIMARY KEY (location_id)
);

CREATE TABLE ServiceProvider (
  provider_id INT NOT NULL AUTO_INCREMENT,
  location_id INT NULL,
  name VARCHAR(255) NOT NULL,
  common_name VARCHAR(255) NULL,
  phone_number VARCHAR(10) NULL,
  website VARCHAR(255) NULL,
  organization_type ENUM('value1','value2','value3') NULL,
  mission TEXT NULL,
  contact_name VARCHAR(255) NULL,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(255) NULL,
  operating_hours TEXT NULL,
  languages_spoken TEXT NULL,
  accessibility TEXT NULL,
  logo_url VARCHAR(255) NULL,
  status ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (provider_id),
  CONSTRAINT fk_provider_location
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE ServiceProviderUser (
  provider_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (provider_id, user_id),
  CONSTRAINT fk_spuser_provider
    FOREIGN KEY (provider_id) REFERENCES ServiceProvider(provider_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_spuser_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ServiceProviderClaim (
  claim_id INT NOT NULL AUTO_INCREMENT,
  provider_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  verification_method ENUM('ein','manual','other') NULL,
  PRIMARY KEY (claim_id),
  CONSTRAINT fk_spclaim_provider
    FOREIGN KEY (provider_id) REFERENCES ServiceProvider(provider_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_spclaim_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ProviderPostingPolicy (
  provider_id INT NOT NULL,
  max_events_per_month INT NOT NULL,
  max_opportunities_per_month INT NOT NULL,
  PRIMARY KEY (provider_id),
  CONSTRAINT fk_policy_provider
    FOREIGN KEY (provider_id) REFERENCES ServiceProvider(provider_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Category 
CREATE TABLE Category (
  category_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('event','resource','both') NOT NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_category_name (name)
);

-- Resources & Events
CREATE TABLE Resource (
  resource_id INT NOT NULL AUTO_INCREMENT,
  provider_id INT NOT NULL,
  category_id INT NOT NULL,
  location_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  hours TEXT NULL,
  PRIMARY KEY (resource_id),
  CONSTRAINT fk_resource_provider
    FOREIGN KEY (provider_id) REFERENCES ServiceProvider(provider_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_resource_category
    FOREIGN KEY (category_id) REFERENCES Category(category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_resource_location
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Event (
  event_id INT NOT NULL AUTO_INCREMENT,
  provider_id INT NOT NULL,
  category_id INT NOT NULL,
  location_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  event_date DATETIME NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NULL,
  description TEXT NULL,
  capacity INT NULL,
  registration_required ENUM('yes','no','unknown') NOT NULL,
  special_instructions TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  CONSTRAINT fk_event_provider
    FOREIGN KEY (provider_id) REFERENCES ServiceProvider(provider_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_event_category
    FOREIGN KEY (category_id) REFERENCES Category(category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_event_location
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE EventRSVP (
  event_rsvp_id INT NOT NULL AUTO_INCREMENT,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('yes','no') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_rsvp_id),
  UNIQUE KEY uq_event_user (event_id, user_id),
  CONSTRAINT fk_rsvp_event
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rsvp_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Volunteer Management
CREATE TABLE VolunteerOpportunity (
  opportunity_id INT NOT NULL AUTO_INCREMENT,
  provider_id INT NOT NULL,
  location_id INT NULL,
  event_id INT NULL,
  resource_id INT NULL,
  title VARCHAR(255) NOT NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  contact_name VARCHAR(150) NULL,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(20) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (opportunity_id),
  CONSTRAINT fk_opp_provider
    FOREIGN KEY (provider_id) REFERENCES ServiceProvider(provider_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_opp_location
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_opp_event
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_opp_resource
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE VolunteerShift (
  shift_id INT NOT NULL AUTO_INCREMENT,
  opportunity_id INT NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  capacity INT NOT NULL,
  PRIMARY KEY (shift_id),
  CONSTRAINT fk_shift_opportunity
    FOREIGN KEY (opportunity_id) REFERENCES VolunteerOpportunity(opportunity_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE VolunteerSignup (
  signup_id INT NOT NULL AUTO_INCREMENT,
  shift_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('registered','cancelled') NOT NULL DEFAULT 'registered',
  PRIMARY KEY (signup_id),
  UNIQUE KEY uq_shift_user (shift_id, user_id),
  CONSTRAINT fk_signup_shift
    FOREIGN KEY (shift_id) REFERENCES VolunteerShift(shift_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_signup_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Logs
CREATE TABLE EmailLog (
  email_log_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NULL,
  signup_id INT NULL,
  event_id INT NULL,
  email_type ENUM(
    'volunteer_confirmation',
    'volunteer_24h_reminder',
    'event_confirmation',
    'event_24h_reminder',
    'follow-up'
  ) NULL,
  send_at DATETIME NULL,
  status ENUM('queued','sent','failed') NULL DEFAULT 'queued',
  PRIMARY KEY (email_log_id),
  CONSTRAINT fk_emaillog_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_emaillog_signup
    FOREIGN KEY (signup_id) REFERENCES VolunteerSignup(signup_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_emaillog_event
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE AuditLog (
  log_id INT NOT NULL AUTO_INCREMENT,
  actor_user_id INT NULL,
  action VARCHAR(100) NULL,
  entity_type VARCHAR(100) NULL,
  entity_id INT NULL,
  occured_at DATETIME NULL,
  PRIMARY KEY (log_id),
  CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_user_id) REFERENCES `User`(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- Service Area
CREATE TABLE ServiceArea (
  area_id INT NOT NULL AUTO_INCREMENT,
  serviceprovider_id INT NOT NULL,
  label VARCHAR(255) NOT NULL,
  `order` INT NULL,
  PRIMARY KEY (area_id),
  CONSTRAINT fk_servicearea_provider
    FOREIGN KEY (serviceprovider_id) REFERENCES ServiceProvider(provider_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
