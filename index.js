import express from "express";
import fetch from "node-fetch";
import admin from "firebase-admin";

const app = express();
app.use(express.json());

// Firebase Setup
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const bucket = admin.storage().bucket();

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Generate Endpoint
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt || "Hello from API";

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      }
    );

    const output = await geminiResponse.json();
    res.json({ success: true, output });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
