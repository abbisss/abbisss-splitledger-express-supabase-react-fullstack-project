import { Request, Response } from "express";
import supabase from "../config/supabase.js";
import { getUserId } from "../utils/getUserId.js";

//GET /groups
export const getGroups = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const userId = await getUserId(authId);

  const { data: groupsId, error: groupIdError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);
  if (groupIdError) {
    return res.status(404).json({
      message: groupIdError.message,
    });
  }

  const ids = groupsId.map((group) => group.group_id);
  if (ids.length === 0) {
    return res.status(200).json([]);
  }

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .in("id", ids);
  if (groupsError) {
    return res.status(404).json({
      message: groupsError.message,
    });
  }

  return res.status(200).json(groups);
};

//GET /groups/:id
export const getGroupById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const userId = await getUserId(authId);

  const { data: member, error: memberError } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", id)
    .eq("user_id", userId)
    .single();
  if (memberError || !member) {
    return res.status(403).json({
      message: "You are not a member of this group",
    });
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();
  if (groupError || !group) {
    return res.status(404).json({
      message: "Group not found",
    });
  }

  return res.status(200).json(group);
};

//POST /groups
export const createGroup = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({
      message: "Group name is required",
    });
  }

  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const userId = await getUserId(authId);

  const { data: group, error } = await supabase
    .from("groups")
    .insert([
      {
        name,
        owner_id: userId,
      },
    ])
    .select()
    .single();
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const { error: memberError } = await supabase.from("group_members").insert([
    {
      group_id: group.id,
      user_id: userId,
      role: "owner",
      status: "active",
    },
  ]);
  if (memberError) {
    return res.status(400).json({
      message: memberError.message,
    });
  }

  return res.status(201).json(group);
};

//PUT /groups/:id
export const updateGroup = async (req: Request, res: Response) => {
  const { id } = req.params;

  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", id)
    .single();
  if (groupError || !group) {
    return res.status(404).json({
      message: "Group not found",
    });
  }
  if (group.owner_id !== userId) {
    return res.status(403).json({
      message: "Only the owner can update the group",
    });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({
      message: "Group name is required",
    });
  }

  const { data: updatedGroup, error } = await supabase
    .from("groups")
    .update({
      name,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(200).json(updatedGroup);
};
