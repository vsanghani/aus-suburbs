-- Remove objects created by 0002_national_schema.
-- Schemas raw, staging, and curated stay. Extensions postgis, pg_trgm, and
-- btree_gist stay. Neon already has them, and kf_loader cannot recreate them.
-- curated.alembic_version is Alembic's table and is not dropped here.

DROP VIEW IF EXISTS curated.sitemap_entry;
DROP VIEW IF EXISTS curated.suburb_readiness;
DROP VIEW IF EXISTS curated.section_coverage;
DROP VIEW IF EXISTS curated.score_input;
DROP VIEW IF EXISTS curated.sal_neighbour;

DROP TABLE IF EXISTS staging.offence_count_load CASCADE;
DROP TABLE IF EXISTS staging.planning_overlay_load CASCADE;
DROP TABLE IF EXISTS staging.transit_stop_load CASCADE;
DROP TABLE IF EXISTS staging.amenity_feature_load CASCADE;
DROP TABLE IF EXISTS staging.metric_value_load CASCADE;
DROP TABLE IF EXISTS staging.sal_load CASCADE;
DROP TABLE IF EXISTS staging.load_batch CASCADE;

DROP TABLE IF EXISTS curated.place_score_group CASCADE;
DROP TABLE IF EXISTS curated.place_score CASCADE;
DROP TABLE IF EXISTS curated.score_run CASCADE;
DROP TABLE IF EXISTS curated.planning_overlay CASCADE;
DROP TABLE IF EXISTS curated.transit_stop CASCADE;
DROP TABLE IF EXISTS curated.amenity_feature CASCADE;
DROP TABLE IF EXISTS curated.amenity_type CASCADE;
DROP TABLE IF EXISTS curated.offence_count CASCADE;
DROP TABLE IF EXISTS curated.metric_value_input CASCADE;
DROP TABLE IF EXISTS curated.metric_value CASCADE;
DROP TABLE IF EXISTS curated.metric_definition CASCADE;
DROP TABLE IF EXISTS curated.readiness_section CASCADE;
DROP TABLE IF EXISTS curated.readiness_rule CASCADE;
DROP TABLE IF EXISTS curated.score_tier CASCADE;
DROP TABLE IF EXISTS curated.formula_group CASCADE;
DROP TABLE IF EXISTS curated.slug_redirect CASCADE;
DROP TABLE IF EXISTS curated.sal_sa4 CASCADE;
DROP TABLE IF EXISTS curated.sal_lga CASCADE;
DROP TABLE IF EXISTS curated.sal_postcode CASCADE;
DROP TABLE IF EXISTS curated.sal CASCADE;
DROP TABLE IF EXISTS curated.postcode CASCADE;
DROP TABLE IF EXISTS curated.lga CASCADE;
DROP TABLE IF EXISTS curated.sa4 CASCADE;
DROP TABLE IF EXISTS curated.dataset_source CASCADE;
DROP TABLE IF EXISTS curated.state CASCADE;

DROP FUNCTION IF EXISTS curated.suburb_is_indexable(integer, integer);
DROP FUNCTION IF EXISTS curated.sal_owners_source();
DROP FUNCTION IF EXISTS curated.slug_redirect_reject_current();
DROP FUNCTION IF EXISTS curated.sal_record_slug_change();
DROP FUNCTION IF EXISTS curated.sal_lock_code();
DROP FUNCTION IF EXISTS curated.sal_reject_retired_slug();
DROP FUNCTION IF EXISTS curated.metric_value_matches_definition();
DROP FUNCTION IF EXISTS curated.reject_unloadable_source();
DROP FUNCTION IF EXISTS curated.compute_place_score(text);
DROP FUNCTION IF EXISTS curated.source_is_loadable(bigint);
DROP FUNCTION IF EXISTS curated.allocate_slug(text, text);
DROP FUNCTION IF EXISTS curated.slugify_name(text);
