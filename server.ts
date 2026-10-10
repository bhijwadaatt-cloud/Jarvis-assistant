import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Fallback rule-based action parser when offline or without API key
function parseFallbackJarvis(prompt: string, contacts: Array<{ name: string; phone: string }> = []) {
  const p = prompt.toLowerCase().trim();
  const actions: any[] = [];
  let spokenResponse = "Command processed, Sir.";

  // Check direct contact matching for calls: "Papa ko call lagao", "call Rahul", "call 9876543210"
  const isCallIntent = p.includes("call") || p.includes("phone") || p.includes("dial") || p.includes("lagao") || p.includes("milao");
  if (isCallIntent) {
    const matchedContact = contacts.find((c) => p.includes(c.name.toLowerCase()));
    if (matchedContact) {
      actions.push({
        type: "CALL",
        target: matchedContact.name,
        payload: { phone: matchedContact.phone },
      });
      spokenResponse = `Sir, dialing ${matchedContact.name} immediately.`;
      return { spokenResponse, actions };
    }

    const numberMatch = p.match(/(\+?[0-9]{8,15})/);
    if (numberMatch) {
      actions.push({
        type: "CALL",
        target: numberMatch[1],
        payload: { phone: numberMatch[1] },
      });
      spokenResponse = `Sir, dialing ${numberMatch[1]} immediately.`;
      return { spokenResponse, actions };
    }

    const callMatch = p.match(/(?:call|phone|dial|mila(?:o|ye))\s+(?:to\s+)?([a-z0-9\s]+)/i) ||
                      p.match(/([a-z0-9\s]+)\s+(?:ko\s+)?call/i);
    if (callMatch) {
      const rawTarget = callMatch[1].replace(/(?:lagao|karo|milao|kijiye)/gi, '').trim();
      actions.push({
        type: "CALL",
        target: rawTarget,
        payload: { phone: rawTarget },
      });
      spokenResponse = `Sir, dialing ${rawTarget} immediately.`;
      return { spokenResponse, actions };
    }
  }

  // WhatsApp intent: "whatsapp priya hello", "send whatsapp to rahul"
  if (p.includes("whatsapp")) {
    const matchedContact = contacts.find((c) => p.includes(c.name.toLowerCase()));
    const contactName = matchedContact ? matchedContact.name : "Contact";
    const phone = matchedContact ? matchedContact.phone : "";
    
    let msg = "Hello from Jarvis";
    const quoteMatch = p.match(/["'](.*?)["']/) || p.match(/(?:msg|message|bolna|likho|ki)\s+(.*)/i);
    if (quoteMatch) {
      msg = quoteMatch[1];
    }
    
    actions.push({
      type: "WHATSAPP",
      target: contactName,
      payload: { phone, message: msg },
    });
    spokenResponse = `Sir, preparing WhatsApp message for ${contactName}.`;
    return { spokenResponse, actions };
  }

  // SMS intent: "send sms", "message bhejo"
  if (p.includes("sms") || p.includes("message")) {
    const matchedContact = contacts.find((c) => p.includes(c.name.toLowerCase()));
    const contactName = matchedContact ? matchedContact.name : "Recipient";
    const phone = matchedContact ? matchedContact.phone : "";
    
    actions.push({
      type: "SMS",
      target: contactName,
      payload: { phone, message: "Hello from Jarvis Mobile OS" },
    });
    spokenResponse = `Composing SMS for ${contactName}, Sir.`;
    return { spokenResponse, actions };
  }

  // App launch intent: "open youtube", "camera chalu karo", "spotify kholo"
  if (p.includes("open") || p.includes("kholo") || p.includes("launch") || p.includes("chalu karo") || p.includes("start")) {
    let appName = "youtube";
    if (p.includes("youtube")) appName = "youtube";
    else if (p.includes("camera") || p.includes("photo")) appName = "camera";
    else if (p.includes("spotify") || p.includes("music") || p.includes("gaana")) appName = "spotify";
    else if (p.includes("map") || p.includes("google map") || p.includes("navigation")) appName = "maps";
    else if (p.includes("calc") || p.includes("calculator") || p.includes("hisaab")) appName = "calculator";
    else if (p.includes("chrome") || p.includes("browser") || p.includes("google")) appName = "chrome";
    else if (p.includes("gmail") || p.includes("mail") || p.includes("email")) appName = "gmail";
    else if (p.includes("setting") || p.includes("settings")) appName = "settings";
    else if (p.includes("clock") || p.includes("alarm") || p.includes("timer")) appName = "clock";
    else if (p.includes("gallery") || p.includes("photos")) appName = "gallery";
    else if (p.includes("files") || p.includes("file manager")) appName = "files";
    else if (p.includes("play store") || p.includes("store")) appName = "playstore";
    else if (p.includes("contacts") || p.includes("contact")) appName = "contacts";

    actions.push({
      type: "OPEN_APP",
      target: appName,
      payload: { app: appName },
    });
    spokenResponse = `Opening ${appName.charAt(0).toUpperCase() + appName.slice(1)} now, Sir.`;
    return { spokenResponse, actions };
  }

  // Flashlight / torch
  if (p.includes("flash") || p.includes("torch") || p.includes("light")) {
    const state = p.includes("off") || p.includes("band") ? "off" : "on";
    actions.push({
      type: "SETTING",
      target: "flashlight",
      payload: { feature: "flashlight", state },
    });
    spokenResponse = `Flashlight turned ${state}, Sir.`;
    return { spokenResponse, actions };
  }

  // Reminders / Schedule: "reminder lagao", "remind me to..."
  if (p.includes("remind") || p.includes("reminder") || p.includes("schedule") || p.includes("yaad")) {
    const cleanTitle = prompt.replace(/(?:remind me to|reminder|schedule|yaad dilana|set a reminder)/gi, "").trim() || "Important Task";
    actions.push({
      type: "ADD_REMINDER",
      target: cleanTitle,
      payload: { title: cleanTitle, time: "In 15 minutes", priority: "high" },
    });
    spokenResponse = `Sir, I have added "${cleanTitle}" to your active agenda.`;
    return { spokenResponse, actions };
  }

  // Battery check: "battery kitni hai", "battery status"
  if (p.includes("battery") || p.includes("charge")) {
    actions.push({
      type: "SETTING",
      target: "battery",
      payload: { feature: "battery" },
    });
    spokenResponse = `Checking power telemetry and battery reserves, Sir.`;
    return { spokenResponse, actions };
  }

  return {
    spokenResponse: `Sir, listening to your instructions. Standing by for phone controls, calls, apps, or daily reminders.`,
    actions: [],
  };
}

// API Route: Jarvis Chat & Action dispatching
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { prompt, history = [], deviceContext = {}, contacts = [], reminders = [] } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!ai) {
      // Graceful fallback if GEMINI_API_KEY is not configured
      const fallback = parseFallbackJarvis(prompt, contacts);
      return res.json(fallback);
    }

    const contactsSummary = contacts.map((c: any) => `${c.name}: ${c.phone}`).join(", ");
    const remindersSummary = reminders.map((r: any) => `${r.title} at ${r.time} (${r.completed ? 'completed' : 'pending'})`).join(", ");

    const systemInstruction = `
You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the premier AI Operating System running on the user's Android phone.
User details & context:
- Device Battery: ${deviceContext.batteryLevel ?? "Unknown"}%, Charging: ${deviceContext.isCharging ?? "Unknown"}
- Network: ${deviceContext.online ? "Online" : "Offline"}
- Known Contacts: [${contactsSummary || "Papa: +919876543210, Mummy: +919876543211, Rahul: +919876543212, Priya: +919876543213"}]
- Existing Reminders & Schedule: [${remindersSummary || "No active reminders"}]

CRITICAL EXECUTION MANDATE:
- You have direct access to Android device hardware, dialer, messaging intents, app launcher, and settings.
- When the user asks you to call someone, open an app, send a message, manage settings (torch/flashlight, screen, battery, vibration), or manage reminders/schedule: YOU MUST NEVER REFUSE OR MERELY EXPLAIN HOW TO DO IT MANUALLY. NEVER say "I am an AI and cannot make calls" or "To do this, go to settings".
- You MUST ALWAYS emit the corresponding action object in the "actions" array so the phone executes it immediately!
- The "spokenResponse" must be a direct confirmation that the action is being performed/completed (e.g. "Calling Papa now, Sir.", "Opening YouTube, Sir.", "Flashlight activated, Sir.", "Reminder scheduled, Sir.").

Personality & Voice:
- Speak like Tony Stark's JARVIS: ultra-crisp, elegant, obedient, witty, and polite.
- Address the user respectfully as "Sir" or as appropriate.
- Fluent in Hinglish, Hindi, and English! Match the user's conversation style seamlessly (e.g. if user asks in Hindi/Hinglish like "Papa ko call lagao", reply in polished Hinglish like "Sir, Papa ko dial kiya jaa raha hai." or "Certainly, Sir. Calling Papa right away.").

Phone Control Action Types (You must dispatch in the "actions" array):
1. "CALL": target is contact name or phone number. payload: { phone: string }
2. "WHATSAPP": target is contact name. payload: { phone: string, message: string }
3. "SMS": target is contact name. payload: { phone: string, message: string }
4. "OPEN_APP": target is app name (youtube, camera, whatsapp, spotify, maps, calculator, chrome, gmail, settings, clock, gallery, files, playstore, contacts, telegram, instagram). payload: { app: string, url?: string }
5. "SETTING": target is setting name (flashlight, wakelock, dnd, vibration, battery, wifi, bluetooth). payload: { feature: string, state?: string }
6. "ADD_REMINDER": target is reminder title. payload: { title: string, time: string, priority: "normal" | "high" }
7. "DELETE_REMINDER": target is title or id. payload: { title: string }
8. "DAILY_BRIEFING": payload: { summary: string }
9. "SEARCH": payload: { query: string }

Always return valid JSON adhering to the specified schema.
`;

    const callGeminiWithTimeout = async () => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      );

      const requestPromise = ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spokenResponse: {
                type: Type.STRING,
                description: "The verbal response spoken by Jarvis in Hinglish/English with polite butler tone.",
              },
              actions: {
                type: Type.ARRAY,
                description: "List of executable phone commands to trigger on the Android device.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: "CALL, WHATSAPP, SMS, OPEN_APP, SETTING, ADD_REMINDER, DELETE_REMINDER, DAILY_BRIEFING, SEARCH",
                    },
                    target: {
                      type: Type.STRING,
                      description: "Target contact name, app name, setting, or title",
                    },
                    payload: {
                      type: Type.OBJECT,
                      description: "Additional action data like phone, message, app, state, time, etc.",
                      properties: {
                        phone: { type: Type.STRING },
                        message: { type: Type.STRING },
                        app: { type: Type.STRING },
                        feature: { type: Type.STRING },
                        state: { type: Type.STRING },
                        title: { type: Type.STRING },
                        time: { type: Type.STRING },
                        priority: { type: Type.STRING },
                        query: { type: Type.STRING },
                        summary: { type: Type.STRING },
                      },
                    },
                  },
                  required: ["type"],
                },
              },
              diagnostic: {
                type: Type.OBJECT,
                properties: {
                  hudStatus: { type: Type.STRING },
                  sentiment: { type: Type.STRING },
                },
              },
            },
            required: ["spokenResponse", "actions"],
          },
        },
      });

      return Promise.race([requestPromise, timeoutPromise]);
    };

    const response = await callGeminiWithTimeout();
    const rawText = (response as any).text || "{}";
    const parsed = JSON.parse(rawText);
    return res.json(parsed);
  } catch (err: any) {
    // Seamless silent fallback to Jarvis Core Engine with 0 quota dependency
    const fallback = parseFallbackJarvis(req.body?.prompt || "", req.body?.contacts || []);
    return res.json({
      ...fallback,
      note: "Executed via Jarvis Core Engine",
    });
  }
});

// System health endpoint
app.get("/api/system/status", (req, res) => {
  res.json({
    status: "JARVIS_ONLINE",
    aiEnabled: Boolean(apiKey),
    timestamp: new Date().toISOString(),
    coreVersion: "Mark-VII-Mobile",
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(port, () => {
    console.log(`[JARVIS OS] Server active on port ${port} (mode: ${isProd ? "production" : "development"})`);
  });
}

startServer();
