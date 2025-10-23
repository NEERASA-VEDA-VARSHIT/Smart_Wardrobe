import express from "express";
import { signUp, signIn, logout } from "../controllers/auth.controllers.js";

const authRouter = express.Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.post("/logout", logout);

export default authRouter;