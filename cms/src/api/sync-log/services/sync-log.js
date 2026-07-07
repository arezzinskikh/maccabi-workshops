'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::sync-log.sync-log');
