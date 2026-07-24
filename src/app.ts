import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import groupRoutes from "./routes/group.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import groupMemberRoutes from "./routes/groupMember.routes.js";
import projectRoutes from "./routes/project.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import balanceRoutes from "./routes/balance.routes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

app.use(cors()); //in order to allow react to call our api
app.use(express.json());

app.use("/users", userRoutes);

app.use("/auth", authRoutes);

app.use("/groups", groupRoutes);

app.use("/invitations", invitationRoutes);

app.use("/groups", groupMemberRoutes);

app.use("/groups", projectRoutes);

app.use("/projects", expenseRoutes);

app.use("/projects", balanceRoutes);

app.use("/projects", paymentRoutes);

app.get("/", (req, res) => {
  res.send("SplitLedger API is running");
});

export default app;