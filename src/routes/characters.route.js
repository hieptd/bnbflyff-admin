const express = require("express");
const authenticate = require("../middlewares/authenticate");
const {
  getCharacters,
  getCharacter,
  renameCharacter,
  getChangeNameLogs,
} = require("../controllers/characters.controller");
const validateBody = require("../middlewares/validateBody");
const renameCharacterSchema = require("../validations/renameCharacter.validation");
const router = express.Router();

/**
 * @swagger
 * /auth/characters:
 *   get:
 *     tags:
 *       - Characters
 *     summary: Get a paginated list of characters
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search characters by name
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
 *         description: Number of characters per page
 *       - in: query
 *         name: account
 *         schema:
 *           type: string
 *         description: Filter by account
 *     responses:
 *       200:
 *         description: A list of characters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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

/**
 * @swagger
 * /auth/characters/{m_idPlayer}:
 *   patch:
 *     summary: Rename character
 *     tags:
 *       - Characters
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: m_idPlayer
 *         required: true
 *         schema:
 *           type: string
 *         description: Character ID
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
 *         description: Character renamed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Character not found
 */
router.patch(
  "/auth/characters/:m_idPlayer",
  authenticate,
  validateBody(renameCharacterSchema),
  renameCharacter
);

/**
 * @swagger
 * /auth/characters/{idPlayer}/change-name-logs:
 *   get:
 *     summary: Get rename logs by idPlayer
 *     tags:
 *       - Characters
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: idPlayer
 *         required: true
 *         schema:
 *           type: string
 *         description: Character ID (7 digits)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort format (e.g., ChangeDt:desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of logs per page
 *     responses:
 *       200:
 *         description: Rename logs returned
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/auth/characters/:idPlayer/change-name-logs",
  authenticate,
  getChangeNameLogs
);

module.exports = router;
