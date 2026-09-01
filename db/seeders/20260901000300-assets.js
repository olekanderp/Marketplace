"use strict";

const { assets } = require("../fixtures");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      "assets",
      assets.map((a) => ({
        id: a.id,
        seller_id: a.sellerId,
        title: a.title,
        slug: a.slug,
        description: a.description,
        sector: a.sector,
        license_type: a.licenseType,
        country: a.country,
        business_status: a.businessStatus,
        asking_price: a.askingPrice,
        currency: a.currency,
        year_issued: a.yearIssued,
        employees: a.employees,
        regulator: a.regulator,
        highlights: JSON.stringify(a.highlights),
        status: a.status,
        views: a.views,
        created_at: a.createdAt,
        updated_at: a.createdAt,
      })),
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("assets", {
      id: { [Sequelize.Op.in]: assets.map((a) => a.id) },
    });
  },
};
