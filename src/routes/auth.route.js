const express = require("express");
const authenticate = require("../middlewares/authenticate");
const router = express.Router();

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user account
 *     tags:
 *       - Accounts
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Returns the current authenticated account object
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
 *                   description: The authenticated user object
 *       401:
 *         description: Unauthorized - not authenticated or not in allowed list
 */

router.get("/auth/me", authenticate, (req, res) => {
  res.json({
    success: true,
    result: req.user,
  });
});

module.exports = router;
