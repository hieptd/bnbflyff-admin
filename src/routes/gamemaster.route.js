const express = require("express");
const authenticate = require("../middlewares/authenticate");
const {
  getGameMasters,
  getGameMasterLogs,
} = require("../controllers/gamemasters.controller");

const router = express.Router();

/**
 * @swagger
 * /api/auth/gamemasters:
 *   get:
 *     tags:
 *       - GameMasters
 *     summary: Get a paginated list of Game Masters and their logs
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search logs by word (m_szWords)
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [startsWith, like]
 *         description: Search mode (startsWith or whole word match)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort format (e.g., m_idPlayer:asc)
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
 *         description: A list of Game Masters and their logs
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/auth/gamemasters", authenticate, getGameMasters);

/**
 * @swagger
 * /api/auth/gamemasters/{m_idPlayer}:
 *   get:
 *     tags:
 *       - GameMasters
 *     summary: Get logs of a specific Game Master (m_idPlayer)
 *     description: Returns paginated Game Master logs filtered by m_idPlayer. Supports optional search, sort, and pagination.
 *     parameters:
 *       - in: path
 *         name: m_idPlayer
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the player (Game Master)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search logs by keyword in m_szWords
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [startsWith, like]
 *         description: Search mode to match beginning or any part of the word
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort format (e.g., s_date:desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results per page (default is 10)
 *     responses:
 *       200:
 *         description: Paginated Game Master logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.get("/auth/gamemasters/:m_idPlayer", authenticate, getGameMasterLogs);

module.exports = router;
