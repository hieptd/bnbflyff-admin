const express = require("express");
const authenticate = require("../middlewares/authenticate");
const validateBody = require("../middlewares/validateBody");

const {
  getGuilds,
  getGuildMembers,
  getGuildBank,
  getGuildRenameLogs,
  renameGuild,
  getGuildBankHistory,
} = require("../controllers/guilds.controller");
const renameGuildSchema = require("../validations/renameGuild.validation");

const router = express.Router();

/**
 * @swagger
 * /api/auth/guilds:
 *   get:
 *     tags:
 *       - Guilds
 *     summary: Get a paginated list of guilds
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort format (e.g., m_idGuild:asc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: A paginated list of guilds
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/auth/guilds", authenticate, getGuilds);

/**
 * @swagger
 * /api/auth/guilds/{m_idGuild}/members:
 *   get:
 *     tags:
 *       - Guilds
 *     summary: Get guild members by guild ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: m_idGuild
 *         required: true
 *         schema:
 *           type: integer
 *         description: Guild ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by Player ID (exact)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort format (e.g., m_nGiveGold:desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: A paginated list of guild members
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/auth/guilds/:m_idGuild/members", authenticate, getGuildMembers);

/**
 * @swagger
 * /api/auth/guilds/{m_idGuild}/bank:
 *   get:
 *     tags:
 *       - Guilds
 *     summary: Get guild bank content for a guild
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: m_idGuild
 *         required: true
 *         schema:
 *           type: integer
 *         description: Guild ID
 *     responses:
 *       200:
 *         description: Guild bank data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/auth/guilds/:m_idGuild/bank", authenticate, getGuildBank);

/**
 * @swagger
 * /api/auth/guilds/{m_idGuild}:
 *   patch:
 *     tags:
 *       - Guilds
 *     summary: Rename a guild
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: m_idGuild
 *         required: true
 *         schema:
 *           type: integer
 *         description: Guild ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               m_szName:
 *                 type: string
 *                 maxLength: 32
 *     responses:
 *       200:
 *         description: Guild renamed successfully
 *       400:
 *         description: Invalid input or name already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Guild not found
 */
router.patch(
  "/auth/guilds/:m_idGuild",
  authenticate,
  validateBody(renameGuildSchema),
  renameGuild
);

/**
 * @swagger
 * /api/auth/guilds/{m_idGuild}/change-name-logs:
 *   get:
 *     tags:
 *       - Guilds
 *     summary: Get change name logs for a guild
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: m_idGuild
 *         required: true
 *         schema:
 *           type: integer
 *         description: Guild ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort format (e.g., ChangeDt:desc)
 *     responses:
 *       200:
 *         description: Rename logs returned successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/auth/guilds/:m_idGuild/change-name-logs",
  authenticate,
  getGuildRenameLogs
);

/**
 * @swagger
 * /auth/guilds/{m_idGuild}/bank-history:
 *   get:
 *     summary: Get guild bank transaction history
 *     tags:
 *       - Guilds
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: m_idGuild
 *         required: true
 *         schema:
 *           type: string
 *         description: The guild ID (6 digits)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort order (e.g., s_date:desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Bank history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/auth/guilds/:m_idGuild/bank-history",
  authenticate,
  getGuildBankHistory
);

module.exports = router;
