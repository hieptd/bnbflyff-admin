const express = require("express");
const { getAccounts } = require("../controllers/accounts.controller");
const authenticate = require("../middlewares/authenticate");
const router = express.Router();

/**
 * @swagger
 * /api/auth/accounts:
 *   get:
 *     summary: Get account list (authenticated)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Returns a list of accounts
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
 *       401:
 *         description: Unauthorized - not authenticated or not in allowed list
 */

router.get("/auth/accounts", authenticate, getAccounts);

module.exports = router;
