const express = require("express");
const authenticate = require("../middlewares/authenticate");
const { getInventory } = require("../controllers/inventory.controller");
const router = express.Router();

/**
 * @swagger
 * /api/auth/inventory/{m_idPlayer}:
 *   get:
 *     summary: Get character inventory by ID (authenticated)
 *     tags:
 *       - Inventory
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: m_idPlayer
 *         required: true
 *         schema:
 *           type: integer
 *         description: The character ID
 *     responses:
 *       200:
 *         description: Returns character inventory and index data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 result:
 *                   type: object
 *                   properties:
 *                     m_idPlayer:
 *                       type: integer
 *                       example: 1234
 *                     m_Inventory:
 *                       type: string
 *                       example: "0,112,0,0,0,1/1,113,0,0,0,2/"
 *                     m_apIndex:
 *                       type: string
 *                       example: "0/1/2/3/4/5/"
 *                     # Add other character fields as needed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Character not found
 *       500:
 *         description: Server error
 */

router.get("/auth/inventory/:m_idPlayer", authenticate, getInventory);

module.exports = router;
