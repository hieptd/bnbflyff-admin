const express = require("express");
const authenticate = require("../middlewares/authenticate");
const {
  getCharacters,
  getCharacter,
} = require("../controllers/characters.controller");
const router = express.Router();

/**
 * @swagger
 * /api/auth/characters:
 *   get:
 *     summary: Get character list
 *     tags:
 *       - Characters
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: cols
 *         schema:
 *           type: string
 *         description: Columns to select (optional)
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

router.get("/auth/characters", authenticate, getCharacters);

/**
 * @swagger
 * /api/auth/characters/{account}:
 *   get:
 *     summary: Get character list for account
 *     tags:
 *       - Characters
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: The account name
 *       - in: query
 *         name: cols
 *         schema:
 *           type: string
 *         description: Columns to select (optional)
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

router.get("/auth/characters/:account", authenticate, getCharacters);

/**
 * @swagger
 * /api/auth/characters/name/{m_szName}:
 *   get:
 *     summary: Get character by name (authenticated)
 *     tags:
 *       - Characters
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: m_szName
 *         required: true
 *         schema:
 *           type: string
 *         description: The character name
 *     responses:
 *       200:
 *         description: Returns character data
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Character not found
 */
router.get("/auth/characters/name/:m_szName", authenticate, getCharacter);

/**
 * @swagger
 * /api/auth/characters/id/{m_idPlayer}:
 *   get:
 *     summary: Get character by ID (authenticated)
 *     tags:
 *       - Characters
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
 *         description: Returns character data
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Character not found
 */
router.get("/auth/characters/id/:m_idPlayer", authenticate, getCharacter);

module.exports = router;
