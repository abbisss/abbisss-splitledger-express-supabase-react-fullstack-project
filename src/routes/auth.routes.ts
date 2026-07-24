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

  res.json(data.session);
});

export default router;