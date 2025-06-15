const express = require("express");
const router = express.Router();

const loginRoutes = require("./login.route");
const accountRoutes = require("./accounts.route");
const authRoutes = require("./auth.route");
const characterRoutes = require("./characters.route");
const currenciesRoutes = require("./currencies.route");
const voteSitesRoutes = require("./voteSites.route");
const inventoryRoutes = require("./inventory.route");
const tradeLogsRoutes = require("./tradeLogs.route");
const itemRoutes = require("./items.route");

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
router.use(authRoutes);
router.use(accountRoutes);
router.use(characterRoutes);
router.use(currenciesRoutes);
router.use(voteSitesRoutes);
router.use(inventoryRoutes);
router.use(tradeLogsRoutes);
router.use(itemRoutes);

module.exports = router;
