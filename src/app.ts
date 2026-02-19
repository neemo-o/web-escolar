import express from "express";
import cors from "cors";

export const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  return res.json({ status: "ok" });
});
