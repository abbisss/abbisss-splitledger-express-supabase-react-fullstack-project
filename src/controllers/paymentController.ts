import { Request, Response } from "express";
import { getUserId } from "../utils/getUserId.js";
import supabase from "../config/supabase.js";

//GET /projects/:id/payments
export const getPayments = async (req: Request, res: Response) => {
  const authId = req.user?.id;
  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const userId = await getUserId(authId);

  const { id } = req.params;

  const { data: member, error: memberError } = await supabase
    .from("projects")
    .select(
      `
      group_id,
      groups!inner(
        group_members!inner(
          user_id
        )
      )
    `,
    )
    .eq("id", id)
    .eq("groups.group_members.user_id", userId)
    .single();
  if (memberError || !member) {
    return res.status(403).json({
      message: "You are not a member of this project",
    });
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", id);
  if (paymentsError) {
    return res.status(400).json({
      message: paymentsError.message,
    });
  }

  return res.status(200).json(payments);
};

//POST /projects/:id/payments
export const createPayment = async (req: Request, res: Response) => {
  const authId = req.user?.id;

  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const userId = await getUserId(authId);

  const { id } = req.params;
  const { receiver_id, amount } = req.body;

  if (!receiver_id || !amount) {
    return res.status(400).json({
      message: "Receiver and amount are required",
    });
  }
  if (amount <= 0) {
    return res.status(400).json({
      message: "Amount must be greater than zero",
    });
  }
  if (userId === receiver_id) {
    return res.status(400).json({
      message: "Cannot pay yourself",
    });
  }

  const { data: payerMember, error: payerMemberError } = await supabase
    .from("projects")
    .select(
      `
      group_id,
      groups!inner(
        group_members!inner(
          user_id
        )
      )
    `,
    )
    .eq("id", id)
    .eq("groups.group_members.user_id", userId)
    .single();
  if (payerMemberError || !payerMember) {
    return res.status(403).json({
      message: "You are not a member of this project",
    });
  }

  const { data: receiverMember, error: receiverMemberError } = await supabase
    .from("projects")
    .select(
      `
      group_id,
      groups!inner(
        group_members!inner(
          user_id
        )
      )
    `,
    )
    .eq("id", id)
    .eq("groups.group_members.user_id", receiver_id)
    .single();
  if (receiverMemberError || !receiverMember) {
    return res.status(403).json({
      message: "Receiver is not a member of this project",
    });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert([
      {
        project_id: id,
        payer_id: userId,
        receiver_id,
        amount,
        status: "completed",
      },
    ])
    .select()
    .single();
  if (paymentError) {
    return res.status(400).json({
      message: paymentError.message,
    });
  }

  return res.status(201).json(payment);
};
