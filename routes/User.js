import express from "express";
import { login, register, logout } from "../controller/User.js";

const router = express.Router();

// /api
router.route("/login").post(login);
router.route("/register").post(register);
router.route("/logout").get(logout);

export default router;
