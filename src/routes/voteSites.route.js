const express = require("express");
const authenticate = require("../middlewares/authenticate");
const {
  getVoteSites,
  getVoteSite,
  createVoteSite,
} = require("../controllers/voteSites.controller");
const router = express.Router();

/**
 * @swagger
 * /api/auth/shop/vote-sites:
 *   get:
 *     summary: Get vote site list
 *     tags:
 *       - Shop
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (optional, default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (optional, default is 10)
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */

router.get("/auth/shop/vote-sites", authenticate, getVoteSites);

/**
 * @swagger
 * /api/auth/shop/vote-sites/{id}:
 *   get:
 *     summary: Get vote site
 *     tags:
 *       - Shop
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: vote site ID
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
router.get("/auth/shop/vote-sites/:id", authenticate, getVoteSite);

/**
 * @swagger
 * /api/auth/shop/vote-sites/create:
 *   post:
 *     summary: Create a new vote site (authenticated)
 *     description: Creates a new vote site. Requires authentication.
 *     tags:
 *       - Shop
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - link
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "pserver100"
 *                 description: Internal name for the vote site
 *               link:
 *                 type: string
 *                 example: "https://www.gtop100.com/topsites/Flyff"
 *                 description: URL to the vote site
 *               image:
 *                 type: string
 *                 example: "https://example.com/images/gtop100.png"
 *                 description: Image URL for the vote site (optional)
 *               type:
 *                 type: string
 *                 example: "vote"
 *                 description: Type or category of the vote site
 *               points:
 *                 type: integer
 *                 example: 5
 *                 description: Number of vote points awarded. Default is 0.
 *               is_active:
 *                 type: string
 *                 enum: ["0", "1"]
 *                 example: "1"
 *                 description: Whether the site is active ("1") or inactive ("0")
 *     responses:
 *       201:
 *         description: Vote site created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vote site created successfully."
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/auth/shop/vote-sites/create", authenticate, createVoteSite);

module.exports = router;
