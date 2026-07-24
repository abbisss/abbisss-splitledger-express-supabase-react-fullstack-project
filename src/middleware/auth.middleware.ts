import { Request, Response, NextFunction } from "express";
import supabase from "../config/supabase.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No authorization token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  req.user = {
    id: data.user.id,
    email: data.user.email,
  };
  
  next();
};
