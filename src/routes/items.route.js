const express = require("express");
const authenticate = require("../middlewares/authenticate");
const { getItems } = require("../controllers/items.controller");
const router = express.Router();

/**
 * @swagger
 * /api/auth/items:
 *   get:
 *     summary: Search all inventories for an item ID (authenticated)
 *     tags:
 *       - Items
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID to search for (e.g., 16316).
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
 *         description: Returns paginated item occurrences from all inventories.
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
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: string
 *                         example: INVENTORY
 *                       UserID:
 *                         type: string
 *                         example: A1234
 *                       data:
 *                         type: string
 *                         example: "0,16316,0,0,,1,0,5000000,0,0,2,XYZ..."
 *       400:
 *         description: Missing or invalid itemId parameter.
 *       401:
 *         description: Unauthorized (not logged in)
 *       500:
 *         description: Server error
 */

router.get("/auth/items", authenticate, getItems);

module.exports = router;
