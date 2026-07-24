import { Request, Response } from "express";
import { getUserId } from "../utils/getUserId.js";
import supabase from "../config/supabase.js";

//GET /projects/:id/expenses
export const getExpenses = async (req: Request, res: Response) => {
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
    .select("group_id")
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

  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("project_id", projectId);
  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  return res.status(200).json({
    expenses,
  });
};

//GET projects/expenses/:id
export const getExpense = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: expenseId } = req.params;
  if (!expenseId) {
    return res.status(400).json({
      message: "Expense id is required",
    });
  }

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .single();
  if (expenseError || !expense) {
    return res.status(404).json({
      message: "Expense not found",
    });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("group_id")
    .eq("id", expense.project_id)
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

  return res.status(200).json({
    expense,
  });
};

//POST /projects/:id/expenses
export const createExpense = async (req: Request, res: Response) => {
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
    .select("group_id")
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

  const { title, amount, category, expense_date } = req.body;
  if (!title || !amount) {
    return res.status(400).json({
      message: "Title and amount are required",
    });
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      project_id: projectId,
      paid_by: userId,
      title,
      amount,
      category,
      expense_date,
    })
    .select()
    .single();
  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  return res.status(201).json({
    message: "Expense created successfully",
    expense,
  });
};

//PUT projects/expenses/:id
export const updateExpense = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: expenseId } = req.params;
  if (!expenseId) {
    return res.status(400).json({
      message: "Expense id is required",
    });
  }

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .single();
  if (expenseError || !expense) {
    return res.status(404).json({
      message: "Expense not found",
    });
  }

  if (expense.paid_by !== userId) {
    return res.status(403).json({
      message: "Only the person who paid the expense can update it",
    });
  }

  const { title, amount, category, expense_date } = req.body;

  const { data: updatedExpense, error: updateError } = await supabase
    .from("expenses")
    .update({
      title,
      amount,
      category,
      expense_date,
    })
    .eq("id", expenseId)
    .select()
    .single();
  if (updateError) {
    return res.status(500).json({
      message: updateError.message,
    });
  }

  return res.status(200).json({
    message: "Expense updated successfully",
    expense: updatedExpense,
  });
};

//DELETE projects/expenses/:id
export const deleteExpense = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id: expenseId } = req.params;
  if (!expenseId) {
    return res.status(400).json({
      message: "Expense id is required",
    });
  }

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .select("paid_by")
    .eq("id", expenseId)
    .single();
  if (expenseError || !expense) {
    return res.status(404).json({
      message: "Expense not found",
    });
  }

  if (expense.paid_by !== userId) {
    return res.status(403).json({
      message: "Only the person who paid the expense can delete it",
    });
  }

  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);
  if (deleteError) {
    return res.status(500).json({
      message: deleteError.message,
    });
  }

  return res.status(200).json({
    message: "Expense deleted successfully",
  });
};
