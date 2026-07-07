'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::external-source.external-source', ({ strapi }) => ({
  async sync(ctx) {
    const { id } = ctx.params;
    if (!id) {
      ctx.throw(400, 'source id is required');
    }
    try {
      const results = await strapi
        .service('api::external-source.external-source')
        .runSync(id);
      ctx.body = { ok: true, results };
    } catch (err) {
      strapi.log.error('[external-source.sync] failure', err);
      // Surface a compact error message; keep 502 so the frontend can render "sync failed"
      ctx.status = 502;
      ctx.body = { ok: false, error: err.message || 'sync failed' };
    }
  },
}));
