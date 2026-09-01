"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS conversations_buyer_seller_general_uniq
      ON conversations (buyer_id, seller_id)
      WHERE asset_id IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS conversations_buyer_seller_general_uniq;
    `);
  },
};
