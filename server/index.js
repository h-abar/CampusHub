import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/campushub',
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

/* ---------- schema auto-init ---------- */
async function initSchema() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('[db] schema ready');
}

/* ---------- row <-> json mappers ---------- */
const adminToJson = (r) => ({
  id: r.id, username: r.username, name: r.name, email: r.email, role: r.role,
  department: r.department, password: r.password, active: r.active,
  services: r.services ?? [], createdAt: r.created_at,
});
const adminFromJson = (a) => [
  a.id, a.username, a.name ?? null, a.email ?? null, a.role ?? 'admin',
  a.department ?? null, a.password, a.active ?? true, JSON.stringify(a.services ?? []),
];

const venueToJson = (r) => ({
  id: r.id, nameAr: r.name_ar, nameEn: r.name_en, category: r.category,
  capacity: r.capacity, capacityByEventType: r.capacity_by_event_type ?? undefined,
  area: r.area ?? undefined, location: r.location, floor: r.floor ?? undefined,
  amenities: r.amenities ?? [], features: r.features ?? [],
  image: r.image ?? undefined, hourlyRate: r.hourly_rate ?? undefined,
  dailyRate: r.daily_rate ?? undefined, adjacentTo: r.adjacent_to ?? undefined,
  enabled: r.enabled,
});
const venueFromJson = (v) => [
  v.id, v.nameAr, v.nameEn ?? null, v.category ?? null, v.capacity ?? 0,
  v.capacityByEventType ? JSON.stringify(v.capacityByEventType) : null,
  v.area ?? null, v.location ?? null, v.floor ?? null,
  JSON.stringify(v.amenities ?? []), JSON.stringify(v.features ?? []),
  v.image ?? null, v.hourlyRate ?? null, v.dailyRate ?? null,
  v.adjacentTo ?? null, v.enabled ?? true,
];

const requestToJson = (r) => ({
  id: r.id, trackingCode: r.tracking_code, serviceType: r.service_type,
  title: r.title, description: r.description, requestDate: r.request_date,
  eventDates: r.event_dates ?? [], venues: r.venues ?? [],
  status: r.status, statusHistory: r.status_history ?? [], priority: r.priority ?? 'normal',
  requesterName: r.requester_name, requesterEmail: r.requester_email,
  requesterPhone: r.requester_phone, requesterDepartment: r.requester_department,
  requesterType: r.requester_type, externalEntity: r.external_entity ?? undefined,
  additionalNotes: r.additional_notes ?? undefined, adminNotes: r.admin_notes ?? undefined,
  venueEventType: r.venue_event_type ?? undefined, newsDate: r.news_date ?? undefined,
  publishingChannels: r.publishing_channels ?? undefined, designLanguage: r.design_language ?? undefined,
  targetAudience: r.target_audience ?? undefined, designCategory: r.design_category ?? undefined,
  designLinks: r.design_links ?? undefined, designLogos: r.design_logos ?? undefined,
  workshopAttachments: r.workshop_attachments ?? undefined, designBrief: r.design_brief ?? undefined,
  otherEventType: r.other_event_type ?? undefined, needsVenueBooking: r.needs_venue_booking ?? undefined,
  needsDocumentation: r.needs_documentation ?? undefined, documentationType: r.documentation_type ?? undefined,
  supportServices: r.support_services ?? undefined, expectedVisitors: r.expected_visitors ?? undefined,
  visitorGender: r.visitor_gender ?? undefined,
});
const requestFromJson = (q) => [
  q.id, q.trackingCode, q.serviceType, q.title, q.description ?? null, q.requestDate ?? null,
  JSON.stringify(q.eventDates ?? []), JSON.stringify(q.venues ?? []),
  q.status ?? 'pending', JSON.stringify(q.statusHistory ?? []), q.priority ?? 'normal',
  q.requesterName, q.requesterEmail ?? null, q.requesterPhone ?? null,
  q.requesterDepartment ?? null, q.requesterType ?? 'internal', q.externalEntity ?? null,
  q.additionalNotes ?? null, q.adminNotes ?? null,
  q.venueEventType ?? null, q.newsDate ?? null,
  q.publishingChannels ? JSON.stringify(q.publishingChannels) : null,
  q.designLanguage ?? null, q.targetAudience ?? null, q.designCategory ?? null,
  q.designLinks ?? null, q.designLogos ? JSON.stringify(q.designLogos) : null,
  q.workshopAttachments ? JSON.stringify(q.workshopAttachments) : null,
  q.designBrief ?? null, q.otherEventType ?? null,
  q.needsVenueBooking ?? null, q.needsDocumentation ?? null, q.documentationType ?? null,
  q.supportServices ? JSON.stringify(q.supportServices) : null,
  q.expectedVisitors ?? null, q.visitorGender ?? null,
];

const asyncRoute = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error('[api]', e);
  res.status(500).json({ error: e.message });
});

/* ---------- health & bootstrap ---------- */
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.get('/api/bootstrap-state', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT (SELECT count(*) FROM admins) AS admins, (SELECT count(*) FROM requests) AS requests');
  res.json({ empty: Number(rows[0].admins) === 0 && Number(rows[0].requests) === 0 });
}));

app.post('/api/bootstrap', asyncRoute(async (req, res) => {
  const { admins = [], venues = [], requests = [], settings = null } = req.body || {};
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const a of admins) {
      await client.query(
        `INSERT INTO admins (id, username, name, email, role, department, password, active, services)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
        adminFromJson(a)
      );
    }
    for (const v of venues) {
      await client.query(
        `INSERT INTO venues (id, name_ar, name_en, category, capacity, capacity_by_event_type, area, location, floor, amenities, features, image, hourly_rate, daily_rate, adjacent_to, enabled)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (id) DO NOTHING`,
        venueFromJson(v)
      );
    }
    for (const q of requests) {
      await client.query(
        `INSERT INTO requests (id, tracking_code, service_type, title, description, request_date, event_dates, venues, status, status_history, priority, requester_name, requester_email, requester_phone, requester_department, requester_type, external_entity, additional_notes, admin_notes, venue_event_type, news_date, publishing_channels, design_language, target_audience, design_category, design_links, design_logos, workshop_attachments, design_brief, other_event_type, needs_venue_booking, needs_documentation, documentation_type, support_services, expected_visitors, visitor_gender)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36) ON CONFLICT (id) DO NOTHING`,
        requestFromJson(q)
      );
    }
    if (settings) {
      await client.query(
        `INSERT INTO settings (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
        [JSON.stringify(settings)]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

/* ---------- auth ---------- */
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { username, password } = req.body || {};
  const { rows } = await pool.query(
    'SELECT * FROM admins WHERE username = $1 AND active = TRUE AND password = $2',
    [String(username || '').trim(), password]
  );
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
  const a = rows[0];
  res.json({ id: a.id, username: a.username, email: a.email, role: a.role, department: a.department, name: a.name });
}));

/* ---------- requests ---------- */
app.get('/api/requests', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM requests ORDER BY created_at DESC');
  res.json(rows.map(requestToJson));
}));

app.post('/api/requests', asyncRoute(async (req, res) => {
  const q = req.body;
  const { rows } = await pool.query(
    `INSERT INTO requests (id, tracking_code, service_type, title, description, request_date, event_dates, venues, status, status_history, priority, requester_name, requester_email, requester_phone, requester_department, requester_type, external_entity, additional_notes, admin_notes, venue_event_type, news_date, publishing_channels, design_language, target_audience, design_category, design_links, design_logos, workshop_attachments, design_brief, other_event_type, needs_venue_booking, needs_documentation, documentation_type, support_services, expected_visitors, visitor_gender)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36)
     RETURNING *`,
    requestFromJson(q)
  );
  res.status(201).json(requestToJson(rows[0]));
}));

app.patch('/api/requests/:id', asyncRoute(async (req, res) => {
  const patch = req.body || {};
  const map = {
    trackingCode: 'tracking_code', serviceType: 'service_type', title: 'title',
    description: 'description', requestDate: 'request_date', status: 'status',
    priority: 'priority', requesterName: 'requester_name', requesterEmail: 'requester_email',
    requesterPhone: 'requester_phone', requesterDepartment: 'requester_department',
    requesterType: 'requester_type', externalEntity: 'external_entity',
    additionalNotes: 'additional_notes', adminNotes: 'admin_notes',
    venueEventType: 'venue_event_type', newsDate: 'news_date',
    designLanguage: 'design_language', targetAudience: 'target_audience',
    designCategory: 'design_category', designLinks: 'design_links',
    designBrief: 'design_brief', otherEventType: 'other_event_type',
    needsVenueBooking: 'needs_venue_booking', needsDocumentation: 'needs_documentation',
    documentationType: 'documentation_type', expectedVisitors: 'expected_visitors',
    visitorGender: 'visitor_gender',
  };
  const jsonFields = {
    eventDates: 'event_dates', venues: 'venues', statusHistory: 'status_history',
    publishingChannels: 'publishing_channels', designLogos: 'design_logos',
    workshopAttachments: 'workshop_attachments', supportServices: 'support_services',
  };
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [k, col] of Object.entries(map)) {
    if (patch[k] !== undefined) { sets.push(`${col} = $${i++}`); vals.push(patch[k]); }
  }
  for (const [k, col] of Object.entries(jsonFields)) {
    if (patch[k] !== undefined) { sets.push(`${col} = $${i++}`); vals.push(JSON.stringify(patch[k])); }
  }
  if (!sets.length) return res.status(400).json({ error: 'empty patch' });
  sets.push(`updated_at = now()`);
  vals.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE requests SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(requestToJson(rows[0]));
}));

/* ---------- venues ---------- */
app.get('/api/venues', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM venues ORDER BY capacity DESC');
  res.json(rows.map(venueToJson));
}));

app.post('/api/venues', asyncRoute(async (req, res) => {
  const v = req.body;
  const { rows } = await pool.query(
    `INSERT INTO venues (id, name_ar, name_en, category, capacity, capacity_by_event_type, area, location, floor, amenities, features, image, hourly_rate, daily_rate, adjacent_to, enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    venueFromJson(v)
  );
  res.status(201).json(venueToJson(rows[0]));
}));

app.patch('/api/venues/:id', asyncRoute(async (req, res) => {
  const patch = req.body || {};
  const map = {
    nameAr: 'name_ar', nameEn: 'name_en', category: 'category', capacity: 'capacity',
    area: 'area', location: 'location', floor: 'floor', image: 'image',
    hourlyRate: 'hourly_rate', dailyRate: 'daily_rate', adjacentTo: 'adjacent_to', enabled: 'enabled',
  };
  const jsonFields = { amenities: 'amenities', features: 'features', capacityByEventType: 'capacity_by_event_type' };
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [k, col] of Object.entries(map)) {
    if (patch[k] !== undefined) { sets.push(`${col} = $${i++}`); vals.push(patch[k]); }
  }
  for (const [k, col] of Object.entries(jsonFields)) {
    if (patch[k] !== undefined) { sets.push(`${col} = $${i++}`); vals.push(JSON.stringify(patch[k])); }
  }
  if (!sets.length) return res.status(400).json({ error: 'empty patch' });
  vals.push(req.params.id);
  const { rows } = await pool.query(`UPDATE venues SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(venueToJson(rows[0]));
}));

/* ---------- admins ---------- */
app.get('/api/admins', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM admins ORDER BY created_at ASC');
  res.json(rows.map(adminToJson));
}));

app.post('/api/admins', asyncRoute(async (req, res) => {
  const a = req.body;
  const { rows } = await pool.query(
    `INSERT INTO admins (id, username, name, email, role, department, password, active, services)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    adminFromJson(a)
  );
  res.status(201).json(adminToJson(rows[0]));
}));

app.patch('/api/admins/:id', asyncRoute(async (req, res) => {
  const patch = req.body || {};
  const map = { name: 'name', email: 'email', role: 'role', department: 'department', password: 'password', active: 'active' };
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [k, col] of Object.entries(map)) {
    if (patch[k] !== undefined) { sets.push(`${col} = $${i++}`); vals.push(patch[k]); }
  }
  if (patch.services !== undefined) { sets.push(`services = $${i++}`); vals.push(JSON.stringify(patch.services)); }
  if (!sets.length) return res.status(400).json({ error: 'empty patch' });
  vals.push(req.params.id);
  const { rows } = await pool.query(`UPDATE admins SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(adminToJson(rows[0]));
}));

app.delete('/api/admins/:id', asyncRoute(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM admins WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
}));

/* ---------- settings ---------- */
app.get('/api/settings', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT data FROM settings WHERE id = 1');
  res.json(rows[0]?.data ?? null);
}));

app.put('/api/settings', asyncRoute(async (req, res) => {
  await pool.query(
    `INSERT INTO settings (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(req.body)]
  );
  res.json({ ok: true });
}));

/* ---------- serve built frontend (production single-service deploy) ---------- */
const distDir = join(__dirname, '..', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback — every non-API GET returns index.html
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(distDir, 'index.html')));
  console.log('[static] serving dist/');
}

/* ---------- boot ---------- */
initSchema()
  .catch((e) => {
    // API endpoints will error, but we still serve the frontend so the site
    // stays up in localStorage mode until the DB is provisioned.
    console.error('[db] connection failed:', e.message);
    console.error('[db] set DATABASE_URL — API disabled, static site still served.');
  })
  .finally(() =>
    app.listen(PORT, () => console.log(`[api] CampusHub server on http://localhost:${PORT}`))
  );
