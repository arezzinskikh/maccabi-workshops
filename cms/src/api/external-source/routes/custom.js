'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/external-sources/:id/sync',
      handler: 'api::external-source.external-source.sync',
      config: {
        // Keep default auth policy — requires a valid Strapi API token.
        // The frontend proxies here after admin cookie validation.
        policies: [],
      },
    },
  ],
};
