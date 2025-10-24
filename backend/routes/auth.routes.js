import express from "express";
import { signUp, signIn, logout, getCurrentUser } from "../controllers/auth.controllers.js";
import { isAuth } from "../middlewares/isAuth.js";

const authRouter = express.Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.post("/logout", logout);
authRouter.post("/signout", logout);
authRouter.get("/me", isAuth, getCurrentUser);

export default authRouter;