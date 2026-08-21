# GA4 BigQuery export runbook

Use this runbook to create, verify, and operate the production GA4 daily export.
It covers issue #683. It does not grant access to Google Analytics or Google
Cloud, so every console result must be recorded by the person who performed it.

The export must be active before #665 is deployed. Google does not re-export
data missed while billing or the link is unavailable, and a standard property
whose daily export is paused for exceeding its event limit does not have the
missed days reprocessed.

## Decision record

Answer these questions before creating the link. Replace `Pending` only after
the decision is made and the console work confirms it.

### Decisions Mark must make

#### Dataset region

- **Question for Mark:** use Toronto, `northamerica-northeast2`?
- **Recommendation:** yes. It keeps the raw data in Canada and close to its
  operator.
- **Trade-off:** the `US` multi-region has broader cross-service compatibility.
  Changing later requires a migration and can create an export gap.
- **Recorded value:** Pending.

#### Raw-data retention

- **Question for Mark:** keep raw tables with no expiration?
- **Recommendation:** yes. That best serves durable longitudinal analysis and
  should remain inside BigQuery's free storage allowance initially.
- **Trade-off:** storage grows without a fixed bound. Measure cost after 30 days
  and quarterly. A finite policy limits cost but permanently deletes history.
- **Recorded value:** Pending.

#### Monthly budget amount

- **Question for Mark:** set the monthly budget to 5 in the billing account's
  currency?
- **Recommendation:** yes. It is intentionally low for an export expected to
  cost zero or nearly zero.
- **Trade-off:** a lower amount alerts earlier but may be noisy; a higher amount
  delays detection. A budget alerts but does not cap spend.
- **Recorded value:** Pending.

#### Operational owner

- **Question for Mark:** make Mark's durable Google account the owner and alert
  recipient?
- **Recommendation:** yes, and name a second administrator if one is available.
- **Trade-off:** one owner is simplest but creates a single-person failure risk.
- **Recorded value:** Pending.

### Console evidence to record

- **BigQuery project ID:** Pending. Use a dedicated billing-enabled project so
  costs and query quotas isolate this export.
- **GA4 property ID:** Pending. Copy the production property ID, not the test
  property.
- **Export dataset:** Pending. Google creates `analytics_<property_id>` after
  the link is submitted.
- **Link submitted at:** Pending. Record an ISO 8601 time and time zone.
- **First daily table verified:** Pending. Record the exact
  `events_YYYYMMDD` table and query date.
- **Retention confirmed by:** Pending. Record the account and date that checked
  dataset and table expiration.
- **Cost baseline period:** Pending. Use the first 30 complete export days.
- **Measured monthly cost:** Pending. Record storage usage, query bytes, gross
  cost, credits, and net billed amount separately.
- **Missing-table alert recipient:** Pending. Use the operational owner, plus a
  backup if one exists.

## Placeholders used below

Before running SQL, replace all uppercase placeholders:

- `PROJECT_ID`: the billing-enabled Google Cloud project ID.
- `PROPERTY_ID`: the numeric production GA4 property ID.
- `YYYYMMDD`: the suffix of one exported daily table.
- `REGION`: the BigQuery region, such as `northamerica-northeast2`.

Do not put `deal_nonce` in GA4 custom definitions. It is a UUID per hand, so it
would immediately create a high-cardinality dimension and collapse in GA4
reports. BigQuery can query and join it directly without registering it.

## Console checklist

### 1. Confirm GA4 retention

1. Sign in to Google Analytics and use the property selector to select the
   production Cribbage Trainer property. Confirm its property ID against the
   decision record.
2. Open **Admin**.
3. Under the property settings, open **Data collection and modification** >
   **Data retention**. Google's older navigation labels the same page
   **Data Settings** > **Data Retention**.
4. Set **Event data retention** to **14 months**.
5. Confirm **Reset user data on new activity** is off. That matches the current
   policy decision and prevents an active user identifier from being retained
   indefinitely; this switch affects user-level data only.
6. Click **Save**.
7. Reopen **Data retention** and confirm the page still shows **14 months** and
   reset off. Record the verifier and date in the decision record.

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

1. In **BigQuery** > **Explorer**, open `analytics_PROPERTY_ID` and select its
   **Details** tab.
2. Click **Edit details**.
3. If Mark chose no expiration, leave **Enable table expiration** off. If Mark
   chose a finite policy, enable it and enter the chosen **Default maximum table
   age** in days.
4. Click **Save**, reopen **Details**, and confirm **Default table expiration**
   shows the chosen value or **Never**.
5. Open the first `events_YYYYMMDD` table and inspect **Details**. Confirm its
   **Expiration time** follows the policy. A dataset default change affects new
   tables, not tables that already exist, so clear or set the first table's
   expiration separately if it does not match.
6. Check a newly created daily table after the next export. Confirm it inherited
   the dataset policy.

For no expiration, both the dataset default and each sampled daily table must
say **Never**. Merely upgrading from sandbox does not prove that a table's old
60-day expiration was removed.

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

### 7. Configure query-cost safeguards

1. Open **IAM & Admin** > **Quotas & System Limits**.
2. Filter **Service** to **BigQuery API**.
3. Select **Query usage per day** and **Query usage per day per user**, then
   click **Edit**.
4. Recommendation: set the project quota to `0.01 TiB` per day and the per-user
   quota to `0.005 TiB` per day. That is roughly 10.24 GiB and 5.12 GiB,
   respectively. That is far above the expected verification queries but low
   enough to
   stop an accidental broad scan. Record different values if normal work needs
   more headroom.
5. Submit the quota changes and confirm the overrides appear in the quota list.
6. In **BigQuery**, open the query editor and choose **Edit** > **Query
   settings** > **Advanced options**. Set **Maximum bytes billed** to
   `1073741824` (1 GiB) for interactive verification queries and click **Save**.
7. Before every query, wait for the editor's byte estimate. Do not run it if the
   estimate is unexpectedly large. A `LIMIT` does not reduce bytes read from an
   unclustered table.

Success is a visible project and per-user custom quota plus a 1 GiB per-query
limit in the query editor. Custom quotas are approximate safeguards, not exact
spending caps.

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
    SELECT ANY_VALUE(
      COALESCE(
        param.value.double_value,
        CAST(param.value.int_value AS FLOAT64)
      )
    ) = 1
    FROM UNNEST(event_params) AS param
    WHERE param.key = 'generated_from_seed'
  ) AS generated_from_seed,
  (
    SELECT ANY_VALUE(
      COALESCE(
        param.value.double_value,
        CAST(param.value.int_value AS FLOAT64)
      )
    ) = 1
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

Values should match the production interaction. `deal_nonce` should join the
events from one hand; Deal should create a new nonce whose `hand_started`
precedes `deal_clicked`.

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
      SELECT ANY_VALUE(
        COALESCE(
          param.value.double_value,
          CAST(param.value.int_value AS FLOAT64)
        )
      ) = 1
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'is_optimal'
    ) AS is_optimal,
    (
      SELECT ANY_VALUE(
        COALESCE(
          param.value.double_value,
          CAST(param.value.int_value AS FLOAT64)
        )
      ) = 1
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'is_first_analysis'
    ) AS is_first_analysis,
    (
      SELECT ANY_VALUE(
        COALESCE(
          param.value.double_value,
          CAST(param.value.int_value AS FLOAT64)
        )
      ) = 1
      FROM UNNEST(event_params) AS param
      WHERE param.key = 'generated_from_seed'
    ) AS generated_from_seed
  FROM `PROJECT_ID.analytics_PROPERTY_ID.events_YYYYMMDD`
  WHERE event_name = 'discard_scored'
),
population_skill AS (
  SELECT *
  FROM discard_scored
  WHERE is_first_analysis = TRUE
    AND generated_from_seed = FALSE
    AND hand_start_source IN ('initial', 'deal')
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
hands. Keep other sources as separately segmented practice data.

### 10. Alert when a daily export table is missing

The GA4 link is not a BigQuery Data Transfer configuration with a failure-email
toggle, so create a scheduled assertion that fails when an expected daily table
is absent. Its own failed-run notification is the durable signal.

1. In **BigQuery**, select `PROJECT_ID`, open **Scheduled queries**, and click
   **Create scheduled query**.
2. Name it `GA4 daily export health`.
3. Paste the SQL below after replacing the project and property placeholders.
   Keep `@run_time`; BigQuery supplies it to scheduled queries.
4. Set **Repeats** to **Daily** at an off-the-hour UTC time. Recommendation:
   `18:05 UTC`. The query checks two reporting dates back, allowing the normal
   daily export more than a full day to arrive without waiting so long that a
   gap goes unnoticed.
5. Set **Processing location** to the recorded dataset region. Leave destination
   table settings empty because this assertion writes no result table.
6. Under **Notification options**, enable **Send email notifications**. Confirm
   the scheduled query owner is the recorded operational owner.
7. Save it, open its details, and choose **Schedule backfill** or **Run now** for
   a date known to have a table. Confirm the run succeeds.
8. Negative-check the alert once: temporarily change `PROPERTY_ID` in a copy of
   the query to a nonexistent dataset or change the expected table prefix, run
   it, and confirm the owner receives a BigQuery Data Transfer Service failure
   email. Delete the test copy afterwards.

```sql
DECLARE checked_date DATE DEFAULT DATE_SUB(
  DATE(@run_time, 'America/Toronto'),
  INTERVAL 2 DAY
);

ASSERT (
  SELECT COUNT(*) = 1
  FROM `PROJECT_ID.analytics_PROPERTY_ID.INFORMATION_SCHEMA.TABLES`
  WHERE table_name = FORMAT_DATE('events_%Y%m%d', checked_date)
) AS 'GA4 daily export table is missing; inspect the GA4 BigQuery link now';
```

On an alert, immediately check **GA4 Admin** > **Product links** > **BigQuery
links**, the Cloud billing account and payment method, the one-million-event
standard-property limit, and the export service-account permissions. Record the
missing date in issue #683 or a follow-up incident. Do not unlink casually:
missed data cannot be re-exported, and relinking can create another gap.

### 11. Measure initial monthly cost

After 30 complete export days, run this usage query. Use the region qualifier
that matches the dataset. `JOBS_BY_PROJECT` measures query bytes billed by this
project; a dedicated project keeps the result attributable to this export.

```sql
WITH storage AS (
  SELECT
    SUM(total_logical_bytes) AS logical_bytes
  FROM `PROJECT_ID.region-REGION.INFORMATION_SCHEMA.TABLE_STORAGE_BY_PROJECT`
  WHERE table_schema = 'analytics_PROPERTY_ID'
    AND deleted = FALSE
),
queries AS (
  SELECT
    SUM(total_bytes_billed) AS query_bytes_billed
  FROM `PROJECT_ID.region-REGION.INFORMATION_SCHEMA.JOBS_BY_PROJECT`
  WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
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

1. Set the date range to the same 30 complete days.
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

- [ ] Production GA4 retention is 14 months: saved setting and verifier/date.
- [ ] Billing-enabled non-sandbox project and region: project billing overview,
      dataset details, and completed region decision.
- [ ] Daily export active before #665 deploys: GA4 link details plus submission
      time earlier than the production deployment of #665.
- [ ] One daily table queried for #250: six positive event counts and no missing
      expected parameters from section 8.
- [ ] Dataset and table expiration explicit: dataset default plus two sampled
      daily tables match the recorded raw-data policy.
- [ ] Billing alerts and query safeguards: budget thresholds and recipients,
      both daily quotas, and per-query maximum recorded.
- [ ] Monthly storage and query cost measured: section 11 recorded after 30
      complete days.
- [ ] #665 keeps #683 as a deployment prerequisite: #665 and PR #732 both state
      it; do not remove the draft/merge block before the evidence above exists.
- [ ] Operational monitoring works: scheduled assertion succeeds for a present
      table and its negative check delivers a failure email to the owner.

The Privacy Policy's warehouse-retention sentence is handled in PR #732. Do not
edit `src/ui-react/PrivacyPolicy.tsx` in #683.

## Primary references

- [Set up GA4 BigQuery Export](https://support.google.com/analytics/answer/9823238)
- [GA4 BigQuery Export behavior](https://support.google.com/analytics/answer/9358801)
- [GA4 BigQuery export schema](https://support.google.com/analytics/answer/7029846)
- [GA4 data retention](https://support.google.com/analytics/answer/7667196)
- [BigQuery locations](https://cloud.google.com/bigquery/docs/locations)
- [Update dataset expiration](https://cloud.google.com/bigquery/docs/updating-datasets)
- [BigQuery query cost controls](https://cloud.google.com/bigquery/docs/best-practices-costs)
- [BigQuery custom query quotas](https://cloud.google.com/bigquery/docs/custom-quotas)
- [Cloud Billing budgets](https://cloud.google.com/billing/docs/how-to/budgets)
- [Schedule BigQuery queries](https://cloud.google.com/bigquery/docs/scheduling-queries)
- [BigQuery transfer failure notifications](https://cloud.google.com/bigquery/docs/transfer-run-notifications)
