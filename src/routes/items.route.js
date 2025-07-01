const express = require("express");
const authenticate = require("../middlewares/authenticate");
const {
  getItems,
  getItemData,
  generateRandomOptionID,
  getItemAttributes,
} = require("../controllers/items.controller");
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

/**
 * @swagger
 * /api/auth/item-data:
 *   get:
 *     summary: Search item data by partial name or ID (from chunked JSON files)
 *     tags:
 *       - Items
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial item name or ID to search for (e.g., "suit", "163")
 *     responses:
 *       200:
 *         description: Successfully fetched top 5 matching item metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Parsed item metadata
 *       400:
 *         description: Missing or invalid query parameter
 *       404:
 *         description: No matching items found
 *       500:
 *         description: Internal server error
 */
router.get("/auth/item-data", authenticate, getItemData);

/**
 * @swagger
 * /api/auth/items/generate-random-option-id:
 *   post:
 *     summary: Generate a 64-bit randomOptionId from up to 3 awake options
 *     tags:
 *       - Items
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               safeFlag:
 *                 type: boolean
 *                 example: false
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dst:
 *                       type: integer
 *                       example: 34
 *                     adj:
 *                       type: integer
 *                       example: 12
 *                     adjRaw:
 *                       type: integer
 *                       example: 500
 *                 example:
 *                   - dst: 34
 *                     adj: 12
 *                   - dst: 36
 *                     adjRaw: 27
 *                   - dst: 88
 *                     adj: 40
 *     responses:
 *       200:
 *         description: Successfully generated a randomOptionId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 randomOptionId:
 *                   type: string
 *                   example: "171262511479259392"
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized (not logged in)
 *       500:
 *         description: Internal server error
 */
router.post(
  "/auth/items/generate-random-option-id",
  authenticate,
  generateRandomOptionID
);

/**
 * @swagger
 * /api/auth/items/item-attributes:
 *   get:
 *     summary: Fetches all possible awake/dst attributes
 *     tags:
 *       - Items
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All attribute definitions from attributes.json
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 result:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       key:
 *                         type: string
 *                       isPercentage:
 *                         type: boolean
 *       500:
 *         description: Internal server error
 */
router.get("/auth/items/item-attributes", authenticate, getItemAttributes);

module.exports = router;
