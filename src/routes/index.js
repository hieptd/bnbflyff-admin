const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /api/health-check:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Returns a message indicating the server is running
 */
router.get("/health-check", (req, res) => {
  res.send("Server is ok");
});

module.exports = router;
