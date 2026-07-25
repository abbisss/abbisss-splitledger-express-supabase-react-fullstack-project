import { Router } from "express";
import supabase from "../config/supabase.js";

const router = Router();

//POST auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.status(200).json(data.session);
});

//POST /auth/logout
router.post("/logout", async (req, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.status(200).json({
    message: "Logged out successfully",
  });
});

export default router;
