"use strict";

// Grants public read (find/findOne) on the given content-type UIDs so their
// data is returned by unauthenticated /api requests and via populate on other
// public entities. Strapi stores users-permissions role state in the DB, so we
// reconcile it on every boot instead of expecting it to survive schema changes.
async function ensurePublicRead(strapi, uids) {
  const pluginStore = strapi.store({
    type: "plugin",
    name: "users-permissions",
  });
  const publicRole = await strapi
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: "public" } });
  if (!publicRole) return;

  for (const uid of uids) {
    for (const action of ["find", "findOne"]) {
      const permissionAction = `${uid}.${action}`;
      const existing = await strapi
        .query("plugin::users-permissions.permission")
        .findOne({ where: { action: permissionAction, role: publicRole.id } });
      if (!existing) {
        await strapi
          .query("plugin::users-permissions.permission")
          .create({ data: { action: permissionAction, role: publicRole.id } });
      }
    }
  }
  // Touch the plugin store so cached grants get invalidated on next request.
  await pluginStore.set({
    key: "grant",
    value: (await pluginStore.get({ key: "grant" })) ?? {},
  });
}

module.exports = {
  register({ strapi }) {},
  async bootstrap({ strapi }) {
    await ensurePublicRead(strapi, [
      "api::instructor.instructor",
      "api::city.city",
    ]);
  },
};
