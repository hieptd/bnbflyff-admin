const express = require("express");
const {
  getAccounts,
  getAccount,
  createAccount,
} = require("../controllers/accounts.controller");
const authenticate = require("../middlewares/authenticate");
const router = express.Router();

/**
 * @swagger
 * /api/auth/accounts:
 *   get:
 *     summary: Get account list (authenticated)
 *     tags:
 *       - Accounts
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

/**
 * @swagger
 * /api/auth/accounts/{account}:
 *   get:
 *     summary: Get account (authenticated)
 *     tags:
 *       - Accounts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: The account identifier
 *     responses:
 *       200:
 *         description: Returns an account object
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
 *         description: Unauthorized - not authenticated or not in allowed list
 */
router.get("/auth/accounts/:account", authenticate, getAccount);

/**
 * @swagger
 * /api/auth/accounts/create:
 *   post:
 *     summary: Create a new account (authenticated)
 *     description: Creates a new account with the provided details and initializes the shop account. Requires authentication.
 *     tags:
 *       - Accounts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account
 *               - password
 *             properties:
 *               account:
 *                 type: string
 *                 example: "exampleAccount"
 *                 description: The username for the new account
 *               password:
 *                 type: string
 *                 example: "MySecurePass123"
 *               cash:
 *                 type: integer
 *                 example: 1000
 *                 description: Initial cash amount (optional, default is 0)
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *                 description: Email address (optional)
 *     responses:
 *       201:
 *         description: Account created successfully
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
 *                   example: "Account created successfully."
 *       400:
 *         description: User not found or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *                 account:
 *                   type: string
 *                   example: "exampleAccount"
 *       401:
 *         description: Unauthorized - not authenticated
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/auth/accounts/create", authenticate, createAccount);

module.exports = router;
