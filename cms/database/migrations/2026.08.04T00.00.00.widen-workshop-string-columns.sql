-- schema.json declares these workshop string fields with maxLength > 255
-- (title 300, slug 300, registration_link 500, meeting_address 500,
-- meeting_place_name 300), but Strapi never migrates column width changes
-- on existing columns, so the DB was stuck at the varchar(255) default.
-- Synced workshops with long Hebrew titles/addresses (percent-encoded into
-- registration_link) exceeded 255 chars and failed with
-- "value too long for type character varying(255)".
ALTER TABLE strapi_workshops ALTER COLUMN title TYPE varchar(300);
ALTER TABLE strapi_workshops ALTER COLUMN slug TYPE varchar(300);
ALTER TABLE strapi_workshops ALTER COLUMN registration_link TYPE varchar(500);
ALTER TABLE strapi_workshops ALTER COLUMN meeting_address TYPE varchar(500);
ALTER TABLE strapi_workshops ALTER COLUMN meeting_place_name TYPE varchar(300);
