import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import parishInfo from "../chatbot/data/parishInfo.json" with { type: "json" };
import { parishTools } from "../chatbot/parishTools.js";

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ===================================================
   🔹 Initialize Gemini Model
=================================================== */
let model;
try {
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  console.log("✅ Using Gemini 2.0 Flash Experimental model");
} catch (err) {
  console.warn("⚠️ Falling back to Gemini 1.5 Flash:", err.message);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

/* ===================================================
   📖 System Instructions
=================================================== */
const SYSTEM_INSTRUCTIONS = `You are a warm, helpful assistant for Our Lady of Peace and Good Voyage Parish in Lipa City, Batangas.

YOUR PERSONALITY:
- Speak naturally like a friendly parish staff member
- Be warm, welcoming, and respectful
- Keep responses conversational (2-4 sentences typically)
- Match the user's language (Tagalog or English)
- Use a tone that's helpful but not overly formal

YOUR SCOPE:
You ONLY answer questions about:
✅ Parish location, contact info, office hours
✅ Mass schedules and services
✅ Parish events, announcements, and advisories
✅ Available services (baptism, wedding, etc.) and booking slots
✅ Parish ministries and mission
✅ General parish information

For questions OUTSIDE parish topics:
❌ Politely redirect: "I'm here to help with parish-related questions. Is there something about our church I can help you with?"

RESPONSE GUIDELINES:
- Answer directly based on the data provided
- If data is empty/unavailable, say so naturally (e.g., "We don't have any upcoming events scheduled yet")
- Don't mention technical terms like "database" or "system"
- Don't ask users to rephrase unless truly unclear
- Be specific when data is available, general when it's not
- Always end helpfully (offer to assist further or provide contact info when relevant)

LANGUAGE HANDLING:
- Detect language from user's message
- Respond in the SAME language
- Tagalog: Use natural Filipino expressions, be warm ("po", "Opo", casual tone)
- English: Professional but friendly, clear and concise

Remember: You represent the parish, so always be kind, patient, and helpful!`;

/* ===================================================
   💬 Conversation Memory (5-minute timeout)
=================================================== */
const conversations = new Map();
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function getConversation(id) {
  if (!id) return null;
  const record = conversations.get(id);
  if (record && Date.now() - record.lastActive > INACTIVITY_TIMEOUT) {
    conversations.delete(id);
    return null;
  }
  return record;
}

function updateConversation(id, messages) {
  conversations.set(id, { messages, lastActive: Date.now() });
}

/* ===================================================
   🎯 Intent Detection (Bilingual)
=================================================== */
function detectIntent(text = "") {
  const t = text.toLowerCase().trim();
  
  // Parish info
  if (/\b(where|saan|nasaan|location|address|matatagpuan|map|lugar)\b/.test(t)) return "location";
  if (/\b(contact|phone|email|call|text|tawag|numero|cellphone|telepono)\b/.test(t)) return "contact";
  if (/\b(hours?|oras|open|bukas|close|sarado|office|opisina|secretariat)\b/.test(t)) return "office_hours";
  if (/\b(mission|vision|misyon|bisyon|purpose|layunin)\b/.test(t)) return "mission_vision";
  if (/\b(ministry|ministries|ministrya|pangkat|group)\b/.test(t)) return "ministries";
  
  // Mass & Services
  if (/\b(mass|misa|schedule|iskedyul|oras ng misa|sunday|weekday)\b/.test(t)) return "mass_schedule";
  
  // Events & News
  if (/\b(event|programa|activity|kaganapan|happening|nangyayari|upcoming|susunod)\b/.test(t)) return "events";
  if (/\b(news|balita|update|latest|pinakabago)\b/.test(t)) return "news";
  
  // Announcements & Advisories
  if (/\b(announcement|anunsyo|paalala|notice|abiso|advisory)\b/.test(t)) {
    if (/\b(advisory|abiso|alert)\b/.test(t)) return "advisories";
    return "announcements";
  }
  
  // Services & Availability
  if (/\b(baptism|binyag|wedding|kasal|confirmation|kumpil|funeral|libing|blessing|basbas)\b/.test(t)) {
    if (/\b(available|avaible|availability|slot|libre|pwede|book|reserve|schedule)\b/.test(t)) {
      return "check_availability";
    }
    return "services";
  }
  
  if (/\b(service|serbisyo|sacrament|sakramento|offer)\b/.test(t)) return "services";
  if (/\b(slot|available|avaible|book|reserve|appointment|schedule|libre|pwede)\b/.test(t)) return "check_availability";
  
  // Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|kamusta|kumusta|musta)/i.test(t)) return "greeting";
  
  return "general";
}

/* ===================================================
   🔍 Gather Context Data
=================================================== */
async function gatherContextData(intent, message) {
  const context = { intent, parish: parishInfo };
  
  try {
    switch (intent) {
      case "services":
      case "check_availability":
        context.services = await parishTools.getServices();
        
        if (intent === "check_availability" && context.services.length > 0) {
          // Try to identify specific service
          const lower = message.toLowerCase();
          const serviceKeywords = {
            baptism: ['baptism', 'binyag'],
            wedding: ['wedding', 'kasal', 'marriage'],
            confirmation: ['confirmation', 'kumpil'],
            funeral: ['funeral', 'libing', 'burol'],
            blessing: ['blessing', 'basbas']
          };
          
          let targetService = null;
          for (const [key, keywords] of Object.entries(serviceKeywords)) {
            if (keywords.some(kw => lower.includes(kw))) {
              targetService = context.services.find(s => 
                s.name.toLowerCase().includes(key)
              );
              break;
            }
          }
          
          // Get availability for specific service or first available
          const serviceToCheck = targetService || context.services[0];
          if (serviceToCheck) {
            context.availability = await parishTools.getAvailability(serviceToCheck.id, 7);
            context.checkedService = serviceToCheck.name;
          }
        }
        break;
        
      case "events":
      case "news":
        context.events = await parishTools.getEvents();
        break;
        
      case "announcements":
        context.announcements = await parishTools.getAnnouncements();
        break;
        
      case "advisories":
        context.advisories = await parishTools.getAdvisories();
        break;
    }
  } catch (error) {
    console.error("❌ Error gathering context:", error);
  }
  
  return context;
}

/* ===================================================
   📝 Format Context for AI
=================================================== */
function formatContextForAI(context) {
  const { intent, parish, services, availability, checkedService, events, announcements, advisories } = context;
  
  let contextText = `PARISH INFORMATION:
Name: ${parish.parish_name}
Address: ${parish.address}
Phone: ${parish.contact.phone}
Email: ${parish.contact.email}
Office Hours: ${parish.contact.office_hours}

MASS SCHEDULE:
- Sundays: ${parish.mass_schedule.sunday.join(", ")}
- Weekdays: ${parish.mass_schedule.weekday.join(", ")}

MISSION: ${parish.mission}
VISION: ${parish.vision}

MINISTRIES: ${parish.ministries.join(", ")}
`;

  // Add relevant live data
  if (services && services.length > 0) {
    contextText += `\nAVAILABLE SERVICES:\n`;
    services.forEach(s => {
      contextText += `- ${s.name}: ${s.description || 'Parish service'}\n`;
    });
  }
  
  if (availability && checkedService) {
    const totalSlots = availability.reduce((sum, day) => sum + (day.remaining || 0), 0);
    const availableDays = availability.filter(day => day.remaining > 0).length;
    
    contextText += `\nAVAILABILITY FOR ${checkedService.toUpperCase()}:\n`;
    if (totalSlots > 0) {
      contextText += `- ${totalSlots} total available slots across ${availableDays} days in the next week\n`;
      const nextAvailable = availability.find(day => day.remaining > 0);
      if (nextAvailable) {
        contextText += `- Next available: ${nextAvailable.date} (${nextAvailable.remaining} slots)\n`;
      }
    } else {
      contextText += `- Currently no available slots. Please contact the office.\n`;
    }
  }
  
  if (events && events.length > 0) {
    contextText += `\nUPCOMING EVENTS:\n`;
    events.slice(0, 3).forEach(e => {
      contextText += `- ${e.title} (${new Date(e.date).toLocaleDateString()})${e.time ? ` at ${e.time}` : ''}\n`;
    });
  } else if (intent === "events" || intent === "news") {
    contextText += `\nUPCOMING EVENTS: No events currently scheduled.\n`;
  }
  
  if (announcements && announcements.length > 0) {
    contextText += `\nRECENT ANNOUNCEMENTS:\n`;
    announcements.forEach(a => {
      contextText += `- ${a.title}\n`;
    });
  } else if (intent === "announcements") {
    contextText += `\nRECENT ANNOUNCEMENTS: No active announcements at this time.\n`;
  }
  
  if (advisories && advisories.length > 0) {
    contextText += `\nACTIVE ADVISORIES:\n`;
    advisories.forEach(a => {
      contextText += `- ${a.title}: ${a.message}\n`;
    });
  } else if (intent === "advisories") {
    contextText += `\nACTIVE ADVISORIES: No advisories at this time.\n`;
  }
  
  return contextText;
}

/* ===================================================
   💬 Main Chat Endpoint
=================================================== */
router.post("/", async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required and must be a non-empty string." });
    }
    
    const userMessage = message.trim();
    const cid = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n💬 [${cid}] User: "${userMessage}"`);
    
    // Detect intent and gather context
    const intent = detectIntent(userMessage);
    console.log(`🎯 Detected intent: ${intent}`);
    
    const context = await gatherContextData(intent, userMessage);
    const contextText = formatContextForAI(context);
    
    // Get conversation history
    const record = getConversation(cid);
    const history = record?.messages || [];
    
    // Build conversation for AI
    const messages = [
      { role: "user", parts: [{ text: SYSTEM_INSTRUCTIONS }] },
      ...history,
      { 
        role: "user", 
        parts: [{ text: `CURRENT CONTEXT:\n${contextText}\n\nUSER MESSAGE: "${userMessage}"\n\nRespond naturally and helpfully based on the context provided.` }] 
      }
    ];
    
    // Generate response
    const result = await model.generateContent({
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        topP: 0.9,
        topK: 40
      }
    });
    
    const aiResponse = result.response.text()?.trim();
    
    if (!aiResponse || aiResponse.length < 5) {
      throw new Error("AI generated empty or invalid response");
    }
    
    console.log(`🤖 AI Response: "${aiResponse}"`);
    
    // Update conversation history (keep last 6 exchanges)
    const updatedHistory = [
      ...history.slice(-10), // Keep last 10 messages (5 exchanges)
      { role: "user", parts: [{ text: userMessage }] },
      { role: "model", parts: [{ text: aiResponse }] }
    ];
    updateConversation(cid, updatedHistory);
    
    return res.json({
      message: aiResponse,
      conversationId: cid,
      intent: intent // Optional: for debugging
    });
    
  } catch (error) {
    console.error("❌ Chatbot Error:", error);
    
    // Detect language from original message for error response
    const isTagalog = req.body.message && /\b(ano|paano|saan|kailan|mga|po)\b/i.test(req.body.message);
    
    return res.status(500).json({
      message: isTagalog 
        ? "Paumanhin po, may problema sa aming sistema. Pakisubukan muli o tumawag sa aming opisina."
        : "I apologize, but I'm experiencing technical difficulties. Please try again or contact our parish office.",
      conversationId: req.body.conversationId,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/* ===================================================
   🔄 Reset Conversation
=================================================== */
router.post("/reset", (req, res) => {
  const { conversationId } = req.body;
  if (conversationId && conversations.has(conversationId)) {
    conversations.delete(conversationId);
    console.log(`🔄 Conversation reset: ${conversationId}`);
  }
  res.json({ success: true, message: "Conversation reset successfully" });
});

/* ===================================================
   📊 Health Check (Optional)
=================================================== */
router.get("/health", async (req, res) => {
  try {
    const services = await parishTools.getServices();
    res.json({
      status: "healthy",
      model: "gemini-2.0-flash-exp",
      activeConversations: conversations.size,
      servicesAvailable: services.length
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

export default router;