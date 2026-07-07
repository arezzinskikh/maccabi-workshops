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
      const data = {
        source_slug: source.slug,
        external_id: externalId,
        title: toStr(getPath(item, fields.title)) ?? undefined,
        description: toStr(getPath(item, fields.description)) ?? undefined,
        slug: fields.slug ? toStr(getPath(item, fields.slug)) ?? undefined : undefined,
        registration_link: fields.registration_link ? toStr(getPath(item, fields.registration_link)) ?? undefined : undefined,
        cost: fields.cost ? toStr(getPath(item, fields.cost)) ?? undefined : undefined,
        age_range: fields.age_range ? toStr(getPath(item, fields.age_range)) ?? undefined : undefined,
        long_description: fields.long_description ? toStr(getPath(item, fields.long_description)) ?? undefined : undefined,
        target_audience: fields.target_audience ? toStr(getPath(item, fields.target_audience)) ?? undefined : undefined,
        what_youll_learn: fields.what_youll_learn ? toStr(getPath(item, fields.what_youll_learn)) ?? undefined : undefined,
        prerequisites: fields.prerequisites ? toStr(getPath(item, fields.prerequisites)) ?? undefined : undefined,
      };
      if (fields.hours) {
        const hoursRaw = getPath(item, fields.hours);
        const hoursNum = hoursRaw == null ? null : Number(hoursRaw);
        if (Number.isFinite(hoursNum)) data.hours = hoursNum;
      }
      if (fields.sort_order) {
        const soRaw = getPath(item, fields.sort_order);
        const soNum = soRaw == null ? null : Number(soRaw);
        if (Number.isFinite(soNum)) data.sort_order = soNum;
      }
      if (source.default_category?.id) {
        data.category = source.default_category.id;
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
