import { Request, Response } from "express";
import { getUserId } from "../utils/getUserId.js";
import supabase from "../config/supabase.js";

//GET /groups/:id/projects
export const getProjects = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: groupId } = req.params;

  if (!groupId) {
    return res.status(400).json({
      message: "Group id is required",
    });
  }

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

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("group_id", groupId);

  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  return res.status(200).json({
    projects,
  });
};

//GET /projects/:id
export const getProject = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: projectId } = req.params;
  if (!projectId) {
    return res.status(400).json({
      message: "Project id is required",
    });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (projectError || !project) {
    return res.status(404).json({
      message: "Project not found",
    });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", project.group_id)
    .eq("user_id", userId)
    .single();
  if (membershipError || !membership) {
    return res.status(403).json({
      message: "You are not a member of this group",
    });
  }

  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
    user_id,
    role,
    status,
    users (
      id,
      name,
      email,
      profile_picture
    )
    `,
    )
    .eq("group_id", project.group_id);
  if (membersError) {
    return res.status(500).json({
      message: membersError.message,
    });
  }

  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("*")
    .eq("project_id", projectId);
  if (expensesError) {
    return res.status(500).json({
      message: expensesError.message,
    });
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", projectId);
  if (paymentsError) {
    return res.status(500).json({
      message: paymentsError.message,
    });
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", project.group_id)
    .single();

  if (groupError) {
    return res.status(500).json({
      message: groupError.message,
    });
  }

  return res.status(200).json({
    project,
    members,
    expenses,
    payments,
    ownerId: group.owner_id,
  });
};

//POST /groups/:id/projects
export const createProject = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: groupId } = req.params;

  if (!groupId) {
    return res.status(400).json({
      message: "Group id is required",
    });
  }

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

  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({
      message: "Project name is required",
    });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      group_id: groupId,
      name,
      description,
    })
    .select()
    .single();
  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  return res.status(201).json({
    message: "Project created successfully",
    project,
  });
};

//PUT groups/projects/:id
export const updateProject = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: projectId } = req.params;
  if (!projectId) {
    return res.status(400).json({
      message: "Project id is required",
    });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (projectError || !project) {
    return res.status(404).json({
      message: "Project not found",
    });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", project.group_id)
    .eq("user_id", userId)
    .single();
  if (membershipError || !membership) {
    return res.status(403).json({
      message: "You are not a member of this group",
    });
  }

  const { name, description } = req.body;

  const { data: updatedProject, error: updateError } = await supabase
    .from("projects")
    .update({
      name,
      description,
    })
    .eq("id", projectId)
    .select()
    .single();
  if (updateError) {
    return res.status(500).json({
      message: updateError.message,
    });
  }

  return res.status(200).json({
    message: "Project updated successfully",
    project: updatedProject,
  });
};

//DELETE groups/projects/:id
export const deleteProject = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: projectId } = req.params;
  if (!projectId) {
    return res.status(400).json({
      message: "Project id is required",
    });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (projectError || !project) {
    return res.status(404).json({
      message: "Project not found",
    });
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", project.group_id)
    .single();
  if (groupError || !group) {
    return res.status(404).json({
      message: "Group not found",
    });
  }
  if (group.owner_id !== userId) {
    return res.status(403).json({
      message: "Only the group owner can delete projects",
    });
  }

  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  if (deleteError) {
    return res.status(500).json({
      message: deleteError.message,
    });
  }

  return res.status(200).json({
    message: "Project deleted successfully",
  });
};
