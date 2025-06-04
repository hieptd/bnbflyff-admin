const express = require("express");
const validateBody = require("../middlewares/validateBody");
const userLoginSchema = require("../validations/userLogin.validation");
const { login } = require("../controllers/login.controller");
const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login endpoint
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
 *                 example: shoptest1
 *               password:
 *                 type: string
 *                 format: password
 *                 example: water123
 *     responses:
 *       200:
 *         description: Returns a message indicating the login was successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/auth/login", validateBody(userLoginSchema), login);

module.exports = router;
