import express from "express";
import fs from "fs";
import Archiver from "archiver";
import { Storage } from "@google-cloud/storage";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt || "React Native App";

    const appContent = `
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generated App</Text>
      <Text style={styles.subtitle}>Prompt: ${prompt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 10 }
});
`;

    res.json({
      success: true,
      placeholder: true,
      prompt
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Backend running on port", PORT));
