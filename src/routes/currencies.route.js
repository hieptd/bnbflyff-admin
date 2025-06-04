const express = require("express");
const authenticate = require("../middlewares/authenticate");
const {
  getCurrencies,
  getCurrency,
  createCurrency,
} = require("../controllers/currency.controller");
const router = express.Router();

/**
 * @swagger
 * /api/auth/shop/currencies:
 *   get:
 *     summary: Get currency list
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

router.get("/auth/shop/currencies", authenticate, getCurrencies);

/**
 * @swagger
 * /api/auth/shop/currencies/{currencyId}:
 *   get:
 *     summary: Get currency
 *     tags:
 *       - Shop
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: currencyId
 *         schema:
 *           type: integer
 *         description: Currency ID
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
router.get("/auth/shop/currencies/:currencyId", authenticate, getCurrency);

/**
 * @swagger
 * /api/auth/currencies/create:
 *   post:
 *     summary: Create a new currency (authenticated)
 *     description: Creates a new currency and initializes wallets for all shop accounts. Requires authentication.
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
 *               - display_name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "tokens"
 *                 description: Internal name for the currency
 *               display_name:
 *                 type: string
 *                 example: "Tokens"
 *                 description: User-facing display name for the currency
 *     responses:
 *       200:
 *         description: Currency created and wallets initialized
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
 *                   example: "Currency created successfully and wallets initialized."
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/auth/currencies/create", authenticate, createCurrency);

module.exports = router;
