const express = require("express");
const authenticate = require("../middlewares/authenticate");
const { getTradeLogs } = require("../controllers/tradeLogs.controller");
const router = express.Router();

/**
 * @swagger
 * /api/auth/trade-logs:
 *   get:
 *     summary: Get paginated trade logs (authenticated)
 *     tags:
 *       - Trade Logs
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: idPlayer1
 *         required: false
 *         schema:
 *           type: string
 *         description: First player ID to filter trades.
 *       - in: query
 *         name: idPlayer2
 *         required: false
 *         schema:
 *           type: string
 *         description: Second player ID to filter trades that include both players.
 *       - in: query
 *         name: ItemIndex
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filter by item index involved in the trade.
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by character ID or IP address.
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *           example: "TradeDt:desc"
 *         description: 'Field and direction to sort by. Format is "field:asc|desc"'
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of records per page.
 *     responses:
 *       200:
 *         description: Returns paginated trade logs with details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TradeLog'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get("/auth/trade-logs", authenticate, getTradeLogs);

module.exports = router;
