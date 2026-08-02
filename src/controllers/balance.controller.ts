import { Request, Response } from "express";
import { getUserId } from "../utils/getUserId.js";
import supabase from "../config/supabase.js";

//GET /projects/:id/balances
export const getBalances = async (req: Request, res: Response) => {
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

  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("*")
    .eq("project_id", projectId);
  if (expensesError) {
    return res.status(500).json({
      message: expensesError.message,
    });
  }

  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      users (
        id,
        name,
        email
      )
    `,
    )
    .eq("group_id", project.group_id);
  if (membersError) {
    return res.status(500).json({
      message: membersError.message,
    });
  }

  const balances: Record<
    string,
    {
      userId: string;
      name: string;
      paid: number;
      share: number;
      balance: number;
    }
  > = {};

  // Create users balance storage
  members.forEach((member: any) => {
    balances[member.user_id] = {
      userId: member.user_id,
      name: member.users.name,
      paid: 0,
      share: 0,
      balance: 0,
    };
  });

  // Calculate how much each person paid
  expenses.forEach((expense) => {
    if (balances[expense.paid_by]) {
      balances[expense.paid_by].paid += Number(expense.amount);
    }
  });

  // Calculate equal share
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  const sharePerPerson =
    members.length > 0 ? totalExpenses / members.length : 0;

  // Apply share and calculate balance
  Object.values(balances).forEach((user) => {
    user.share = Number(sharePerPerson.toFixed(2));
    user.balance = Number((user.paid - user.share).toFixed(2));
  });

  return res.status(200).json({
    balances: Object.values(balances),
  });
};

//PUT /projects/:id/calculate-debts
export const calculateDebts = async (req: Request, res: Response) => {
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
    .select("group_id, settlements_calculated")
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

  if (project.settlements_calculated) {
    return res.status(400).json({
      message: "Settlements already calculated",
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

  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      users (
        id,
        name
      )
    `,
    )
    .eq("group_id", project.group_id);
  if (membersError) {
    return res.status(500).json({
      message: membersError.message,
    });
  }

  const balances: Record<
    string,
    {
      userId: string;
      name: string;
      balance: number;
    }
  > = {};

  // Initialize members
  members.forEach((member: any) => {
    balances[member.user_id] = {
      userId: member.user_id,
      name: member.users.name,
      balance: 0,
    };
  });

  // Add what each person paid
  expenses.forEach((expense) => {
    if (balances[expense.paid_by]) {
      balances[expense.paid_by].balance += Number(expense.amount);
    }
  });

  // Calculate equal share
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  const sharePerPerson =
    members.length > 0 ? totalExpenses / members.length : 0;

  // Remove each person's fair share
  Object.values(balances).forEach((user) => {
    user.balance -= sharePerPerson;
    user.balance = Number(user.balance.toFixed(2));
  });

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "completed");

  if (paymentsError) {
    return res.status(500).json({
      message: paymentsError.message,
    });
  }

  payments.forEach((payment) => {
    if (balances[payment.payer_id]) {
      balances[payment.payer_id].balance += Number(payment.amount);

      balances[payment.payer_id].balance = Number(
        balances[payment.payer_id].balance.toFixed(2),
      );
    }

    if (balances[payment.receiver_id]) {
      balances[payment.receiver_id].balance -= Number(payment.amount);

      balances[payment.receiver_id].balance = Number(
        balances[payment.receiver_id].balance.toFixed(2),
      );
    }
  });

  const debtors: {
    userId: string;
    name: string;
    amount: number;
  }[] = [];

  const receivers: {
    userId: string;
    name: string;
    amount: number;
  }[] = [];

  Object.values(balances).forEach((user) => {
    if (user.balance < 0) {
      debtors.push({
        userId: user.userId,
        name: user.name,
        amount: Math.abs(user.balance),
      });
    }

    if (user.balance > 0) {
      receivers.push({
        userId: user.userId,
        name: user.name,
        amount: user.balance,
      });
    }
  });

  const debts: {
    from: string;
    fromId: string;
    to: string;
    toId: string;
    amount: number;
  }[] = [];

  let debtorIndex = 0;
  let receiverIndex = 0;

  while (debtorIndex < debtors.length && receiverIndex < receivers.length) {
    const debtor = debtors[debtorIndex];
    const receiver = receivers[receiverIndex];

    const amount = Math.min(debtor.amount, receiver.amount);

    debts.push({
      from: debtor.name,
      fromId: debtor.userId,
      to: receiver.name,
      toId: receiver.userId,
      amount: Number(amount.toFixed(2)),
    });

    debtor.amount -= amount;
    receiver.amount -= amount;

    if (debtor.amount === 0) {
      debtorIndex++;
    }

    if (receiver.amount === 0) {
      receiverIndex++;
    }
  }

  const { error: paymentsInsertError } = await supabase.from("payments").insert(
    debts.map((debt) => ({
      project_id: projectId,
      payer_id: debt.fromId,
      receiver_id: debt.toId,
      amount: debt.amount,
      status: "pending",
    })),
  );

  if (paymentsInsertError) {
    return res.status(500).json({
      message: paymentsInsertError.message,
    });
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      settlements_calculated: true,
    })
    .eq("id", projectId);

  if (updateError) {
    return res.status(500).json({
      message: updateError.message,
    });
  }

  return res.status(200).json({
    debts,
  });
};

