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
    .select(
      `
      id,
      project_id,
      payer_id,
      receiver_id,
      amount,
      status,
      created_at,
      payer:users!payments_payer_id_fkey(
        name
      ),
      receiver:users!payments_receiver_id_fkey(
        name
      )
    `,
    )
    .eq("project_id", id);

  if (paymentsError) {
    return res.status(400).json({
      message: paymentsError.message,
    });
  }

  const formattedPayments = payments.map((payment: any) => ({
    id: payment.id,
    project_id: payment.project_id,
    payer_id: payment.payer_id,
    receiver_id: payment.receiver_id,
    payer_name: payment.payer.name,
    receiver_name: payment.receiver.name,
    amount: Number(payment.amount),
    status: payment.status,
    created_at: payment.created_at,
  }));

  return res.status(200).json(formattedPayments);
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

// PUT /projects/:id/payments/:paymentId
export const completePayment = async (req: Request, res: Response) => {
  const authId = req.user?.id;

  if (!authId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const userId = await getUserId(authId);

  const { paymentId } = req.params;

  if (!paymentId) {
    return res.status(400).json({
      message: "Payment id is required",
    });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    return res.status(404).json({
      message: "Payment not found",
    });
  }

  // only payer can complete the payment
  if (payment.payer_id !== userId) {
    return res.status(403).json({
      message: "You cannot complete this payment",
    });
  }

  if (payment.status === "completed") {
    return res.status(400).json({
      message: "Payment already completed",
    });
  }

  const { data: updatedPayment, error: updateError } = await supabase
    .from("payments")
    .update({
      status: "completed",
    })
    .eq("id", paymentId)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({
      message: updateError.message,
    });
  }

  return res.status(200).json(updatedPayment);
};
