import { Request, Response } from "express";
import { getUserId } from "../utils/getUserId.js";
import supabase from "../config/supabase.js";

//GET /groups/:id/members
export const getGroupMembers = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: groupId } = req.params;

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();
  if (membershipError || !membership) {
    return res.status(403).json({
      message: "You are not a member of this group",
    });
  }

  const { data: members, error } = await supabase
    .from("group_members")
    .select(
      `
    id,
    role,
    status,
    created_at,
    user:users (
      id,
      name,
      email,
      phone,
      profile_picture
    )
  `,
    )
    .eq("group_id", groupId);
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(200).json(members);
};

//DELETE /groups/:id/members/:userId
export const removeGroupMember = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: groupId, userId: memberId } = req.params;
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();
  if (groupError || !group) {
    return res.status(404).json({
      message: "Group not found",
    });
  }
  if (group.owner_id !== userId) {
    return res.status(403).json({
      message: "Only the owner can remove members",
    });
  }
  if (memberId === group.owner_id) {
    return res.status(400).json({
      message: "The owner cannot be removed from the group",
    });
  }

  const { data: member, error: memberError } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", memberId)
    .single();

  if (memberError || !member) {
    return res.status(404).json({
      message: "Member not found in this group",
    });
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberId);
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(200).json({
    message: "Member removed successfully",
  });
};

//POST /groups/:id/leave
export const leaveGroup = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: groupId } = req.params;
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();
  if (groupError || !group) {
    return res.status(404).json({
      message: "Group not found",
    });
  }

  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (membersError) {
    return res.status(400).json({
      message: membersError.message,
    });
  }
  if (group.owner_id === userId) {
    if (members.length > 1) {
      return res.status(400).json({
        message: "Owner cannot leave while other members exist",
      });
    }
  }

  const { data: member, error: memberError } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();
  if (memberError || !member) {
    return res.status(404).json({
      message: "You are not a member of this group",
    });
  }

  if (group.owner_id === userId && members.length === 1) {
    const { error: deleteGroupError } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);
    if (deleteGroupError) {
      return res.status(400).json({
        message: deleteGroupError.message,
      });
    }

    return res.status(200).json({
      message: "Group deleted successfully",
    });
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(200).json({
    message: "You left the group successfully",
  });
};
