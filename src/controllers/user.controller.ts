import { Request, Response } from "express";
import supabase from "../config/supabase.js";

//GET /users/:id
export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(404).json({
      message: error.message,
    });
  }

  res.json(data);
};

//POST /users
export const createUser = async (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      message: "Email, password, and name are required",
    });
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return res.status(400).json({
      message: authError.message,
    });
  }

  const authUser = authData.user;

  if (!authUser) {
    return res.status(400).json({
      message: "User creation failed",
    });
  }

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        auth_id: authUser.id,
        name,
        email,
        phone: phone || null,
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.status(201).json(data);
};

// PUT /users/:id
export const updateUser = async (req: Request, res: Response) => {
  const { name, phone, profile_picture } = req.body;
  const { id } = req.params;

  if (!name && !phone && !profile_picture) {
    return res.status(400).json({
      message: "No data to update",
    });
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      name: name,
      phone: phone,
      profile_picture: profile_picture,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.status(200).json(data);
};
