import { Request, Response } from "express";
import { getUserId } from "../utils/getUserId.js";
import supabase from "../config/supabase.js";

//GET /invitations
export const getInvitations = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { data: invitations, error } = await supabase
    .from("invitations")
    .select(
      `
        id,
        status,
        created_at,
        groups (
            id,
            name
        ),
        sender:users!invitations_sender_id_fkey (
            id,
            name,
            profile_picture
        )
        `,
    )
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(200).json(invitations);
};

//POST /invitations/group/:id
export const createInvitation = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: groupId } = req.params;

  const { receiverId } = req.body;
  if (!receiverId) {
    return res.status(400).json({
      message: "Receiver id is required",
    });
  }

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
      message: "Only the owner can send invitations",
    });
  }

  const { data: receiver, error: receiverError } = await supabase
    .from("users")
    .select("id")
    .eq("id", receiverId)
    .single();

  if (receiverError || !receiver) {
    return res.status(404).json({
      message: "Receiver not found",
    });
  }

  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", receiverId)
    .single();

  if (existingMember) {
    return res.status(400).json({
      message: "User is already a member of this group",
    });
  }

  const { data: existingInvitation } = await supabase
    .from("invitations")
    .select("id")
    .eq("group_id", groupId)
    .eq("receiver_id", receiverId)
    .eq("status", "pending")
    .single();

  if (existingInvitation) {
    return res.status(400).json({
      message: "Invitation already sent",
    });
  }

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      group_id: groupId,
      sender_id: userId,
      receiver_id: receiverId,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(201).json(invitation);
};

// PUT /invitations/:id
export const updateInvitation = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: invitationId } = req.params;
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Status must be accepted or rejected",
    });
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", invitationId)
    .single();
  if (invitationError || !invitation) {
    return res.status(404).json({
      message: "Invitation not found",
    });
  }

  if (invitation.receiver_id !== userId) {
    return res.status(403).json({
      message: "You are not allowed to update this invitation",
    });
  }

  if (invitation.status !== "pending") {
    return res.status(400).json({
      message: "Invitation has already been processed",
    });
  }

  const { data: updatedInvitation, error } = await supabase
    .from("invitations")
    .update({
      status,
    })
    .eq("id", invitationId)
    .select()
    .single();
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (status === "accepted") {
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: invitation.group_id,
      user_id: userId,
    });

    if (memberError) {
      return res.status(400).json({
        message: memberError.message,
      });
    }
  }

  const { error: deleteError } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);

  if (deleteError) {
    return res.status(400).json({
      message: deleteError.message,
    });
  }

  return res.status(200).json({ message: "Invitation processed successfully" });
};
