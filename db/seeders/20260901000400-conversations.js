"use strict";

const { conversations } = require("../fixtures");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      "conversations",
      conversations.map((c) => ({
        id: c.id,
        asset_id: c.assetId,
        buyer_id: c.buyerId,
        seller_id: c.sellerId,
        subject: c.subject,
        created_at: now,
        updated_at: now,
      })),
    );

    const messageRows = [];
    for (const c of conversations) {
      for (const m of c.messages) {
        const ts = new Date(Date.now() - 2 * 86_400_000 + m.offsetMin * 60_000);
        messageRows.push({
          conversation_id: c.id,
          sender_id: m.senderId,
          body: m.body,
          read_at: null,
          created_at: ts,
          updated_at: ts,
        });
      }
    }
    await queryInterface.bulkInsert("messages", messageRows);
  },

  async down(queryInterface, Sequelize) {
    const ids = conversations.map((c) => c.id);
    await queryInterface.bulkDelete("messages", {
      conversation_id: { [Sequelize.Op.in]: ids },
    });
    await queryInterface.bulkDelete("conversations", {
      id: { [Sequelize.Op.in]: ids },
    });
  },
};
