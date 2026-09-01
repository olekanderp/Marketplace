"use strict";

const { buyerProfiles, sellerProfiles } = require("../fixtures");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      "seller_profiles",
      sellerProfiles.map((p) => ({
        user_id: p.userId,
        company_name: p.companyName,
        about: p.about,
        website: p.website,
        created_at: now,
        updated_at: now,
      })),
    );

    await queryInterface.bulkInsert(
      "buyer_profiles",
      buyerProfiles.map((p) => ({
        user_id: p.userId,
        headline: p.headline,
        bio: p.bio,
        mandate: p.mandate,
        target_sectors: JSON.stringify(p.targetSectors),
        target_jurisdictions: JSON.stringify(p.targetJurisdictions),
        ticket_min: p.ticketMin,
        ticket_max: p.ticketMax,
        currency: p.currency,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface, Sequelize) {
    const ids = [
      ...sellerProfiles.map((p) => p.userId),
      ...buyerProfiles.map((p) => p.userId),
    ];
    await queryInterface.bulkDelete("seller_profiles", {
      user_id: { [Sequelize.Op.in]: ids },
    });
    await queryInterface.bulkDelete("buyer_profiles", {
      user_id: { [Sequelize.Op.in]: ids },
    });
  },
};
