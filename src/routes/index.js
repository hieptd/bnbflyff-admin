const express = require("express");
const router = express.Router();

const loginRoutes = require("./login.route");
const accountRoutes = require("./accounts.route");
const characterRoutes = require("./characters.route");
const currenciesRoutes = require("./currencies.route");

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

router.use(loginRoutes);
router.use(accountRoutes);
router.use(characterRoutes);
router.use(currenciesRoutes);
module.exports = router;
