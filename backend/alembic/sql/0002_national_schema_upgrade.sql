-- National schema for the project.
-- raw:     loader-owned extracts. Infrastructure creates the schema. This
--         revision does not put tables in it.
-- staging: a load lands here and can be rejected. The API does not read it.
-- curated: the published model. The API reads this schema only.
--
-- Curated geometries are MultiPolygon or Point in EPSG:4326. ABS boundaries
-- ship as GDA2020 (EPSG:7844). Loaders transform to 4326 before insert.
-- Special-purpose SAL codes (no usual address xx9494, migratory xx9797, and
-- ZZZZZ) are not stored. They are balancing items, not suburbs.
--
-- A missing figure is no row, or status not_available with a reason.
-- A stored zero is a real zero. Loaders must not write zero to mean "unknown".
--
-- Infrastructure creates raw, staging, and curated. neondb_owner owns them.
-- kf_loader has CREATE inside those schemas and no CREATE on the database, so
-- this revision does not create schemas and does not comment on them.
-- postgis, pg_trgm, and btree_gist are already installed. CREATE EXTENSION
-- IF NOT EXISTS skips them. Nothing in this revision is created in public.
-- Downgrade drops objects inside the schemas and leaves the schemas and
-- extensions in place.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE curated.state (
  code text PRIMARY KEY,
  name text NOT NULL,
  ste_code_2021 text NOT NULL UNIQUE,
  in_catalogue boolean NOT NULL,
  centre_longitude numeric,
  centre_latitude numeric,
  zoom numeric,
  CONSTRAINT state_code_ck CHECK (code ~ '^[a-z]{2,3}$'),
  CONSTRAINT state_ste_ck CHECK (ste_code_2021 ~ '^[1-9]$'),
  CONSTRAINT state_centre_ck CHECK (
    (
      in_catalogue
      AND centre_longitude IS NOT NULL
      AND centre_latitude IS NOT NULL
      AND zoom IS NOT NULL
    )
    OR NOT in_catalogue
  )
);

CREATE TABLE curated.dataset_source (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dataset_key text NOT NULL,
  version_label text NOT NULL,
  agency text NOT NULL,
  title text NOT NULL,
  licence_id text NOT NULL,
  licence_text text NOT NULL,
  commercial_use_ok boolean NOT NULL,
  source_url text NOT NULL,
  published_date date,
  fetched_at timestamptz,
  file_checksum text,
  state_scope text[] NOT NULL,
  refresh_frequency text NOT NULL,
  status text NOT NULL,
  notes text,
  CONSTRAINT dataset_source_key_ck CHECK (dataset_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  CONSTRAINT dataset_source_version_ck CHECK (length(btrim(version_label)) > 0),
  CONSTRAINT dataset_source_url_ck CHECK (source_url ~ '^https://'),
  CONSTRAINT dataset_source_checksum_ck CHECK (
    file_checksum IS NULL OR file_checksum ~ '^sha256:[0-9a-f]{64}$'
  ),
  CONSTRAINT dataset_source_scope_ck CHECK (
    cardinality(state_scope) >= 1
    AND state_scope <@ ARRAY[
      'national', 'nsw', 'vic', 'qld', 'sa', 'wa', 'tas', 'nt', 'act', 'ot'
    ]::text[]
    AND NOT ('national' = ANY (state_scope) AND cardinality(state_scope) > 1)
  ),
  CONSTRAINT dataset_source_frequency_ck CHECK (
    refresh_frequency IN ('static', 'annual', 'quarterly', 'monthly', 'weekly', 'ad_hoc')
  ),
  CONSTRAINT dataset_source_status_ck CHECK (status IN ('enabled', 'disabled')),
  CONSTRAINT dataset_source_commercial_ck CHECK (commercial_use_ok OR status = 'disabled'),
  CONSTRAINT dataset_source_version_uq UNIQUE (dataset_key, version_label)
);

COMMENT ON TABLE curated.dataset_source IS
  'One row per fetched version of a dataset. Metric rows point here so a figure can show the source name, licence, and as-of date. A licence that is not cleared for commercial use cannot be status enabled.';
COMMENT ON COLUMN curated.dataset_source.commercial_use_ok IS
  'False keeps the source disabled. Loaders must refuse a source unless status is enabled and this flag is true.';

CREATE TABLE curated.sa4 (
  sa4_code text PRIMARY KEY,
  name text NOT NULL,
  state_code text NOT NULL REFERENCES curated.state (code),
  slug text NOT NULL,
  CONSTRAINT sa4_code_ck CHECK (sa4_code ~ '^[0-9]{3}$'),
  CONSTRAINT sa4_slug_ck CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT sa4_state_slug_uq UNIQUE (state_code, slug)
);

CREATE TABLE curated.lga (
  lga_code text PRIMARY KEY,
  name text NOT NULL,
  state_code text NOT NULL REFERENCES curated.state (code),
  slug text NOT NULL,
  is_council boolean NOT NULL DEFAULT true,
  geom geometry(MultiPolygon, 4326),
  centroid geometry(Point, 4326),
  area_sqkm numeric,
  CONSTRAINT lga_code_ck CHECK (lga_code ~ '^[0-9]{5}$'),
  CONSTRAINT lga_slug_ck CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT lga_area_ck CHECK (area_sqkm IS NULL OR area_sqkm >= 0),
  CONSTRAINT lga_geom_ck CHECK (
    (geom IS NULL AND centroid IS NULL)
    OR (
      geom IS NOT NULL
      AND centroid IS NOT NULL
      AND ST_IsValid(geom)
      AND NOT ST_IsEmpty(geom)
      AND NOT ST_IsEmpty(centroid)
    )
  ),
  CONSTRAINT lga_state_slug_uq UNIQUE (state_code, slug)
);

COMMENT ON COLUMN curated.lga.is_council IS
  'False for unincorporated areas. Council pages are the rows where this is true.';

CREATE TABLE curated.postcode (
  postcode text PRIMARY KEY,
  CONSTRAINT postcode_ck CHECK (postcode ~ '^[0-9]{4}$')
);

CREATE TABLE curated.sal (
  sal_code text PRIMARY KEY,
  sal_name text NOT NULL,
  state_code text NOT NULL REFERENCES curated.state (code),
  slug text NOT NULL,
  path text GENERATED ALWAYS AS (state_code || '/' || slug) STORED,
  geom geometry(MultiPolygon, 4326) NOT NULL,
  centroid geometry(Point, 4326) NOT NULL,
  area_sqkm numeric,
  asgs_loci_uri text,
  traditional_owners text,
  traditional_owners_source_id bigint REFERENCES curated.dataset_source (id),
  CONSTRAINT sal_code_ck CHECK (
    sal_code ~ '^[0-9]{5}$'
    AND substring(sal_code FROM 2 FOR 4) NOT IN ('9494', '9797')
  ),
  CONSTRAINT sal_slug_ck CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT sal_area_ck CHECK (area_sqkm IS NULL OR area_sqkm >= 0),
  CONSTRAINT sal_geom_ck CHECK (ST_IsValid(geom) AND NOT ST_IsEmpty(geom)),
  CONSTRAINT sal_centroid_ck CHECK (NOT ST_IsEmpty(centroid)),
  CONSTRAINT sal_owners_ck CHECK (
    (traditional_owners IS NULL AND traditional_owners_source_id IS NULL)
    OR (traditional_owners IS NOT NULL AND traditional_owners_source_id IS NOT NULL)
  ),
  CONSTRAINT sal_state_slug_uq UNIQUE (state_code, slug),
  CONSTRAINT sal_path_uq UNIQUE (path)
);

COMMENT ON TABLE curated.sal IS
  'ABS Suburbs and Localities, ASGS Edition 3, keyed by SAL_CODE_2021. path is the permanent public URL {state}/{slug}.';
COMMENT ON COLUMN curated.sal.traditional_owners IS
  'A string copied from a named source, or null. Never inferred.';

CREATE TABLE curated.sal_postcode (
  sal_code text NOT NULL REFERENCES curated.sal (sal_code),
  postcode text NOT NULL REFERENCES curated.postcode (postcode),
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (sal_code, postcode)
);

CREATE TABLE curated.sal_lga (
  sal_code text NOT NULL REFERENCES curated.sal (sal_code),
  lga_code text NOT NULL REFERENCES curated.lga (lga_code),
  area_share numeric,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (sal_code, lga_code),
  CONSTRAINT sal_lga_share_ck CHECK (
    area_share IS NULL OR (area_share > 0 AND area_share <= 1)
  )
);

COMMENT ON TABLE curated.sal_lga IS
  'A suburb can meet more than one council. is_primary is the council shown on the suburb page, the largest area share.';

CREATE TABLE curated.sal_sa4 (
  sal_code text NOT NULL REFERENCES curated.sal (sal_code),
  sa4_code text NOT NULL REFERENCES curated.sa4 (sa4_code),
  area_share numeric,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (sal_code, sa4_code),
  CONSTRAINT sal_sa4_share_ck CHECK (
    area_share IS NULL OR (area_share > 0 AND area_share <= 1)
  )
);

COMMENT ON TABLE curated.sal_sa4 IS
  'Primary SA4 is the region shown on the suburb page.';

CREATE TABLE curated.slug_redirect (
  state_code text NOT NULL REFERENCES curated.state (code),
  old_slug text NOT NULL,
  sal_code text NOT NULL REFERENCES curated.sal (sal_code),
  redirected_on date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  PRIMARY KEY (state_code, old_slug),
  CONSTRAINT slug_redirect_slug_ck CHECK (old_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

COMMENT ON TABLE curated.slug_redirect IS
  'Old {state}/{slug} paths. They point at the current suburb and are never reused.';

CREATE TABLE curated.formula_group (
  group_id text PRIMARY KEY,
  label text NOT NULL,
  direction text NOT NULL,
  draft_max_points numeric NOT NULL,
  summary text NOT NULL,
  CONSTRAINT formula_group_direction_ck CHECK (direction IN ('positive', 'negative')),
  CONSTRAINT formula_group_points_ck CHECK (draft_max_points >= 0)
);

CREATE TABLE curated.score_tier (
  tier_id text PRIMARY KEY,
  label text NOT NULL,
  minimum numeric NOT NULL,
  meaning text NOT NULL,
  CONSTRAINT score_tier_minimum_ck CHECK (minimum >= 0)
);

CREATE TABLE curated.readiness_rule (
  id integer PRIMARY KEY,
  min_sections_filled integer NOT NULL,
  min_own_figure_sections integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT readiness_rule_singleton_ck CHECK (id = 1),
  CONSTRAINT readiness_rule_thresholds_ck CHECK (
    min_sections_filled >= 1
    AND min_own_figure_sections >= 1
    AND min_own_figure_sections <= min_sections_filled
  )
);

COMMENT ON TABLE curated.readiness_rule IS
  'Singleton thresholds for suburb indexable. suburb_is_indexable reads this row. Change the numbers here. Do not copy them into a query.';

CREATE TABLE curated.readiness_section (
  section_id text PRIMARY KEY,
  counts_toward_indexable boolean NOT NULL,
  CONSTRAINT readiness_section_id_ck CHECK (section_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE curated.metric_definition (
  metric_key text PRIMARY KEY,
  label text NOT NULL,
  section_id text NOT NULL REFERENCES curated.readiness_section (section_id),
  group_id text,
  unit text,
  direction text NOT NULL,
  value_kind text NOT NULL,
  formula_group_id text REFERENCES curated.formula_group (group_id),
  map_metric boolean NOT NULL DEFAULT false,
  description text NOT NULL,
  CONSTRAINT metric_definition_key_ck CHECK (metric_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT metric_definition_direction_ck CHECK (direction IN ('positive', 'negative', 'context')),
  CONSTRAINT metric_definition_kind_ck CHECK (value_kind IN ('numeric', 'text'))
);

CREATE TABLE curated.metric_value (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sal_code text REFERENCES curated.sal (sal_code),
  lga_code text REFERENCES curated.lga (lga_code),
  state_code text REFERENCES curated.state (code),
  place_key text GENERATED ALWAYS AS (
    CASE
      WHEN sal_code IS NOT NULL THEN 'sal:' || sal_code
      WHEN lga_code IS NOT NULL THEN 'lga:' || lga_code
      ELSE 'ste:' || state_code
    END
  ) STORED NOT NULL,
  metric_key text NOT NULL REFERENCES curated.metric_definition (metric_key),
  period_label text NOT NULL,
  as_of date,
  value numeric,
  value_text text,
  unit text,
  geo_level text NOT NULL,
  fallback_from text,
  dataset_source_id bigint NOT NULL REFERENCES curated.dataset_source (id),
  quality_flag text,
  status text NOT NULL,
  not_available_reason text,
  CONSTRAINT metric_value_one_place_ck CHECK (num_nonnulls(sal_code, lga_code, state_code) = 1),
  CONSTRAINT metric_value_geo_level_ck CHECK (
    geo_level IN ('suburb', 'postcode', 'lga', 'state')
  ),
  CONSTRAINT metric_value_fallback_from_ck CHECK (
    fallback_from IS NULL OR fallback_from IN ('suburb', 'postcode', 'lga')
  ),
  CONSTRAINT metric_value_fallback_use_ck CHECK (
    CASE
      WHEN sal_code IS NOT NULL THEN
        (geo_level = 'suburb' AND fallback_from IS NULL)
        OR (
          geo_level <> 'suburb'
          AND fallback_from IS NOT NULL
          AND fallback_from <> geo_level
        )
      WHEN lga_code IS NOT NULL THEN
        (geo_level = 'lga' AND fallback_from IS NULL)
        OR (
          geo_level = 'state'
          AND fallback_from IS NOT NULL
          AND fallback_from <> geo_level
        )
      ELSE
        geo_level = 'state' AND fallback_from IS NULL
    END
  ),
  CONSTRAINT metric_value_period_ck CHECK (length(btrim(period_label)) > 0),
  CONSTRAINT metric_value_quality_ck CHECK (
    quality_flag IS NULL
    OR quality_flag IN ('official', 'modelled', 'suppressed', 'partial_coverage', 'concorded')
  ),
  CONSTRAINT metric_value_status_ck CHECK (
    status IN ('ok', 'not_available')
    AND (
      (
        status = 'ok'
        AND as_of IS NOT NULL
        AND not_available_reason IS NULL
        AND num_nonnulls(value, value_text) = 1
      )
      OR (
        status = 'not_available'
        AND value IS NULL
        AND value_text IS NULL
        AND not_available_reason IS NOT NULL
        AND length(btrim(not_available_reason)) > 0
      )
    )
  ),
  CONSTRAINT metric_value_place_period_uq UNIQUE (place_key, metric_key, period_label)
);

COMMENT ON TABLE curated.metric_value IS
  'Tall store of published figures. status ok with value 0 is a real zero. Missing data is either no row or status not_available with a reason. Never write 0 to mean unknown.';
COMMENT ON COLUMN curated.metric_value.value IS
  'Numeric measure. Null when the figure is text, and null when status is not_available.';
COMMENT ON COLUMN curated.metric_value.not_available_reason IS
  'Required when status is not_available. Explains the gap. It is not a substitute value.';
COMMENT ON COLUMN curated.metric_value.geo_level IS
  'Geography the figure actually describes: suburb, postcode, lga, or state.';
COMMENT ON COLUMN curated.metric_value.fallback_from IS
  'Finer geography that was missing, when this row stands in for it. Null when the figure is native to the place it is stored on.';

CREATE TABLE curated.metric_value_input (
  metric_value_id bigint NOT NULL REFERENCES curated.metric_value (id) ON DELETE CASCADE,
  dataset_source_id bigint NOT NULL REFERENCES curated.dataset_source (id),
  PRIMARY KEY (metric_value_id, dataset_source_id)
);

COMMENT ON TABLE curated.metric_value_input IS
  'Extra sources that a derived figure used, besides metric_value.dataset_source_id. A rate per 1,000 records the offence source on the metric row and the population source here.';

CREATE TABLE curated.offence_count (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sal_code text REFERENCES curated.sal (sal_code),
  lga_code text REFERENCES curated.lga (lga_code),
  state_code text REFERENCES curated.state (code),
  place_key text GENERATED ALWAYS AS (
    CASE
      WHEN sal_code IS NOT NULL THEN 'sal:' || sal_code
      WHEN lga_code IS NOT NULL THEN 'lga:' || lga_code
      ELSE 'ste:' || state_code
    END
  ) STORED NOT NULL,
  dataset_source_id bigint NOT NULL REFERENCES curated.dataset_source (id),
  period_label text NOT NULL,
  as_of date,
  category text NOT NULL,
  offence text NOT NULL,
  recorded_count numeric,
  rate_per_1000 numeric,
  geo_level text NOT NULL,
  fallback_from text,
  status text NOT NULL,
  not_available_reason text,
  quality_flag text,
  CONSTRAINT offence_count_one_place_ck CHECK (num_nonnulls(sal_code, lga_code, state_code) = 1),
  CONSTRAINT offence_count_geo_level_ck CHECK (
    geo_level IN ('suburb', 'postcode', 'lga', 'state')
  ),
  CONSTRAINT offence_count_fallback_from_ck CHECK (
    fallback_from IS NULL OR fallback_from IN ('suburb', 'postcode', 'lga')
  ),
  CONSTRAINT offence_count_fallback_use_ck CHECK (
    CASE
      WHEN sal_code IS NOT NULL THEN
        (geo_level = 'suburb' AND fallback_from IS NULL)
        OR (
          geo_level <> 'suburb'
          AND fallback_from IS NOT NULL
          AND fallback_from <> geo_level
        )
      WHEN lga_code IS NOT NULL THEN
        (geo_level = 'lga' AND fallback_from IS NULL)
        OR (
          geo_level = 'state'
          AND fallback_from IS NOT NULL
          AND fallback_from <> geo_level
        )
      ELSE
        geo_level = 'state' AND fallback_from IS NULL
    END
  ),
  CONSTRAINT offence_count_period_ck CHECK (length(btrim(period_label)) > 0),
  CONSTRAINT offence_count_category_ck CHECK (
    category IN ('person', 'property', 'deception', 'other')
  ),
  CONSTRAINT offence_count_quality_ck CHECK (
    quality_flag IS NULL
    OR quality_flag IN ('official', 'modelled', 'suppressed', 'partial_coverage', 'concorded')
  ),
  CONSTRAINT offence_count_status_ck CHECK (
    status IN ('ok', 'not_available')
    AND (
      (
        status = 'ok'
        AND as_of IS NOT NULL
        AND not_available_reason IS NULL
        AND recorded_count IS NOT NULL
        AND recorded_count >= 0
        AND (rate_per_1000 IS NULL OR rate_per_1000 >= 0)
      )
      OR (
        status = 'not_available'
        AND recorded_count IS NULL
        AND rate_per_1000 IS NULL
        AND not_available_reason IS NOT NULL
        AND length(btrim(not_available_reason)) > 0
      )
    )
  ),
  CONSTRAINT offence_count_place_period_uq UNIQUE (place_key, period_label, category, offence)
);

COMMENT ON TABLE curated.offence_count IS
  'Offence breakdown behind the crime table. A count of zero means none were recorded. A rate is null until it is published or derived. It is not filled with zero.';

CREATE TABLE curated.amenity_type (
  type_key text PRIMARY KEY,
  label text NOT NULL,
  place_group text,
  CONSTRAINT amenity_type_key_ck CHECK (type_key ~ '^[a-z0-9]+(?:[_-][a-z0-9]+)*$')
);

CREATE TABLE curated.amenity_feature (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  feature_type text NOT NULL REFERENCES curated.amenity_type (type_key),
  name text NOT NULL,
  geom geometry(Point, 4326) NOT NULL,
  state_code text REFERENCES curated.state (code),
  sal_code text REFERENCES curated.sal (sal_code),
  dataset_source_id bigint NOT NULL REFERENCES curated.dataset_source (id),
  source_feature_id text NOT NULL,
  subtype text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT amenity_feature_geom_ck CHECK (ST_IsValid(geom) AND NOT ST_IsEmpty(geom)),
  CONSTRAINT amenity_feature_source_uq UNIQUE (dataset_source_id, source_feature_id)
);

COMMENT ON TABLE curated.amenity_feature IS
  'Point features: schools, childcare, parks, hospitals, police, fire, ambulance, supermarkets, and the other place groups on the suburb page.';

CREATE TABLE curated.transit_stop (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dataset_source_id bigint NOT NULL REFERENCES curated.dataset_source (id),
  source_stop_id text NOT NULL,
  name text NOT NULL,
  geom geometry(Point, 4326) NOT NULL,
  state_code text NOT NULL REFERENCES curated.state (code),
  mode text NOT NULL,
  location_type text,
  parent_source_stop_id text,
  CONSTRAINT transit_stop_mode_ck CHECK (
    mode IN ('train', 'tram', 'bus', 'regional_rail', 'ferry', 'light_rail', 'other')
  ),
  CONSTRAINT transit_stop_geom_ck CHECK (ST_IsValid(geom) AND NOT ST_IsEmpty(geom)),
  CONSTRAINT transit_stop_source_uq UNIQUE (dataset_source_id, source_stop_id)
);

COMMENT ON TABLE curated.transit_stop IS
  'GTFS stops. One row per stop in a feed version. Counts within 1 km are stored as metric_value, not computed on the request.';

CREATE TABLE curated.planning_overlay (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dataset_source_id bigint NOT NULL REFERENCES curated.dataset_source (id),
  state_code text NOT NULL REFERENCES curated.state (code),
  overlay_family text NOT NULL,
  overlay_code text NOT NULL,
  name text,
  geom geometry(MultiPolygon, 4326) NOT NULL,
  source_feature_id text NOT NULL,
  CONSTRAINT planning_overlay_family_ck CHECK (overlay_family IN ('flood', 'bushfire', 'other')),
  CONSTRAINT planning_overlay_geom_ck CHECK (ST_IsValid(geom) AND NOT ST_IsEmpty(geom)),
  CONSTRAINT planning_overlay_source_uq UNIQUE (dataset_source_id, source_feature_id)
);

COMMENT ON TABLE curated.planning_overlay IS
  'Published flood and bushfire overlay polygons for the map. Suburb percentages live in metric_value. Victorian LSIO and SBO both use overlay_family flood. Their separate shares are lsio-pct and sbo-pct.';

CREATE TABLE curated.score_run (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  formula_key text NOT NULL DEFAULT 'composite',
  formula_status text NOT NULL,
  base numeric NOT NULL,
  floor numeric NOT NULL,
  ceiling numeric NOT NULL,
  formula_document jsonb NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

COMMENT ON TABLE curated.score_run IS
  'One calculation of the composite. formula_document is a copy of contracts/formula.json at the time of the run.';

CREATE TABLE curated.place_score (
  score_run_id bigint NOT NULL REFERENCES curated.score_run (id),
  sal_code text NOT NULL REFERENCES curated.sal (sal_code),
  score numeric NOT NULL,
  tier_id text NOT NULL REFERENCES curated.score_tier (tier_id),
  inputs_used integer NOT NULL,
  inputs_skipped integer NOT NULL,
  geo_level text NOT NULL,
  fallback_from text,
  PRIMARY KEY (score_run_id, sal_code),
  CONSTRAINT place_score_range_ck CHECK (score >= 0 AND score <= 100),
  CONSTRAINT place_score_inputs_ck CHECK (inputs_used >= 0 AND inputs_skipped >= 0),
  CONSTRAINT place_score_geo_level_ck CHECK (
    geo_level IN ('suburb', 'postcode', 'lga', 'state')
  ),
  CONSTRAINT place_score_fallback_from_ck CHECK (
    fallback_from IS NULL OR fallback_from IN ('suburb', 'postcode', 'lga')
  ),
  CONSTRAINT place_score_fallback_use_ck CHECK (
    (geo_level = 'suburb' AND fallback_from IS NULL)
    OR (
      geo_level <> 'suburb'
      AND fallback_from IS NOT NULL
      AND fallback_from <> geo_level
    )
  )
);

CREATE TABLE curated.place_score_group (
  score_run_id bigint NOT NULL,
  sal_code text NOT NULL,
  group_id text NOT NULL REFERENCES curated.formula_group (group_id),
  direction text NOT NULL,
  max_points numeric NOT NULL,
  points numeric,
  skipped boolean NOT NULL,
  skip_reason text,
  metric_key text REFERENCES curated.metric_definition (metric_key),
  raw_value numeric,
  raw_unit text,
  chart_value numeric,
  PRIMARY KEY (score_run_id, sal_code, group_id),
  CONSTRAINT place_score_group_place_fk
    FOREIGN KEY (score_run_id, sal_code)
    REFERENCES curated.place_score (score_run_id, sal_code),
  CONSTRAINT place_score_group_direction_ck CHECK (direction IN ('positive', 'negative')),
  CONSTRAINT place_score_group_max_ck CHECK (max_points >= 0),
  CONSTRAINT place_score_group_chart_ck CHECK (
    chart_value IS NULL OR (chart_value >= 0 AND chart_value <= 100)
  ),
  CONSTRAINT place_score_group_skipped_ck CHECK (
    (
      skipped
      AND points IS NULL
      AND raw_value IS NULL
      AND skip_reason IS NOT NULL
    )
    OR (
      NOT skipped
      AND points IS NOT NULL
      AND skip_reason IS NULL
    )
  )
);

COMMENT ON TABLE curated.place_score_group IS
  'Per-group contribution. A skipped group stores no points and no raw value. It is not recorded as zero.';

CREATE TABLE staging.load_batch (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dataset_key text NOT NULL,
  dataset_source_id bigint REFERENCES curated.dataset_source (id),
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  file_checksum text,
  row_count integer,
  notes text,
  CONSTRAINT load_batch_status_ck CHECK (
    status IN ('running', 'validated', 'promoted', 'rejected', 'failed')
  )
);

CREATE TABLE staging.sal_load (
  load_batch_id bigint NOT NULL REFERENCES staging.load_batch (id) ON DELETE CASCADE,
  sal_code text NOT NULL,
  sal_name text NOT NULL,
  state_code text NOT NULL,
  slug text,
  geom geometry(MultiPolygon, 4326),
  centroid geometry(Point, 4326),
  area_sqkm numeric,
  PRIMARY KEY (load_batch_id, sal_code),
  CONSTRAINT sal_load_geom_ck CHECK (
    geom IS NULL OR (ST_IsValid(geom) AND NOT ST_IsEmpty(geom))
  )
);

CREATE TABLE staging.metric_value_load (
  load_batch_id bigint NOT NULL REFERENCES staging.load_batch (id) ON DELETE CASCADE,
  place_kind text NOT NULL,
  place_code text NOT NULL,
  metric_key text NOT NULL,
  period_label text NOT NULL,
  as_of date,
  value numeric,
  value_text text,
  unit text,
  geo_level text NOT NULL,
  fallback_from text,
  status text NOT NULL,
  not_available_reason text,
  quality_flag text,
  PRIMARY KEY (load_batch_id, place_kind, place_code, metric_key, period_label),
  CONSTRAINT metric_value_load_kind_ck CHECK (place_kind IN ('sal', 'lga', 'state')),
  CONSTRAINT metric_value_load_geo_ck CHECK (
    geo_level IN ('suburb', 'postcode', 'lga', 'state')
    AND (fallback_from IS NULL OR fallback_from IN ('suburb', 'postcode', 'lga'))
    AND (
      CASE place_kind
        WHEN 'sal' THEN
          (geo_level = 'suburb' AND fallback_from IS NULL)
          OR (
            geo_level <> 'suburb'
            AND fallback_from IS NOT NULL
            AND fallback_from <> geo_level
          )
        WHEN 'lga' THEN
          (geo_level = 'lga' AND fallback_from IS NULL)
          OR (
            geo_level = 'state'
            AND fallback_from IS NOT NULL
            AND fallback_from <> geo_level
          )
        ELSE
          geo_level = 'state' AND fallback_from IS NULL
      END
    )
  ),
  CONSTRAINT metric_value_load_status_ck CHECK (
    status IN ('ok', 'not_available')
    AND (
      (
        status = 'ok'
        AND as_of IS NOT NULL
        AND not_available_reason IS NULL
        AND num_nonnulls(value, value_text) = 1
      )
      OR (
        status = 'not_available'
        AND value IS NULL
        AND value_text IS NULL
        AND not_available_reason IS NOT NULL
        AND length(btrim(not_available_reason)) > 0
      )
    )
  )
);

CREATE TABLE staging.amenity_feature_load (
  load_batch_id bigint NOT NULL REFERENCES staging.load_batch (id) ON DELETE CASCADE,
  source_feature_id text NOT NULL,
  feature_type text NOT NULL,
  name text NOT NULL,
  geom geometry(Point, 4326),
  state_code text,
  subtype text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (load_batch_id, source_feature_id),
  CONSTRAINT amenity_feature_load_geom_ck CHECK (
    geom IS NULL OR (ST_IsValid(geom) AND NOT ST_IsEmpty(geom))
  )
);

CREATE TABLE staging.transit_stop_load (
  load_batch_id bigint NOT NULL REFERENCES staging.load_batch (id) ON DELETE CASCADE,
  source_stop_id text NOT NULL,
  name text NOT NULL,
  geom geometry(Point, 4326),
  state_code text NOT NULL,
  mode text NOT NULL,
  PRIMARY KEY (load_batch_id, source_stop_id),
  CONSTRAINT transit_stop_load_geom_ck CHECK (
    geom IS NULL OR (ST_IsValid(geom) AND NOT ST_IsEmpty(geom))
  )
);

CREATE TABLE staging.planning_overlay_load (
  load_batch_id bigint NOT NULL REFERENCES staging.load_batch (id) ON DELETE CASCADE,
  source_feature_id text NOT NULL,
  state_code text NOT NULL,
  overlay_family text NOT NULL,
  overlay_code text NOT NULL,
  name text,
  geom geometry(MultiPolygon, 4326),
  PRIMARY KEY (load_batch_id, source_feature_id),
  CONSTRAINT planning_overlay_load_geom_ck CHECK (
    geom IS NULL OR (ST_IsValid(geom) AND NOT ST_IsEmpty(geom))
  )
);

CREATE TABLE staging.offence_count_load (
  load_batch_id bigint NOT NULL REFERENCES staging.load_batch (id) ON DELETE CASCADE,
  place_kind text NOT NULL,
  place_code text NOT NULL,
  period_label text NOT NULL,
  category text NOT NULL,
  offence text NOT NULL,
  as_of date,
  recorded_count numeric,
  rate_per_1000 numeric,
  geo_level text NOT NULL,
  fallback_from text,
  status text NOT NULL,
  not_available_reason text,
  PRIMARY KEY (load_batch_id, place_kind, place_code, period_label, category, offence),
  CONSTRAINT offence_count_load_kind_ck CHECK (place_kind IN ('sal', 'lga', 'state')),
  CONSTRAINT offence_count_load_geo_ck CHECK (
    geo_level IN ('suburb', 'postcode', 'lga', 'state')
    AND (fallback_from IS NULL OR fallback_from IN ('suburb', 'postcode', 'lga'))
    AND (
      CASE place_kind
        WHEN 'sal' THEN
          (geo_level = 'suburb' AND fallback_from IS NULL)
          OR (
            geo_level <> 'suburb'
            AND fallback_from IS NOT NULL
            AND fallback_from <> geo_level
          )
        WHEN 'lga' THEN
          (geo_level = 'lga' AND fallback_from IS NULL)
          OR (
            geo_level = 'state'
            AND fallback_from IS NOT NULL
            AND fallback_from <> geo_level
          )
        ELSE
          geo_level = 'state' AND fallback_from IS NULL
      END
    )
  ),
  CONSTRAINT offence_count_load_status_ck CHECK (
    status IN ('ok', 'not_available')
    AND (
      (
        status = 'ok'
        AND as_of IS NOT NULL
        AND not_available_reason IS NULL
        AND recorded_count IS NOT NULL
        AND recorded_count >= 0
      )
      OR (
        status = 'not_available'
        AND recorded_count IS NULL
        AND rate_per_1000 IS NULL
        AND not_available_reason IS NOT NULL
        AND length(btrim(not_available_reason)) > 0
      )
    )
  )
);

CREATE UNIQUE INDEX sal_postcode_one_primary_idx
  ON curated.sal_postcode (sal_code)
  WHERE is_primary;

CREATE UNIQUE INDEX sal_lga_one_primary_idx
  ON curated.sal_lga (sal_code)
  WHERE is_primary;

CREATE UNIQUE INDEX sal_sa4_one_primary_idx
  ON curated.sal_sa4 (sal_code)
  WHERE is_primary;

CREATE INDEX sal_geom_gix ON curated.sal USING gist (geom);
CREATE INDEX sal_centroid_gix ON curated.sal USING gist (centroid);
CREATE INDEX sal_name_trgm_idx ON curated.sal USING gin (lower(sal_name) gin_trgm_ops);
CREATE INDEX lga_geom_gix ON curated.lga USING gist (geom);
CREATE INDEX lga_name_trgm_idx ON curated.lga USING gin (lower(name) gin_trgm_ops);
CREATE INDEX amenity_feature_geom_gix ON curated.amenity_feature USING gist (geom);
CREATE INDEX amenity_feature_type_idx ON curated.amenity_feature (feature_type, state_code);
CREATE INDEX transit_stop_geom_gix ON curated.transit_stop USING gist (geom);
CREATE INDEX transit_stop_mode_idx ON curated.transit_stop (state_code, mode);
CREATE INDEX planning_overlay_geom_gix ON curated.planning_overlay USING gist (geom);
CREATE INDEX planning_overlay_family_idx ON curated.planning_overlay (state_code, overlay_family);
CREATE INDEX metric_value_sal_idx
  ON curated.metric_value (sal_code, metric_key, period_label)
  WHERE sal_code IS NOT NULL;
CREATE INDEX metric_value_lga_idx
  ON curated.metric_value (lga_code, metric_key)
  WHERE lga_code IS NOT NULL;
CREATE INDEX metric_value_ranking_idx
  ON curated.metric_value (metric_key, period_label, value)
  WHERE status = 'ok' AND sal_code IS NOT NULL;
CREATE INDEX offence_count_sal_idx ON curated.offence_count (sal_code, period_label);
CREATE INDEX slug_redirect_sal_idx ON curated.slug_redirect (sal_code);
CREATE INDEX dataset_source_key_idx ON curated.dataset_source (dataset_key, status);

CREATE FUNCTION curated.slugify_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $func$
DECLARE
  cleaned text;
BEGIN
  cleaned := lower(btrim(p_name));
  cleaned := regexp_replace(
    cleaned,
    '\s*\((nsw|vic\.?|qld|sa|wa|tas\.?|nt|act|ot)\)\s*$',
    '',
    'i'
  );
  cleaned := replace(cleaned, '&', ' and ');
  cleaned := regexp_replace(cleaned, '[''’]', '', 'g');
  cleaned := regexp_replace(cleaned, '[^a-z0-9]+', '-', 'g');
  cleaned := regexp_replace(cleaned, '-+', '-', 'g');
  cleaned := btrim(cleaned, '-');
  RETURN cleaned;
END;
$func$;

COMMENT ON FUNCTION curated.slugify_name(text) IS
  'Place part of a URL. Drops a trailing ABS state suffix such as (Vic.). Matches app.slug.slugify_name.';

CREATE FUNCTION curated.allocate_slug(p_state_code text, p_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $func$
DECLARE
  base text := curated.slugify_name(p_name);
  candidate text;
  suffix integer := 2;
BEGIN
  IF base IS NULL OR base = '' THEN
    RAISE EXCEPTION 'cannot slugify %', p_name;
  END IF;
  candidate := base;
  WHILE EXISTS (
    SELECT 1
    FROM curated.sal
    WHERE state_code = p_state_code
      AND slug = candidate
    UNION ALL
    SELECT 1
    FROM curated.slug_redirect
    WHERE state_code = p_state_code
      AND old_slug = candidate
  ) LOOP
    candidate := base || '-' || suffix::text;
    suffix := suffix + 1;
  END LOOP;
  RETURN candidate;
END;
$func$;

COMMENT ON FUNCTION curated.allocate_slug(text, text) IS
  'First slug for a name that is neither a current slug nor a retired slug in that state. Collisions gain -2, -3, and so on.';

CREATE FUNCTION curated.source_is_loadable(p_source_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
AS $func$
  SELECT EXISTS (
    SELECT 1
    FROM curated.dataset_source
    WHERE id = p_source_id
      AND status = 'enabled'
      AND commercial_use_ok
  );
$func$;

COMMENT ON FUNCTION curated.source_is_loadable(bigint) IS
  'True only when a source version is enabled and cleared for commercial use. Loaders and curated inserts use this.';

CREATE FUNCTION curated.compute_place_score(p_sal_code text)
RETURNS numeric
LANGUAGE plpgsql
AS $func$
BEGIN
  IF p_sal_code IS NULL OR btrim(p_sal_code) = '' THEN
    RAISE EXCEPTION 'sal code is required';
  END IF;
  RAISE EXCEPTION
    'compute_place_score is a stub and does not score suburbs. Missing inputs are skipped, not stored as zero. See contracts/formula.json and docs/data-model.md.'
    USING ERRCODE = 'feature_not_supported';
END;
$func$;

COMMENT ON FUNCTION curated.compute_place_score(text) IS
  'Stub. The composite starts at the formula base, adds positive groups, subtracts negative groups, skips a missing input instead of treating it as zero, then clamps between floor and ceiling. Not implemented here.';

CREATE FUNCTION curated.suburb_is_indexable(
  p_sections_filled integer,
  p_own_figure_sections integer
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $func$
  SELECT COALESCE(
    (
      SELECT
        p_sections_filled >= rule.min_sections_filled
        AND p_own_figure_sections >= rule.min_own_figure_sections
      FROM curated.readiness_rule AS rule
      WHERE rule.id = 1
    ),
    false
  );
$func$;

COMMENT ON FUNCTION curated.suburb_is_indexable(integer, integer) IS
  'The only indexable test. A suburb is indexable when filled sections and suburb-level sections both meet curated.readiness_rule. The page flag and curated.sitemap_entry both use this.';

CREATE FUNCTION curated.reject_unloadable_source()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.dataset_source_id IS NOT DISTINCT FROM OLD.dataset_source_id THEN
    RETURN NEW;
  END IF;
  IF NOT curated.source_is_loadable(NEW.dataset_source_id) THEN
    RAISE EXCEPTION
      'dataset source % is disabled or not cleared for commercial use',
      NEW.dataset_source_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$func$;

CREATE FUNCTION curated.metric_value_matches_definition()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
DECLARE
  kind text;
  defined_unit text;
BEGIN
  SELECT value_kind, unit
    INTO kind, defined_unit
  FROM curated.metric_definition
  WHERE metric_key = NEW.metric_key;
  IF kind IS NULL THEN
    RAISE EXCEPTION 'unknown metric %', NEW.metric_key;
  END IF;
  IF NEW.unit IS DISTINCT FROM defined_unit THEN
    RAISE EXCEPTION 'metric % must use unit %', NEW.metric_key, defined_unit;
  END IF;
  IF NEW.status = 'ok' AND kind = 'numeric' AND NEW.value IS NULL THEN
    RAISE EXCEPTION 'numeric metric % needs a value', NEW.metric_key;
  END IF;
  IF NEW.status = 'ok' AND kind = 'text' AND NEW.value_text IS NULL THEN
    RAISE EXCEPTION 'text metric % needs value_text', NEW.metric_key;
  END IF;
  IF NEW.status = 'ok' AND kind = 'numeric' AND NEW.value_text IS NOT NULL THEN
    RAISE EXCEPTION 'numeric metric % cannot store text', NEW.metric_key;
  END IF;
  IF NEW.status = 'ok' AND kind = 'text' AND NEW.value IS NOT NULL THEN
    RAISE EXCEPTION 'text metric % cannot store a number', NEW.metric_key;
  END IF;
  RETURN NEW;
END;
$func$;

CREATE FUNCTION curated.sal_reject_retired_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.slug IS NOT DISTINCT FROM OLD.slug
     AND NEW.state_code IS NOT DISTINCT FROM OLD.state_code THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM curated.slug_redirect AS redirect
    WHERE redirect.state_code = NEW.state_code
      AND redirect.old_slug = NEW.slug
  ) THEN
    RAISE EXCEPTION
      'slug % was retired in % and cannot be reused',
      NEW.slug,
      NEW.state_code;
  END IF;
  RETURN NEW;
END;
$func$;

CREATE FUNCTION curated.sal_lock_code()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.sal_code IS DISTINCT FROM OLD.sal_code THEN
    RAISE EXCEPTION 'SAL_CODE_2021 cannot change';
  END IF;
  RETURN NEW;
END;
$func$;

CREATE FUNCTION curated.sal_record_slug_change()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.slug IS NOT DISTINCT FROM OLD.slug
     AND NEW.state_code IS NOT DISTINCT FROM OLD.state_code THEN
    RETURN NEW;
  END IF;
  PERFORM set_config('kf.slug_rename', OLD.sal_code, true);
  INSERT INTO curated.slug_redirect (state_code, old_slug, sal_code, redirected_on, reason)
  VALUES (OLD.state_code, OLD.slug, OLD.sal_code, CURRENT_DATE, 'slug changed');
  RETURN NEW;
END;
$func$;

CREATE FUNCTION curated.slug_redirect_reject_current()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
DECLARE
  renaming text := current_setting('kf.slug_rename', true);
BEGIN
  IF EXISTS (
    SELECT 1
    FROM curated.sal AS place
    WHERE place.state_code = NEW.state_code
      AND place.slug = NEW.old_slug
      AND NOT (
        renaming IS NOT NULL
        AND renaming = place.sal_code
        AND place.sal_code = NEW.sal_code
      )
  ) THEN
    RAISE EXCEPTION
      'slug % is the current slug of a suburb in %',
      NEW.old_slug,
      NEW.state_code;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM curated.sal AS place
    WHERE place.sal_code = NEW.sal_code
      AND place.state_code = NEW.state_code
  ) THEN
    RAISE EXCEPTION
      'redirect state % does not match suburb %',
      NEW.state_code,
      NEW.sal_code;
  END IF;
  RETURN NEW;
END;
$func$;

CREATE FUNCTION curated.sal_owners_source()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.traditional_owners IS NOT DISTINCT FROM OLD.traditional_owners
     AND NEW.traditional_owners_source_id IS NOT DISTINCT FROM OLD.traditional_owners_source_id THEN
    RETURN NEW;
  END IF;
  IF NEW.traditional_owners IS NULL AND NEW.traditional_owners_source_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.traditional_owners IS NULL OR NEW.traditional_owners_source_id IS NULL THEN
    RAISE EXCEPTION 'traditional owners need both a name and a dataset source';
  END IF;
  IF NOT curated.source_is_loadable(NEW.traditional_owners_source_id) THEN
    RAISE EXCEPTION 'traditional owners source is not loadable';
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER sal_biu_reject_retired_slug
  BEFORE INSERT OR UPDATE ON curated.sal
  FOR EACH ROW
  EXECUTE FUNCTION curated.sal_reject_retired_slug();

CREATE TRIGGER sal_bu_lock_code
  BEFORE UPDATE ON curated.sal
  FOR EACH ROW
  EXECUTE FUNCTION curated.sal_lock_code();

CREATE TRIGGER sal_bu_record_slug_change
  BEFORE UPDATE ON curated.sal
  FOR EACH ROW
  EXECUTE FUNCTION curated.sal_record_slug_change();

CREATE TRIGGER sal_biu_owners_source
  BEFORE INSERT OR UPDATE ON curated.sal
  FOR EACH ROW
  EXECUTE FUNCTION curated.sal_owners_source();

CREATE TRIGGER slug_redirect_biu_reject_current
  BEFORE INSERT OR UPDATE ON curated.slug_redirect
  FOR EACH ROW
  EXECUTE FUNCTION curated.slug_redirect_reject_current();

CREATE TRIGGER metric_value_biu_source
  BEFORE INSERT OR UPDATE ON curated.metric_value
  FOR EACH ROW
  EXECUTE FUNCTION curated.reject_unloadable_source();

CREATE TRIGGER metric_value_biu_definition
  BEFORE INSERT OR UPDATE ON curated.metric_value
  FOR EACH ROW
  EXECUTE FUNCTION curated.metric_value_matches_definition();

CREATE TRIGGER metric_value_input_biu_source
  BEFORE INSERT OR UPDATE ON curated.metric_value_input
  FOR EACH ROW
  EXECUTE FUNCTION curated.reject_unloadable_source();

CREATE TRIGGER offence_count_biu_source
  BEFORE INSERT OR UPDATE ON curated.offence_count
  FOR EACH ROW
  EXECUTE FUNCTION curated.reject_unloadable_source();

CREATE TRIGGER amenity_feature_biu_source
  BEFORE INSERT OR UPDATE ON curated.amenity_feature
  FOR EACH ROW
  EXECUTE FUNCTION curated.reject_unloadable_source();

CREATE TRIGGER transit_stop_biu_source
  BEFORE INSERT OR UPDATE ON curated.transit_stop
  FOR EACH ROW
  EXECUTE FUNCTION curated.reject_unloadable_source();

CREATE TRIGGER planning_overlay_biu_source
  BEFORE INSERT OR UPDATE ON curated.planning_overlay
  FOR EACH ROW
  EXECUTE FUNCTION curated.reject_unloadable_source();

CREATE VIEW curated.section_coverage AS
WITH metric_rows AS (
  SELECT
    mv.sal_code,
    md.section_id,
    mv.geo_level,
    mv.fallback_from,
    CASE mv.geo_level
      WHEN 'suburb' THEN 1
      WHEN 'postcode' THEN 2
      WHEN 'lga' THEN 3
      ELSE 4
    END AS coarseness
  FROM curated.metric_value AS mv
  JOIN curated.metric_definition AS md ON md.metric_key = mv.metric_key
  JOIN curated.readiness_section AS rs ON rs.section_id = md.section_id
  WHERE mv.status = 'ok'
    AND mv.sal_code IS NOT NULL
    AND rs.counts_toward_indexable
),
score_rows AS (
  SELECT DISTINCT ON (ps.sal_code)
    ps.sal_code,
    'score'::text AS section_id,
    ps.geo_level,
    ps.fallback_from,
    CASE ps.geo_level
      WHEN 'suburb' THEN 1
      WHEN 'postcode' THEN 2
      WHEN 'lga' THEN 3
      ELSE 4
    END AS coarseness
  FROM curated.place_score AS ps
  JOIN curated.score_run AS sr ON sr.id = ps.score_run_id
  WHERE sr.formula_key = 'composite'
    AND EXISTS (
      SELECT 1
      FROM curated.readiness_section AS rs
      WHERE rs.section_id = 'score'
        AND rs.counts_toward_indexable
    )
  ORDER BY ps.sal_code, sr.computed_at DESC, sr.id DESC
),
combined AS (
  SELECT * FROM metric_rows
  UNION ALL
  SELECT * FROM score_rows
)
SELECT DISTINCT ON (sal_code, section_id)
  sal_code,
  section_id,
  geo_level,
  fallback_from
FROM combined
ORDER BY sal_code, section_id, coarseness;

COMMENT ON VIEW curated.section_coverage IS
  'One row per filled suburb section. geo_level is the finest status-ok geography in that section. Suburb wins over postcode, then lga, then state. A not_available row does not fill a section.';

CREATE VIEW curated.suburb_readiness AS
SELECT
  place.sal_code,
  place.state_code,
  place.slug,
  place.path,
  COALESCE(counts.sections_filled, 0) AS sections_filled,
  COALESCE(counts.own_figure_sections, 0) AS own_figure_sections,
  curated.suburb_is_indexable(
    COALESCE(counts.sections_filled, 0),
    COALESCE(counts.own_figure_sections, 0)
  ) AS indexable,
  dates.last_updated
FROM curated.sal AS place
LEFT JOIN (
  SELECT
    coverage.sal_code,
    count(*)::integer AS sections_filled,
    count(*) FILTER (WHERE coverage.geo_level = 'suburb')::integer AS own_figure_sections
  FROM curated.section_coverage AS coverage
  GROUP BY coverage.sal_code
) AS counts ON counts.sal_code = place.sal_code
LEFT JOIN (
  SELECT
    mv.sal_code,
    max(COALESCE(ds.published_date, mv.as_of)) AS last_updated
  FROM curated.metric_value AS mv
  JOIN curated.dataset_source AS ds ON ds.id = mv.dataset_source_id
  WHERE mv.sal_code IS NOT NULL
  GROUP BY mv.sal_code
) AS dates ON dates.sal_code = place.sal_code;

COMMENT ON VIEW curated.suburb_readiness IS
  'sections_filled counts every filled section. own_figure_sections counts filled sections whose finest geo_level is suburb. indexable is curated.suburb_is_indexable. last_updated is the newest source published date among the suburb metrics, or the metric as_of when the source has no published date. This is a live view so the page and the sitemap cannot diverge.';

CREATE VIEW curated.sitemap_entry AS
SELECT
  readiness.state_code,
  readiness.slug,
  readiness.path,
  readiness.sal_code,
  readiness.last_updated AS lastmod
FROM curated.suburb_readiness AS readiness
WHERE readiness.indexable;

COMMENT ON VIEW curated.sitemap_entry IS
  'Indexable suburbs only. Filter by state_code for one state. lastmod is suburb_readiness.last_updated. indexable is not recomputed here.';

CREATE VIEW curated.score_input AS
SELECT
  place.sal_code,
  grp.group_id,
  grp.direction,
  grp.draft_max_points,
  def.metric_key,
  latest.value,
  latest.unit,
  latest.status,
  latest.as_of,
  latest.geo_level,
  latest.fallback_from,
  latest.dataset_source_id,
  latest.status IS DISTINCT FROM 'ok' AS skipped
FROM curated.sal AS place
JOIN curated.metric_definition AS def ON def.formula_group_id IS NOT NULL
JOIN curated.formula_group AS grp ON grp.group_id = def.formula_group_id
LEFT JOIN LATERAL (
  SELECT
    mv.value,
    mv.unit,
    mv.status,
    mv.as_of,
    mv.geo_level,
    mv.fallback_from,
    mv.dataset_source_id
  FROM curated.metric_value AS mv
  WHERE mv.sal_code = place.sal_code
    AND mv.metric_key = def.metric_key
  ORDER BY mv.as_of DESC NULLS LAST, mv.period_label DESC
  LIMIT 1
) AS latest ON true;

COMMENT ON VIEW curated.score_input IS
  'Latest curated input for each score metric. skipped is true when the metric is absent or not_available. value is null in that case and is not zero. A formula group can have several metrics. The scorer applies the group ceiling once.';

CREATE VIEW curated.sal_neighbour AS
SELECT
  a.sal_code,
  b.sal_code AS neighbour_sal_code
FROM curated.sal AS a
JOIN curated.sal AS b
  ON a.sal_code <> b.sal_code
 AND a.geom && b.geom
 AND ST_Touches(a.geom, b.geom);

COMMENT ON VIEW curated.sal_neighbour IS
  'Suburbs whose polygons touch. This is the nearby-suburbs relation once geometries are loaded.';
