# GA4 BigQuery export runbook

Use this runbook to create, verify, and operate the production GA4 daily export.
It covers issue #683. It does not grant access to Google Analytics or Google
Cloud, so every console result must be recorded by the person who performed it.

The export must be active before #665 is deployed. It must also not export data
while the live Privacy Policy still says no separate warehouse export exists.
Those constraints require the disclosure gate below to be cleared before the
link is submitted; if the policy change remains bundled with #665 in PR #732,
the releases must be separated before this runbook can proceed. Google does not
re-export data missed while billing or the link is unavailable, and a standard
property whose daily export is paused for exceeding its event limit does not
have the missed days reprocessed.

## Decision record

The operator choices below are settled. They are decisions, not evidence that
the corresponding production settings exist. Keep console evidence separately
as `Pending` until Mark performs and verifies each console step.

### Recorded operator decisions

#### Dataset region

- **Recorded value:** `northamerica-northeast2` (Toronto).
- **Reason:** it keeps raw events in Canada with no current query, storage, or
  free-tier price premium over the `US` multi-region. Core SQL, GA4 export,
  scheduled queries, BI Engine, Analytics Hub, materialized views, Looker
  Studio, Connected Sheets, and Gemini SQL assistance support this region.
- **Trade-off:** some advanced BigQuery ML and BigQuery Studio code-asset
  features lag the `US` multi-region. A future large join to data held only in
  another region would require copying data or using Preview global queries
  with added limits, latency, and cost.
- **Reversibility:** changing region is a migration, not an in-place setting.
  Historical tables must be copied or replicated, and any export gap cannot be
  backfilled. Treat this as effectively permanent for routine operation.

#### Raw-data retention

- **Recorded value:** 14 months, configured as 425 days.
- **Configuration:** expire each table after 425 days, approximately matching
  GA4's 14-month event-retention window.
- **Reason:** indefinite raw retention is not justified by a stated purpose.
  BigQuery earns its place on capability: GA4 collapses high-cardinality
  `deal_nonce` reports into `(other)`, samples reports, computes no percentiles,
  and cannot join events. Beyond 14 months, preserve longitudinal value through
  the non-identifying aggregate summaries designed in issue #666.
- **Trade-off:** raw event-level history is permanently deleted after 425 days,
  while the purpose-built aggregate history remains available for longer-term
  comparisons.
- **Reversibility:** an unexpired table's deadline can be changed. An expired
  daily table is permanently gone and GA4 cannot export that day again.

#### Monthly budget amount

- **Recorded value:** USD $1 per month, scoped to this project and BigQuery.
- **Query safeguards:** use on-demand pricing; set project-wide **Query usage
  per day** to `0.01 TiB`, **Query usage per day per user** to `0.005 TiB`, and
  **Maximum bytes billed** to `1073741824` bytes (1 GiB) for each supported
  manual or programmatic query context. Create no slot reservation, capacity
  commitment, or BI Engine reservation.
- **Reason:** expected net cost is zero or nearly zero. The $1 budget detects
  abnormal billed spend, while the project quota is the proactive aggregate
  query safeguard. At `0.01 TiB` per day, a 31-day month permits about
  `0.31 TiB`, below the account-level 1 TiB monthly query free tier.
- **Trade-off:** a budget alerts but does not stop spend. Custom query quotas
  are approximate and can occasionally be exceeded. Maximum bytes billed
  rejects an oversized individual query but is not a project-wide default.
  Cloud Billing's Preview spend caps do not currently include BigQuery.
- **Reversibility:** all values can be changed for future work; none can undo
  charges already incurred.

#### Operational owner

- **Recorded value:** Mark is the sole operational owner for now. Mark's durable
  Google account owns the scheduled query and receives export-health and
  billing alerts. The backup owner is intentionally blank.
- **Trade-off:** one owner is simplest but creates a single-person failure risk.
- **Reversibility:** add a backup only after that person accepts responsibility,
  receives the required access, and passes the failure-email test.

### Console evidence to record

- **BigQuery project ID:** Pending. Use a dedicated billing-enabled project so
  costs and query quotas isolate this export.
- **GA4 property ID:** Pending. Copy the production property ID, not the test
  property.
- **GA4 reporting time zone:** Pending. Record the production property's time
  zone in IANA form and use it as `PROPERTY_TIME_ZONE` in the scheduled query.
- **Export dataset:** Pending. Google creates `analytics_<property_id>` after
  the link is submitted.
- **Link submitted at:** Pending. Record an ISO 8601 time and time zone.
- **First daily table verified:** Pending. Record the exact
  `events_YYYYMMDD` table and query date.
- **Retention confirmed by:** Pending. Record the account and date that checked
  dataset and table expiration.
- **Cost baseline start date, inclusive:** Pending. Record the first complete
  export date in the GA4 reporting time zone.
- **Cost baseline end date, exclusive:** Pending. Record the date exactly 30
  days after the start date.
- **Measured monthly cost:** Pending. Record storage usage, query bytes, gross
  cost, credits, and net billed amount separately.
- **Missing-table alert recipient:** Pending. Use the operational owner, plus a
  backup if one exists.
- **Canary scheduler job:** Pending. Record its project, region, schedule, GA4
  stream, and first exported `export_health_canary` date. Never record its API
  secret in this file, an issue, a PR, source control, or a screenshot.

## Placeholders used below

Before following the console paths or running SQL, replace all uppercase
placeholders:

- `PROJECT_ID`: the billing-enabled Google Cloud project ID.
- `PROPERTY_ID`: the numeric production GA4 property ID.
- `PROPERTY_TIME_ZONE`: the production GA4 reporting time zone, in IANA form.
- `YYYYMMDD`: the suffix of one exported daily table.
- `REGION`: the BigQuery region, such as `northamerica-northeast2`.
- `BASELINE_START_DATE`: the first complete export date, formatted `YYYY-MM-DD`.
- `RETENTION_DAYS`: `425`, the recorded 14-month raw-table retention expressed
  as the whole-day value BigQuery requires.
- `MEASUREMENT_ID`: the production web stream ID, beginning with `G-`.
- `API_SECRET`: the private Measurement Protocol secret used only in the Cloud
  Scheduler job. Never put its value in this repository or the decision record.

Do not put `deal_nonce` in GA4 custom definitions. It is a UUID per hand, so it
would immediately create a high-cardinality dimension and collapse in GA4
reports. BigQuery can query and join it directly without registering it.

## Console checklist

### 0. Clear the production-disclosure gate — **cleared 2026-08-21**

The disclosure shipped separately from #665 in PR #736, merged to `main` at
19:42 UTC on 2026-08-21 and deployed by the Pages workflow at commit
`cc5a81c`.

**Evidence.** The production bundle served from
<https://markafitzgerald1.github.io/cribbage-trainer/> contains the disclosure
text, verified in the built asset and confirmed by Mark in the live Privacy
Policy on 2026-08-21. The policy states that analytics events are copied daily
into Cribbage Trainer's own BigQuery dataset in Canada and kept for the same 14
months.

**Consent transition: none required, deliberately.** Matching Google
Analytics' own 14-month retention means the copy extends nothing — same data,
same duration, same operator, in a system that can query it — so no new
category, purpose, recipient, or retention period was introduced. `main` also
carries no policy-version machinery; that arrives with #665, which re-presents
the whole policy and collects a fresh choice from every consenting user when it
deploys.

**#665 is not in production.** PR #732 remains unmerged, so no
`discard_scored` event has ever been sent.

The BigQuery link may now be submitted.

### 1. Confirm GA4 retention

1. Sign in to Google Analytics and use the property selector to select the
   production Cribbage Trainer property. Confirm its property ID against the
   decision record.
2. Open **Admin** > **Property details**. Record **Reporting time zone** in
   IANA form for the SQL placeholder.
3. Return to **Admin**.
4. Under the property settings, open **Data collection and modification** >
   **Data retention**. Google's older navigation labels the same page
   **Data Settings** > **Data Retention**.
5. Set **Event data retention** to **14 months**.
6. Confirm **Reset user data on new activity** is off. That matches the current
   policy decision and prevents an active user identifier from being retained
   indefinitely; this switch affects user-level data only.
7. Click **Save**.
8. Reopen **Data retention** and confirm the page still shows **14 months** and
   reset off. Record the verifier and date in the decision record.

**Evidence.** Mark checked the production property on 2026-08-21. **Event data
retention** was already **14 months**, so no change was needed, and **Reset
user data on new activity** is **off**, matching the policy decision. The
reporting time zone is North American Eastern, UTC-4 in summer and UTC-5 in
winter; the operator substitutes its IANA identifier for `PROPERTY_TIME_ZONE`
when running the SQL, so this file does not record it.

Success is the saved production property showing 14 months. This setting does
not preserve raw events beyond GA4's retention window; the BigQuery link does.

### 2. Create or select a billing-enabled Cloud project

1. Open Google Cloud Console and select **New project**, or select a dedicated
   existing project.
2. Record its immutable project ID in the decision record.
3. Open **Billing** > **My projects**. In the row for this project, confirm a
   billing account appears under **Billing account**. If it says billing is
   disabled or no account is linked, use the row's action menu to link one.
4. Open **Billing** > **Overview** while the project is selected and confirm the
   linked billing account is active and has a valid payment method.
5. Open **APIs & Services** > **Library**, search for **BigQuery API**, open it,
   and click **Enable**. If the button says **Manage**, it is already enabled.
6. Open **IAM & Admin** > **IAM**. Confirm the account that will create the link
   is a project Owner. Google requires the Analytics account to be an Editor or
   above and the Cloud account to have project Owner access for the link flow.

Success is an active billing account, an enabled BigQuery API, and a project
Owner who is also an Editor or Administrator on the production GA4 property.
This is a non-sandbox project; do not proceed with the sandbox's 60-day table
expiration.

**Evidence, 2026-08-21.** Project `cribbage-trainer-analytics` was created with
no parent resource. The earlier expired free-trial billing account could not be
reopened — Google refuses that for lapsed trials — so a new individual billing
account was created in Canada and linked to the project. Billing management
shows it as a paid account, and BigQuery opens without the sandbox banner, so
the forced 60-day table expiration no longer applies.

### 3. Create the GA4 link

1. Return to the production property in Google Analytics and open **Admin**.
2. Under **Product links**, open **BigQuery links** and click **Link**.
3. Click **Choose a BigQuery project**, select the recorded `PROJECT_ID`, and
   click **Confirm**.
4. At **Data location**, stop and answer the region question in the decision
   record. Select exactly that location. Region changes later require migration
   work and can create a gap, so do not accept a default without checking it.
5. Click **Next**.
6. Open **Configure data streams and events**. Include the production web data
   stream. Leave **Events to exclude** empty so all consented trainer events are
   preserved. Click **Done**.
7. Leave **Include advertising identifiers for mobile app streams** off. This
   project exports its web stream and does not need advertising identifiers.
8. Under export frequency, enable **Daily**. Leave **Streaming** off: the issue
   requires durable complete daily tables, while streaming adds cost and is a
   best-effort feed.
9. Click **Next**, review the project, location, stream, no event exclusions,
   and Daily-only frequency, then click **Submit**.
10. Return to **Admin** > **Product links** > **BigQuery links**, open the new
    row, and confirm the recorded project, region, production stream, and Daily
    export are shown.

Record the submission time immediately. The link is active when its details
match the decision record; data should begin flowing within 24 hours.

**Evidence.** The link was submitted at 2026-08-21 22:04 UTC (18:04
EDT) and Google reported `LINK CREATED`. It exports the production web stream
daily to `northamerica-northeast2`, with streaming off, no excluded events, and
advertising identifiers off.

**User-data export was deliberately left off.** Nothing in #665 or #666 needs
user-scoped rows — every metric is per hand, joined on `deal_nonce` — and the
deployed policy discloses a daily copy of analytics _events_. A `users_*` table
is a person-scoped dataset of user properties and predictive attributes, so
enabling it would put collection ahead of its disclosure again.

### 4. Verify Cloud permissions and the first daily table

1. In Google Cloud Console, select `PROJECT_ID` and open **IAM & Admin** >
   **IAM**.
2. Enable **Include Google-provided role grants** if needed. Find
   `firebase-measurement@system.gserviceaccount.com` and confirm it has
   **BigQuery User** on the project.
3. Open **BigQuery** > **Explorer**, expand `PROJECT_ID`, and wait for the
   dataset `analytics_PROPERTY_ID`.
4. Open the dataset's **Sharing** > **Permissions** view and confirm the same
   service account has **BigQuery Data Owner** on the export dataset.
5. Expand the dataset and find `events_YYYYMMDD`. Daily export creates one
   table for the previous day. It usually arrives the following afternoon in
   the GA4 property's reporting time zone, but Google does not guarantee an
   exact time and may deliver it the next day.
6. Open the table's **Details** tab. Confirm its location equals the decision
   record and its row count is greater than zero after production has recorded
   consented traffic.

Success is a nonempty `events_YYYYMMDD` table in the expected project, dataset,
and region. Google may update that daily table with late events for three days.

### 5. Apply and verify the raw-data retention decision

Do this after Google creates the export dataset.

Set the policy deliberately. A sandbox dataset defaults to 60 days, while a
billing-enabled standard project's tables default to never expiring. Neither
default is the recorded 14-month policy.

1. In **BigQuery** > **Explorer**, open `analytics_PROPERTY_ID` and select its
   **Details** tab.
2. Click **Edit details**.
3. Enable **Enable table expiration** and enter `425` for **Default maximum
   table age** in days.
4. Click **Save**, reopen **Details**, and confirm **Default table expiration**
   shows 425 days.
5. A dataset default change affects only future tables. In a new BigQuery query
   tab, run the first query below to generate one `ALTER TABLE` statement for
   every existing `events_YYYYMMDD` table. Replace `RETENTION_DAYS` with `425`.
6. Copy every generated statement into a new query tab, select all of them, and
   click **Run**. Do not update only the first table.
7. Run the inventory query below. Every `expiration_timestamp` must equal that
   table's creation time plus 425 days.
8. Check a newly created daily table after the next export. Confirm it inherited
   the 425-day dataset policy.

Generate repairs for the recorded 425-day policy:

```sql
SELECT FORMAT(
  "ALTER TABLE `%s.%s.%s` SET OPTIONS (expiration_timestamp = TIMESTAMP '%s');",
  table_catalog,
  table_schema,
  table_name,
  FORMAT_TIMESTAMP(
    '%Y-%m-%d %H:%M:%S UTC',
    TIMESTAMP_ADD(creation_time, INTERVAL RETENTION_DAYS DAY),
    'UTC'
  )
) AS repair_statement
FROM `PROJECT_ID.analytics_PROPERTY_ID.INFORMATION_SCHEMA.TABLES`
WHERE STARTS_WITH(table_name, 'events_')
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Inventory every existing export table after running the repairs:

```sql
SELECT
  tables.table_name,
  tables.creation_time,
  options.option_value AS expiration_timestamp
FROM `PROJECT_ID.analytics_PROPERTY_ID.INFORMATION_SCHEMA.TABLES` AS tables
LEFT JOIN `PROJECT_ID.analytics_PROPERTY_ID.INFORMATION_SCHEMA.TABLE_OPTIONS`
  AS options
  ON tables.table_catalog = options.table_catalog
    AND tables.table_schema = options.table_schema
    AND tables.table_name = options.table_name
    AND options.option_name = 'expiration_timestamp'
WHERE STARTS_WITH(tables.table_name, 'events_')
  AND tables.table_type = 'BASE TABLE'
ORDER BY tables.table_name;
```

The dataset default, every existing daily table, and the newly sampled table
must show the recorded 425-day policy. Merely upgrading from sandbox would
replace one wrong implicit default with another; it would not deliberately set
14-month retention or repair the old 60-day expirations.

**Evidence, 2026-08-22.** The dataset `analytics_458709208` appeared at 11:04
EDT and its default table expiration was set to 425 days. `events_20260821`
had already been created and so did not inherit that default; it was given an
explicit `expiration_timestamp` of 2027-10-20, which is 425 days after its
reporting date.

### 6. Configure billing alerts

1. In Google Cloud Console, select `PROJECT_ID` before opening **Billing**.
2. Open **Billing** > **Cost management** > **Budgets & alerts** and click
   **Create budget**.
3. Name it `Cribbage Trainer BigQuery`.
4. Set **Time range** to **Monthly**. Scope it to `PROJECT_ID` and the BigQuery
   service; leave credits included so alerts track the amount actually payable.
5. Enter the budget amount Mark recorded. Do not use **Last month's spend** for
   a new project with no baseline.
6. Add actual-spend thresholds at 50%, 90%, and 100%, plus a forecasted-spend
   threshold at 100%.
7. Under notification recipients, enable email to billing administrators and
   users, enable email to the project's owners, and add the recorded monitoring
   email through a Cloud Monitoring notification channel if it would otherwise
   be missed.
8. Click **Finish**, reopen the budget, and confirm its project, service,
   amount, thresholds, and recipients.

Success is the scoped budget row with all four thresholds. A budget is an alert,
not a spending cap; the query quotas in the next section are the proactive
safeguard.

**Evidence.** Mark created the scoped monthly budget on 2026-08-21 at the
recorded USD $1 amount.

### 7. Configure query-cost safeguards

1. Open **IAM & Admin** > **Quotas & System Limits**.
2. Filter **Service** to **BigQuery API**.
3. Select **Query usage per day** and **Query usage per day per user**, then
   click **Edit**.
4. Set the project quota to `0.01 TiB` per day and the per-user quota to
   `0.005 TiB` per day. That is roughly 10.24 GiB and 5.12 GiB, respectively:
   far above the expected verification queries but low enough to stop an
   accidental broad scan.
5. Submit the quota changes and confirm the overrides appear in the quota list.
6. In **BigQuery**, open the query editor and choose **Edit** > **Query
   settings** > **Advanced options**. Set **Maximum bytes billed** to
   `1073741824` (1 GiB) for interactive queries and click **Save**.
7. For a query submitted through the `bq` command or API, set the same limit
   with `--maximum_bytes_billed=1073741824` or `maximumBytesBilled`,
   respectively. This is a per-query execution setting, not a project default.
   BigQuery scheduled-query configuration does not expose it; scheduled queries
   remain subject to the recorded project and per-user daily quotas.
8. Before every manual query, wait for the editor's byte estimate. Do not run it
   if the estimate is unexpectedly large. A `LIMIT` does not reduce bytes read
   from an unclustered table.

Success is a visible project and per-user custom quota plus a 1 GiB per-query
limit in the query editor. Custom quotas are approximate safeguards, not exact
spending caps.

**Evidence.** Mark set both BigQuery API quotas on 2026-08-21: query usage per
day at `0.01 TiB` and query usage per day per user at `0.005 TiB`.

### 8. Run the #250 daily-table verification

Generate the six #250 events on production with consent accepted before the day
being checked: start a hand, select and unselect a card, complete a two-card
discard, close that analysis by changing a selection, and click Deal. After its
daily table arrives, replace the placeholders and run this exact-table query.

```sql
WITH expected AS (
  SELECT *
  FROM UNNEST([
    STRUCT(
      'analysis_shown' AS event_name,
      [
        'analysis_index',
        'deal_nonce',
        'generated_from_seed',
        'is_first_analysis',
        'source'
      ] AS expected_params
    ),
    ('analysis_unshown', ['analysis_index', 'deal_nonce']),
    ('card_selected', ['deal_nonce', 'discard_count']),
    ('card_unselected', ['deal_nonce', 'discard_count']),
    ('deal_clicked', ['deal_nonce']),
    ('hand_started', ['deal_nonce', 'generated_from_seed', 'source'])
  ])
),
observed_events AS (
  SELECT event_name, COUNT(*) AS event_count
  FROM `PROJECT_ID.analytics_PROPERTY_ID.events_YYYYMMDD`
  WHERE event_name IN (SELECT event_name FROM expected)
  GROUP BY event_name
),
observed_params AS (
  SELECT
    event_name,
    ARRAY_AGG(DISTINCT param.key ORDER BY param.key) AS observed_params
  FROM `PROJECT_ID.analytics_PROPERTY_ID.events_YYYYMMDD`
  CROSS JOIN UNNEST(event_params) AS param
  WHERE event_name IN (SELECT event_name FROM expected)
  GROUP BY event_name
)
SELECT
  expected.event_name,
  IFNULL(observed_events.event_count, 0) AS event_count,
  expected.expected_params,
  IFNULL(observed_params.observed_params, ARRAY<STRING>[]) AS observed_params,
  ARRAY(
    SELECT expected_param
    FROM UNNEST(expected.expected_params) AS expected_param
    WHERE expected_param NOT IN UNNEST(
      IFNULL(observed_params.observed_params, ARRAY<STRING>[])
    )
    ORDER BY expected_param
  ) AS missing_expected_params
FROM expected
LEFT JOIN observed_events USING (event_name)
LEFT JOIN observed_params USING (event_name)
ORDER BY expected.event_name;
```

Success is six rows, every `event_count` greater than zero, and six empty
`missing_expected_params` arrays. Save the query result or a screenshot and
record the exact table suffix in the decision record.

Inspect representative values with this second query. Every numeric read uses
the same double-or-integer expression required for later decision quality.

```sql
SELECT
  event_name,
  TIMESTAMP_MICROS(event_timestamp) AS event_time,
  (
    SELECT ANY_VALUE(param.value.string_value)
    FROM UNNEST(event_params) AS param
    WHERE param.key = 'deal_nonce'
  ) AS deal_nonce,
  (
    SELECT ANY_VALUE(
      COALESCE(
        param.value.double_value,
        CAST(param.value.int_value AS FLOAT64)
      )
    )
    FROM UNNEST(event_params) AS param
    WHERE param.key = 'analysis_index'
  ) AS analysis_index,
  (
    SELECT ANY_VALUE(
      COALESCE(
        param.value.double_value,
        CAST(param.value.int_value AS FLOAT64)
      )
    )
    FROM UNNEST(event_params) AS param
    WHERE param.key = 'discard_count'
  ) AS discard_count,
  (
    SELECT COALESCE(
      SAFE_CAST(ANY_VALUE(param.value.string_value) AS BOOL),
      ANY_VALUE(
        COALESCE(
          param.value.double_value,
          CAST(param.value.int_value AS FLOAT64)
        )
      ) = 1
    )
    FROM UNNEST(event_params) AS param
    WHERE param.key = 'generated_from_seed'
  ) AS generated_from_seed,
  (
    SELECT COALESCE(
      SAFE_CAST(ANY_VALUE(param.value.string_value) AS BOOL),
      ANY_VALUE(
        COALESCE(
          param.value.double_value,
          CAST(param.value.int_value AS FLOAT64)
        )
      ) = 1
    )
    FROM UNNEST(event_params) AS param
    WHERE param.key = 'is_first_analysis'
  ) AS is_first_analysis,
  (
    SELECT ANY_VALUE(param.value.string_value)
    FROM UNNEST(event_params) AS param
    WHERE param.key = 'source'
  ) AS source
FROM `PROJECT_ID.analytics_PROPERTY_ID.events_YYYYMMDD`
WHERE event_name IN (
  'analysis_shown',
  'analysis_unshown',
  'card_selected',
  'card_unselected',
  'deal_clicked',
  'hand_started'
)
ORDER BY event_time DESC;
```

Values should match the production interaction. The boolean flags should be
non-null and match the sent `true` or `false` string. `deal_nonce` should join
the events from one hand; Deal should create a new nonce whose `hand_started`
precedes `deal_clicked`.

**Evidence, 2026-08-22.** The query ran against `events_20260821`, a partial
day covering activity after the link was created. Five of the six #250 events
were present with every expected parameter and no missing ones:
`hand_started` 15, `card_selected` 28, `analysis_shown` 14, `analysis_unshown`
14, `deal_clicked` 14. `card_unselected` was absent because no card was
un-selected during that session, which is the absence of an action that was
never performed rather than a gap in the export.

The counts corroborate each other: fifteen hands started is fourteen deals plus
the initial hand, twenty-eight card selections is two per hand, and each of the
fourteen completed discards was both shown and later closed.

**The card-free claim was also verified against transmitted data.** Every row's
`page_location` is exactly
`https://markafitzgerald1.github.io/cribbage-trainer/`, with no query string, so
the hands, roles, discards and seeds the trainer keeps in the URL never reached
Google Analytics. That claim had only ever been checked against the code before:
Google Analytics strips query strings from its own reports, so the export is the
first place it could be confirmed.

### 9. Keep the #665 query ready without deploying #665

Do not merge or deploy #665 merely to satisfy #683. After #665 is eventually
deployed, use this query against one exact daily table to verify
`discard_scored`. The extraction deliberately preserves whole-number values:
GA4 stores `0` and `2` in `int_value`, while a value such as `1.25` lands in
`double_value`. Reading only `double_value` would remove every zero-loss optimal
decision, the largest single group.

```sql
WITH discard_scored AS (
  SELECT
    event_date,
    TIMESTAMP_MICROS(event_timestamp) AS event_time,
    (
      SELECT ANY_VALUE(param.value.string_value)
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'deal_nonce'
    ) AS deal_nonce,
    (
      SELECT ANY_VALUE(param.value.string_value)
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'crib_role'
    ) AS crib_role,
    (
      SELECT ANY_VALUE(param.value.string_value)
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'hand_start_source'
    ) AS hand_start_source,
    (
      SELECT ANY_VALUE(param.value.string_value)
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'source'
    ) AS source,
    (
      SELECT ANY_VALUE(
        COALESCE(
          param.value.double_value,
          CAST(param.value.int_value AS FLOAT64)
        )
      )
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'schema_version'
    ) AS schema_version,
    (
      SELECT ANY_VALUE(
        COALESCE(
          param.value.double_value,
          CAST(param.value.int_value AS FLOAT64)
        )
      )
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'analysis_index'
    ) AS analysis_index,
    (
      SELECT ANY_VALUE(
        COALESCE(
          param.value.double_value,
          CAST(param.value.int_value AS FLOAT64)
        )
      )
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'expected_points_loss'
    ) AS expected_points_loss,
    (
      SELECT COALESCE(
        SAFE_CAST(ANY_VALUE(param.value.string_value) AS BOOL),
        ANY_VALUE(
          COALESCE(
            param.value.double_value,
            CAST(param.value.int_value AS FLOAT64)
          )
        ) = 1
      )
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'is_optimal'
    ) AS is_optimal,
    (
      SELECT COALESCE(
        SAFE_CAST(ANY_VALUE(param.value.string_value) AS BOOL),
        ANY_VALUE(
          COALESCE(
            param.value.double_value,
            CAST(param.value.int_value AS FLOAT64)
          )
        ) = 1
      )
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'is_first_analysis'
    ) AS is_first_analysis,
    (
      SELECT COALESCE(
        SAFE_CAST(ANY_VALUE(param.value.string_value) AS BOOL),
        ANY_VALUE(
          COALESCE(
            param.value.double_value,
            CAST(param.value.int_value AS FLOAT64)
          )
        ) = 1
      )
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'generated_from_seed'
    ) AS generated_from_seed
  FROM `PROJECT_ID.analytics_PROPERTY_ID.events_YYYYMMDD`
  WHERE event_name = 'discard_scored'
),
population_candidates AS (
  SELECT *
  FROM discard_scored
  WHERE is_first_analysis = TRUE
    AND generated_from_seed = FALSE
    AND hand_start_source IN ('initial', 'deal')
),
population_skill AS (
  SELECT *
  FROM population_candidates
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY deal_nonce
    ORDER BY analysis_index, event_time
  ) = 1
)
SELECT
  schema_version,
  COUNT(*) AS eligible_decisions,
  COUNTIF(is_optimal) AS optimal_decisions,
  COUNTIF(expected_points_loss = 0) AS zero_loss_decisions,
  SAFE_DIVIDE(COUNTIF(is_optimal), COUNT(*)) AS optimal_rate,
  AVG(expected_points_loss) AS mean_expected_points_loss,
  MIN(expected_points_loss) AS minimum_expected_points_loss,
  MAX(expected_points_loss) AS maximum_expected_points_loss
FROM population_skill
GROUP BY schema_version
ORDER BY schema_version;
```

Success is schema version `1`, a nonzero eligible count after eligible traffic
exists, equal optimal and zero-loss counts, and no missing expected fields in a
raw-row inspection. The population filter is exactly:

```sql
is_first_analysis = TRUE
AND generated_from_seed = FALSE
AND hand_start_source IN ('initial', 'deal')
```

Do not weaken it to the first two clauses: that silently admits manually typed
hands. More than one exposure per hand can legitimately carry
`is_first_analysis = TRUE` when earlier results never rendered, so the query
then keeps only the lowest `analysis_index` for each `deal_nonce`. Keep other
sources as separately segmented practice data.

### 10. Create a daily canary and alert on its absence

GA4 may legitimately omit a daily table when a property has no events. Because
this trainer is used intermittently, table absence alone is not evidence of a
failed export. Send one synthetic daily canary first, then require both its
table and event. Never include `export_health_canary` in user behavior or skill
statistics.

1. In production GA4, open **Admin** > **Data collection and modification** >
   **Data streams**, then open the production web stream. Record its
   **Measurement ID**.
2. Open **Measurement Protocol API secrets**, click **Create**, name it
   `BigQuery export canary`, and copy the secret into a password manager. It is
   private: never put it in client code, this repository, GitHub, screenshots,
   or the decision record.
3. In Google Cloud Console, select `PROJECT_ID`, open **APIs & Services** >
   **Library**, search for **Cloud Scheduler API**, and click **Enable**. If the
   button says **Manage**, it is already enabled.
4. Open **Cloud Scheduler** and click **Create job**. Name it
   `ga4-export-health-canary`, choose the recorded dataset region if available,
   set frequency to `5 0 * * *`, and select the recorded GA4 reporting time
   zone. This sends the canary at 00:05 on every reporting date.
5. Click **Continue**, choose **HTTP** as the target type, set method **POST**,
   and enter this URL after replacing both values:
   `https://www.google-analytics.com/mp/collect?measurement_id=MEASUREMENT_ID&api_secret=API_SECRET`.
6. Add header `Content-Type: application/json`. Enter this body exactly:

   ```json
   {
     "client_id": "683.1",
     "non_personalized_ads": true,
     "events": [
       {
         "name": "export_health_canary",
         "params": { "source": "cloud_scheduler" }
       }
     ]
   }
   ```

7. Keep the default retry settings and click **Create**. Restrict project IAM
   so only the operational owner and backup can inspect or edit the job; its URL
   contains the private API secret.
8. Open the job, click **Force run**, and confirm **Status of last execution**
   is **Success**. A success means Google accepted the HTTP request, not that it
   processed a valid event.
9. After that reporting date's daily export arrives, run this query against the
   exact table. Success is `canary_events` greater than zero. Record the table
   and date; this proves the complete scheduler, GA4 ingestion, and export path.

   ```sql
   SELECT COUNT(*) AS canary_events
   FROM `PROJECT_ID.analytics_PROPERTY_ID.events_YYYYMMDD`
   WHERE event_name = 'export_health_canary';
   ```

10. In **BigQuery**, open **Scheduled queries** and click **Create scheduled
    query**. Name it `GA4 daily export health`, then paste the SQL below after
    replacing the project, property, and time-zone placeholders. Keep
    `@run_time`; BigQuery supplies it.
11. Set **Repeats** to **Daily** at an off-the-hour UTC time. Recommendation:
    `18:05 UTC` for a `PROPERTY_TIME_ZONE` at UTC-4 or UTC-5. The query checks
    two reporting dates back, allowing the normal daily export more than a full
    day to arrive without waiting so long that a gap goes unnoticed.
12. Set **Processing location** to the recorded dataset region. Leave
    destination table settings empty because this assertion writes no table.
13. Under **Notification options**, enable **Send email notifications**. Confirm
    the scheduled-query owner is the recorded operational owner, save it, and
    run it for the verified canary date. Confirm the run succeeds.
14. Negative-check the alert once: in a copy, change the event name to
    `export_health_canary_missing`. Run it and confirm the assertion fails and
    the owner receives a BigQuery Data Transfer Service failure email. Delete
    the test copy afterwards.

```sql
DECLARE checked_date DATE DEFAULT DATE_SUB(
  DATE(@run_time, 'PROPERTY_TIME_ZONE'),
  INTERVAL 2 DAY
);
DECLARE checked_table STRING DEFAULT FORMAT_DATE(
  'events_%Y%m%d',
  checked_date
);
DECLARE canary_count INT64 DEFAULT 0;

ASSERT (
  SELECT COUNT(*) = 1
  FROM `PROJECT_ID.analytics_PROPERTY_ID.INFORMATION_SCHEMA.TABLES`
  WHERE table_name = checked_table
) AS 'GA4 daily export table is missing; inspect the GA4 BigQuery link now';

EXECUTE IMMEDIATE FORMAT(
  "SELECT COUNT(*) " ||
  "FROM `PROJECT_ID.analytics_PROPERTY_ID.%s` " ||
  "WHERE event_name = 'export_health_canary'",
  checked_table
) INTO canary_count;

ASSERT canary_count > 0
  AS 'GA4 export canary is missing; inspect its scheduler and the export link';
```

On an alert, first open the Cloud Scheduler job and check the expected date's
execution. Then check its secret, payload, and the prior verified canary; **GA4
Admin** > **Product links** > **BigQuery links**; the Cloud billing account and
payment method; the one-million-event standard-property limit; and the export
service-account permissions. Record the missing date in issue #683 or a
follow-up incident. Do not unlink casually: missed data cannot be re-exported,
and relinking can create another gap.

### 11. Measure initial monthly cost

After 30 complete export days, replace `BASELINE_START_DATE` with the recorded
first complete export date and run this usage query. It fixes both measurements
to the same 30 local calendar days even if the query runs later. Use the region
qualifier that matches the dataset. `JOBS_BY_PROJECT` measures query bytes
billed by this project; a dedicated project keeps the result attributable to
this export.

```sql
DECLARE baseline_start_date DATE DEFAULT DATE 'BASELINE_START_DATE';
DECLARE baseline_end_date DATE DEFAULT DATE_ADD(
  baseline_start_date,
  INTERVAL 30 DAY
);

WITH storage AS (
  SELECT
    SUM(total_logical_bytes) AS logical_bytes
  FROM `PROJECT_ID.region-REGION.INFORMATION_SCHEMA.TABLE_STORAGE_BY_PROJECT`
  WHERE table_schema = 'analytics_PROPERTY_ID'
    AND table_name >= FORMAT_DATE('events_%Y%m%d', baseline_start_date)
    AND table_name < FORMAT_DATE('events_%Y%m%d', baseline_end_date)
    AND deleted = FALSE
),
queries AS (
  SELECT
    SUM(total_bytes_billed) AS query_bytes_billed
  FROM `PROJECT_ID.region-REGION.INFORMATION_SCHEMA.JOBS_BY_PROJECT`
  WHERE creation_time >= TIMESTAMP(baseline_start_date, 'PROPERTY_TIME_ZONE')
    AND creation_time < TIMESTAMP(baseline_end_date, 'PROPERTY_TIME_ZONE')
    AND job_type = 'QUERY'
    AND state = 'DONE'
    AND error_result IS NULL
    AND statement_type != 'SCRIPT'
)
SELECT
  storage.logical_bytes,
  storage.logical_bytes / POW(1024, 3) AS logical_gib,
  queries.query_bytes_billed,
  queries.query_bytes_billed / POW(1024, 4) AS query_tib_billed
FROM storage
CROSS JOIN queries;
```

Then open **Billing** > **Reports** with `PROJECT_ID` selected:

1. Set the start date to the recorded inclusive start and the displayed end
   date to the day before the recorded exclusive end. This is the same fixed
   30-day period as the query.
2. Group by **Service** and filter **Services** to **BigQuery**.
3. Record gross cost, credits, and net cost in the decision record. A zero net
   cost is expected inside the free allowance, but record the storage and query
   usage too so future growth can be projected.
4. Recheck the budget recipients and query quotas after seeing the baseline.
5. Repeat quarterly, and whenever a new recurring warehouse query is added.

Success is a decision-record entry that separately names the period, logical
GiB stored, TiB queried, gross cost, credits, and net billed cost. Do not record
two unlabeled numbers or call a free-tier result evidence that usage was zero.

## Acceptance-criteria handoff

Do not tick a box based on this file existing. Tick it only after the named
evidence is recorded.

- [x] Production GA4 retention is 14 months: verified by Mark on 2026-08-21,
      already set, no change needed.
- [x] Production disclosure gate cleared: PR #736 deployed at `cc5a81c` on
      2026-08-21, verified live by Mark, with #665 still out of production.
- [x] Billing-enabled non-sandbox project and region: `cribbage-trainer-analytics`
      on a paid account, dataset `analytics_458709208` in `northamerica-northeast2`.
- [ ] Daily export active before #665 deploys: GA4 link details plus submission
      time earlier than the production deployment of #665.
- [ ] One daily table queried for #250: six positive event counts and no missing
      expected parameters from section 8.
- [ ] Dataset and table expiration explicit: dataset default, every preexisting
      daily table, and a newly created table match the recorded raw-data policy.
- [ ] Billing alerts and query safeguards: budget thresholds and recipients,
      both daily quotas, and per-query maximum recorded.
- [ ] #665 deployment gate satisfied: export active, verified against an exact
      daily table, retained for 425 days, cost-controlled, and monitored end to
      end before #665 reaches production.
- [ ] Monthly storage and query cost measured as a follow-up: section 11 records
      30 complete post-deployment days without blocking #665 on evidence its
      production workload must exist to generate.
- [ ] Operational monitoring works: Cloud Scheduler's canary appears in its
      daily table, the scheduled assertion succeeds, and its negative check
      delivers a failure email to the owner.

The Privacy Policy's warehouse-retention sentence is authored in PR #732. Do
not edit `src/ui-react/PrivacyPolicy.tsx` in #683, but do not enable the export
until section 0's production-disclosure gate is satisfied.

## Primary references

- [Set up GA4 BigQuery Export](https://support.google.com/analytics/answer/9823238)
- [GA4 BigQuery Export behavior](https://support.google.com/analytics/answer/9358801)
- [GA4 BigQuery export schema](https://support.google.com/analytics/answer/7029846)
- [GA4 data retention](https://support.google.com/analytics/answer/7667196)
- [BigQuery locations](https://cloud.google.com/bigquery/docs/locations)
- [Update dataset expiration](https://cloud.google.com/bigquery/docs/updating-datasets)
- [Update table expiration](https://cloud.google.com/bigquery/docs/managing-tables)
- [BigQuery query cost controls](https://cloud.google.com/bigquery/docs/best-practices-costs)
- [BigQuery custom query quotas](https://cloud.google.com/bigquery/docs/custom-quotas)
- [BigQuery pricing](https://cloud.google.com/bigquery/pricing)
- [Cloud Billing budgets](https://cloud.google.com/billing/docs/how-to/budgets)
- [Cloud Billing spend caps](https://cloud.google.com/billing/docs/how-to/budgets-spend-caps)
- [Schedule BigQuery queries](https://cloud.google.com/bigquery/docs/scheduling-queries)
- [BigQuery transfer failure notifications](https://cloud.google.com/bigquery/docs/transfer-run-notifications)
