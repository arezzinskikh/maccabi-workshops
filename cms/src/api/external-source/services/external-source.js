'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
const { fetchExternal } = require('../../../utils/http-client');

// Follow a dot-notation path through an object. Supports numeric segments
// for array indexing, e.g. `data.items.0.title`. Returns undefined if any
// segment is missing so the caller can decide whether the field is optional.
function getPath(obj, path) {
  if (obj == null || !path) return undefined;
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function toStr(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v.trim() || null;
  return String(v);
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.trim().toLowerCase() === 'true';
  return Boolean(v);
}

// Some source feeds use compact 8-digit dates (YYYYMMDD) instead of ISO
// (YYYY-MM-DD), which Strapi's `date` field type rejects outright.
function toISODate(v) {
  const s = toStr(v);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return null;
}

// Strapi's `time` field type requires `HH:mm:ss.SSS`, but source feeds
// commonly give bare `HH:mm`.
function toTime(v) {
  const s = toStr(v);
  if (!s) return null;
  const parts = s.split(':');
  if (parts.length === 2) return `${s}:00.000`;
  if (parts.length === 3) return parts[2].includes('.') ? s : `${s}.000`;
  return null;
}

// Strapi's `email` field type rejects malformed addresses outright; source
// feeds sometimes contain garbage contact info (typos, non-Latin gibberish).
// Rather than fail the whole workshop record, drop the bad email like any
// other unparseable optional value.
const EMAIL_RE = /^[^\s@]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
function toEmail(v) {
  const s = toStr(v);
  if (!s) return null;
  return EMAIL_RE.test(s) ? s : null;
}

// Phonetic Hebrew -> Latin transliteration, used only to build a readable
// ASCII `uid` slug (Strapi's `uid` field type hard-rejects non-ASCII via
// `/^[A-Za-z0-9-_.~]*$/`). Aleph/ayin are silent glottal stops and dropped.
const HEBREW_TRANSLIT = {
  א: '', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v', ז: 'z', ח: 'ch', ט: 't',
  י: 'y', כ: 'k', ך: 'k', ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n', ס: 's',
  ע: '', פ: 'p', ף: 'f', צ: 'tz', ץ: 'tz', ק: 'k', ר: 'r', ש: 'sh', ת: 't',
};
function transliterate(str) {
  return Array.from(String(str || ''))
    .map((ch) => (ch in HEBREW_TRANSLIT ? HEBREW_TRANSLIT[ch] : ch))
    .join('');
}

// Builds a readable ASCII `uid` slug (e.g. for `category.slug`), needed
// because that field type is required and isn't auto-generated outside the
// Content Manager admin UI. The human-readable `name` field (any script) is
// what's actually displayed — this is just an internal URL segment.
function slugify(str) {
  const base = transliterate(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `slug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Builds the workshop's public routing/registration URL, mirroring the
// convention used by existing manually-entered workshops: a Hebrew slug
// (spaces/punctuation collapsed to hyphens, script preserved) percent-encoded
// into the path. The frontend derives `workshop.slug` from this same path
// when the CMS `slug` field is blank (see `flattenWorkshop` in api.ts), so
// this is what actually drives `/workshops/[slug]` routing for synced items.
function hebrewSlug(str) {
  return String(str || '')
    .trim()
    .replace(/[\s\-–—]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function buildRegistrationLink(title) {
  const raw = hebrewSlug(title);
  return raw ? `https://workshops.maccabi4u.co.il/workshops/${encodeURIComponent(raw)}/` : null;
}

// Flat scalar `workshop` fields the sync can populate directly from
// `field_map.fields`, grouped by the coercion each needs.
const SCALAR_STRING_FIELDS = [
  'title', 'description', 'slug', 'registration_link', 'cost', 'age_range',
  'long_description', 'target_audience', 'what_youll_learn', 'prerequisites',
  'contact_name', 'contact_phone', 'district_name',
  'branch_name', 'language', 'meeting_address', 'meeting_place_name',
];
const SCALAR_NUMBER_FIELDS = [
  'hours', 'sort_order', 'max_participants', 'num_free_places',
  'num_participants', 'min_age', 'max_age',
];
const SCALAR_DATE_FIELDS = ['cycle_start_date', 'cycle_end_date', 'registration_deadline'];

// `field_map` can additionally carry three optional nested sections for
// sources whose payload nests arrays inside each list item (e.g. a workshop
// cycle with multiple weekly activity slots, categories, or instructors):
//   {
//     "fields": { ...flat scalar map above... },
//     "sessions": { "list_path": "...", "day_name": "...", "time_start": "...", "time_end": "..." },
//     "categories": { "list_path": "...", "name": "..." },
//     "instructors": { "list_path": "...", "first_name": "...", "last_name": "..." },
//     "city": { "name": "..." }
//   }
// All three sections are optional — a source with only a flat `fields` map
// keeps working exactly as before.

async function findOrCreateByName(strapi, uid, name, extraData) {
  const trimmed = toStr(name);
  if (!trimmed) return null;
  const existing = await strapi.db.query(uid).findOne({ where: { name: trimmed } });
  if (existing) return existing.id;
  const created = await strapi.entityService.create(uid, {
    // Publish immediately — otherwise these draft category/instructor/city
    // records exist in the DB but the public API silently returns null for
    // any relation pointing at them (draftAndPublish content is hidden from
    // unauthenticated reads even when correctly linked).
    data: { name: trimmed, publishedAt: new Date().toISOString(), ...extraData },
  });
  return created.id;
}

async function resolveCategory(strapi, map, item, defaultCategoryId) {
  const catMap = map.categories;
  if (catMap && catMap.list_path) {
    const list = getPath(item, catMap.list_path);
    if (Array.isArray(list) && list.length > 0) {
      const name = getPath(list[0], catMap.name);
      const id = await findOrCreateByName(strapi, 'api::category.category', name, {
        slug: slugify(name),
      });
      if (id) return id;
    }
  }
  return defaultCategoryId ?? null;
}

async function resolveInstructor(strapi, map, item) {
  const instMap = map.instructors;
  if (!instMap || !instMap.list_path) return null;
  const list = getPath(item, instMap.list_path);
  if (!Array.isArray(list) || list.length === 0) return null;
  const first = getPath(list[0], instMap.first_name);
  const last = getPath(list[0], instMap.last_name);
  const fullName = [first, last].map(toStr).filter(Boolean).join(' ');
  return findOrCreateByName(strapi, 'api::instructor.instructor', fullName);
}

async function resolveCity(strapi, map, item) {
  const cityMap = map.city;
  if (!cityMap || !cityMap.name) return null;
  const name = getPath(item, cityMap.name);
  return findOrCreateByName(strapi, 'api::city.city', name);
}

// Builds one `workshop.session` component per source activity-date entry.
// These feed rows only describe a recurring weekly slot (weekday + time),
// not a specific calendar date, so `date` is intentionally left unset.
function buildSessions(map, item, instructorId, cityId, isVirtual) {
  const sessMap = map.sessions;
  if (!sessMap || !sessMap.list_path) return null;
  const list = getPath(item, sessMap.list_path);
  if (!Array.isArray(list) || list.length === 0) return null;

  const type = isVirtual === true ? 'online' : isVirtual === false ? 'inperson' : undefined;
  const sessions = list.map((entry) => {
    const session = {
      day_name: toStr(getPath(entry, sessMap.day_name)) ?? undefined,
      time_start: toTime(getPath(entry, sessMap.time_start)) ?? undefined,
      time_end: toTime(getPath(entry, sessMap.time_end)) ?? undefined,
    };
    if (instructorId) session.instructor = instructorId;
    if (cityId) session.city = cityId;
    if (type) session.type = type;
    for (const k of Object.keys(session)) if (session[k] === undefined) delete session[k];
    return session;
  });
  return sessions.length > 0 ? sessions : null;
}

async function performSync(strapi, source) {
  const map = source.field_map || {};
  const fields = map.fields || map; // support flat or nested shape
  if (!fields || typeof fields !== 'object') {
    throw new Error('field_map must be an object with a `fields` mapping');
  }
  if (!fields.external_id) {
    throw new Error('field_map.fields.external_id is required (dedupe key)');
  }

  const payload = await fetchExternal(source);
  const listPath = source.list_path && source.list_path.trim();
  const list = listPath ? getPath(payload, listPath) : payload;
  if (!Array.isArray(list)) {
    throw new Error(`Expected an array at list_path "${listPath || '<root>'}", got ${typeof list}`);
  }

  const results = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (const item of list) {
    try {
      const externalId = toStr(getPath(item, fields.external_id));
      if (!externalId) {
        results.skipped += 1;
        continue;
      }

      const data = { source_slug: source.slug, external_id: externalId };
      for (const key of SCALAR_STRING_FIELDS) {
        if (fields[key]) data[key] = toStr(getPath(item, fields[key])) ?? undefined;
      }
      for (const key of SCALAR_NUMBER_FIELDS) {
        if (fields[key]) data[key] = toNum(getPath(item, fields[key])) ?? undefined;
      }
      for (const key of SCALAR_DATE_FIELDS) {
        if (fields[key]) data[key] = toISODate(getPath(item, fields[key])) ?? undefined;
      }
      if (fields.contact_email) {
        data.contact_email = toEmail(getPath(item, fields.contact_email)) ?? undefined;
      }

      const categoryId = await resolveCategory(strapi, map, item, source.default_category?.id);
      if (categoryId) data.category = categoryId;

      const instructorId = await resolveInstructor(strapi, map, item);
      const cityId = await resolveCity(strapi, map, item);
      const isVirtual = fields.is_virtual ? toBool(getPath(item, fields.is_virtual)) : undefined;
      const sessions = buildSessions(map, item, instructorId, cityId, isVirtual);
      if (sessions) data.sessions = sessions;

      if (!data.registration_link && data.title) {
        data.registration_link = buildRegistrationLink(data.title) ?? undefined;
      }

      for (const k of Object.keys(data)) if (data[k] === undefined) delete data[k];

      const existing = await strapi.db.query('api::workshop.workshop').findOne({
        where: { source_slug: source.slug, external_id: externalId },
      });

      if (existing) {
        await strapi.entityService.update('api::workshop.workshop', existing.id, { data });
        results.updated += 1;
      } else {
        await strapi.entityService.create('api::workshop.workshop', {
          data: { ...data, publishedAt: new Date().toISOString() },
        });
        results.created += 1;
      }
    } catch (err) {
      results.errors.push({
        external_id: toStr(getPath(item, fields.external_id)) ?? null,
        message: err.message,
      });
    }
  }
  return results;
}

module.exports = createCoreService('api::external-source.external-source', ({ strapi }) => ({
  async runSync(sourceId) {
    const startedAt = Date.now();
    let source = null;
    let sourceName = `source #${sourceId}`;
    let fatalError = null;
    let results = { created: 0, updated: 0, skipped: 0, errors: [] };

    try {
      source = await strapi.entityService.findOne('api::external-source.external-source', sourceId, {
        populate: { default_category: true },
      });
      if (!source) throw new Error(`External source ${sourceId} not found`);
      sourceName = source.name;
      if (!source.enabled) throw new Error(`External source "${source.name}" is disabled`);
      results = await performSync(strapi, source);
    } catch (err) {
      fatalError = err.message || String(err);
    }

    const finishedAt = Date.now();
    const status = fatalError ? 'error' : results.errors.length > 0 ? 'partial' : 'ok';
    const summary = `created=${results.created} updated=${results.updated} skipped=${results.skipped} errors=${results.errors.length}`;

    // Log every run — even fatal ones — so operators can debug via the dashboard.
    try {
      await strapi.entityService.create('api::sync-log.sync-log', {
        data: {
          source: source ? source.id : null,
          source_name: sourceName,
          status,
          created_count: results.created,
          updated_count: results.updated,
          skipped_count: results.skipped,
          error_count: results.errors.length,
          errors: results.errors,
          started_at: new Date(startedAt).toISOString(),
          finished_at: new Date(finishedAt).toISOString(),
          duration_ms: finishedAt - startedAt,
          fatal_error: fatalError,
        },
      });
    } catch (logErr) {
      strapi.log.error('[external-source] failed to write sync log', logErr);
    }

    if (source) {
      await strapi.entityService.update('api::external-source.external-source', sourceId, {
        data: {
          last_synced_at: new Date(finishedAt).toISOString(),
          last_sync_status: fatalError
            ? `error: ${fatalError.slice(0, 200)}`
            : results.errors.length
              ? `partial: ${summary}`
              : `ok: ${summary}`,
          last_sync_count: results.created + results.updated,
        },
      });
    }

    if (fatalError) throw new Error(fatalError);
    return results;
  },
}));
