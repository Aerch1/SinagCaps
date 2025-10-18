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
   📖 Enhanced System Instructions
=================================================== */
const SYSTEM_INSTRUCTIONS = `You are a warm, knowledgeable assistant for Our Lady of Peace and Good Voyage Parish in Lipa City, Batangas.

YOUR PERSONALITY:
- Speak naturally like a caring parish staff member who truly understands people's needs
- Be warm, welcoming, and genuinely helpful
- Vary your responses - don't repeat the same patterns
- Match the user's language (Tagalog or English) and tone
- Use natural conversation flow, not templated responses

YOUR EXPERTISE:
You answer questions about Our Lady of Peace and Good Voyage Parish:
✅ Location, contact details, office hours (Closed Mondays, Open Tuesday-Sunday 8AM-5PM)
✅ Parish Priest: Rev. Fr. Joseph P. Mendoza
✅ Mass schedules (detailed schedule for each day of the week)
✅ Confession schedule (Saturday after 6:30 AM Mass, Friday after 5:00 PM Mass)
✅ Online Mass streaming (Sunday 8:30 AM via Facebook Live)
✅ Parish events, news, and announcements
✅ Services (baptism, wedding, confirmation, funeral, blessings) and their availability
✅ Appointment booking process (online via website or in-person at office)
✅ Parish ministries and community programs
✅ Parish mission and vision

For NON-parish topics:
❌ Politely redirect: "I'm here to help with parish matters. How can I assist you with our church?"

RESPONSE INTELLIGENCE:
- ANALYZE the actual question being asked, not just keywords
- Provide SPECIFIC information when available from the data
- If checking availability, give CONCRETE details about slots and dates
- When no data exists, acknowledge it naturally without robotic phrases
- Don't say "according to the data" or "the system shows" - speak directly
- Vary your sentence structure and phrasing
- Add helpful context when relevant (e.g., "For weddings, we recommend booking 3-6 months ahead")
- When asked about the priest, mention Rev. Fr. Joseph P. Mendoza naturally
- When discussing appointments, guide users to the website or office contact

CONVERSATION AWARENESS:
- Remember what was discussed in this conversation
- Don't repeat information already provided unless asked
- Build on previous context naturally
- If user asks follow-up questions, provide additional details

LANGUAGE & TONE:
- Tagalog: Warm and respectful ("po", "Opo"), conversational
- English: Professional yet friendly, clear and helpful
- Detect mixed language (Taglish) and respond accordingly

IMPORTANT: Every response should feel unique and specifically crafted for that question. Avoid formulaic patterns.`;

/* ===================================================
   💬 Conversation Memory (10-minute timeout)
=================================================== */
const conversations = new Map();
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

function getConversation(id) {
  if (!id) return null;
  const record = conversations.get(id);
  if (record && Date.now() - record.lastActive > INACTIVITY_TIMEOUT) {
    conversations.delete(id);
    return null;
  }
  return record;
}

function updateConversation(id, messages, metadata = {}) {
  conversations.set(id, { 
    messages, 
    lastActive: Date.now(),
    metadata: { ...metadata, messageCount: (metadata.messageCount || 0) + 1 }
  });
}

/* ===================================================
   🎯 Smart Intent & Topic Detection
=================================================== */
function analyzeQuery(text = "", conversationHistory = []) {
  const t = text.toLowerCase().trim();
  const topics = new Set();
  const intents = new Set();
  
  // Detect multiple topics in one query
  const topicPatterns = {
    location: /\b(where|saan|nasaan|location|address|matatagpuan|map|lugar|directions)\b/,
    contact: /\b(contact|phone|email|call|text|tawag|numero|cellphone|telepono|reach|website|site)\b/,
    hours: /\b(hours?|oras|open|bukas|close|sarado|office|opisina|secretariat|available)\b/,
    mass: /\b(mass|misa|schedule|iskedyul|oras ng misa|sunday|weekday|monday|tuesday|wednesday|thursday|friday|saturday|eucharist|holy|anticipated)\b/,
    confession: /\b(confession|kumpisal|reconciliation|sacrament of penance)\b/,
    priest: /\b(priest|pari|pastor|father|fr|reverend|paroko)\b/,
    streaming: /\b(online|facebook|fb|live|stream|virtual|watch)\b/,
    events: /\b(event|programa|activity|kaganapan|happening|nangyayari|upcoming|susunod|celebration|pagdiriwang)\b/,
    announcements: /\b(announcement|anunsyo|paalala|notice|abiso|update|balita|latest|news|bagong|bago)\b/,
    advisories: /\b(advisory|abiso|alert|important|mahalaga|warning|babala|urgent|reminder)\b/,
    services: /\b(baptism|binyag|wedding|kasal|confirmation|kumpil|funeral|libing|blessing|basbas|service|serbisyo|sacrament)\b/,
    availability: /\b(available|avaible|availability|slot|libre|pwede|book|reserve|appointment|schedule|when can|may|meron)\b/,
    booking: /\b(book|reserve|appointment|mag-book|magpa-schedule|how to book|paano mag-book)\b/,
    mission: /\b(mission|vision|misyon|bisyon|purpose|layunin|about|tungkol)\b/,
    ministries: /\b(ministry|ministries|ministrya|pangkat|group|volunteer|serve|kawanihan)\b/,
  };
  
  // Identify all relevant topics
  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(t)) topics.add(topic);
  }
  
  // Enhanced intent detection with fallback patterns
  // Check for "what's new" type questions - should trigger announcements/events/advisories
  if (/\b(what'?s|ano ang|anong|may|meron|any)\b.*\b(new|bago|bagong|latest|update|happening|nangyayari)\b/i.test(t)) {
    intents.add('announcements');
    intents.add('events');
    intents.add('advisories');
  }
  
  // Determine primary intent
  if (topics.has('availability') && topics.has('services')) {
    intents.add('check_availability');
  } else if (topics.has('services')) {
    intents.add('services_info');
  }
  
  if (topics.has('booking')) intents.add('booking_info');
  if (topics.has('mass') || topics.has('confession')) intents.add('mass_schedule');
  if (topics.has('streaming')) intents.add('streaming_info');
  if (topics.has('priest')) intents.add('priest_info');
  if (topics.has('events')) intents.add('events');
  if (topics.has('announcements')) intents.add('announcements');
  if (topics.has('advisories')) intents.add('advisories');
  if (topics.has('location') || topics.has('contact') || topics.has('hours')) {
    intents.add('parish_info');
  }
  if (topics.has('mission') || topics.has('ministries')) {
    intents.add('about_parish');
  }
  
  // Greeting detection
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|kamusta|kumusta|musta)/i.test(t)) {
    intents.add('greeting');
  }
  
  // Broad question detection - fetch everything to let AI decide
  if (/\b(what|ano|tell me|sabihin|info|information|know|alam)\b/i.test(t) && intents.size === 0) {
    intents.add('general_inquiry');
  }
  
  // Default to general inquiry
  if (intents.size === 0) intents.add('general');
  
  return {
    topics: Array.from(topics),
    intents: Array.from(intents),
    isFollowUp: conversationHistory.length > 0,
    serviceKeywords: extractServiceKeywords(t)
  };
}

function extractServiceKeywords(text) {
  const keywords = {
    baptism: ['baptism', 'binyag', 'christening'],
    wedding: ['wedding', 'kasal', 'marriage', 'marry'],
    confirmation: ['confirmation', 'kumpil'],
    funeral: ['funeral', 'libing', 'burol', 'wake'],
    blessing: ['blessing', 'basbas', 'bless']
  };
  
  const found = [];
  for (const [service, words] of Object.entries(keywords)) {
    if (words.some(w => text.toLowerCase().includes(w))) {
      found.push(service);
    }
  }
  return found;
}

/* ===================================================
   🔍 Intelligent Context Gathering
=================================================== */
async function gatherRelevantContext(analysis, message) {
  const context = { 
    parish: parishInfo,
    analysis: analysis
  };
  
  const { intents, serviceKeywords } = analysis;
  
  try {
    // Fetch data based on intents
    const fetchPromises = [];
    
    // Always fetch services if service-related
    if (intents.includes('services_info') || intents.includes('check_availability')) {
      fetchPromises.push(
        parishTools.getServices().then(data => { context.services = data; })
      );
    }
    
    // Fetch events for event-related queries
    if (intents.includes('events') || intents.includes('general_inquiry')) {
      fetchPromises.push(
        parishTools.getEvents().then(data => { 
          context.events = data;
          console.log(`📅 Fetched ${data?.length || 0} events`);
        })
      );
    }
    
    // Fetch announcements
    if (intents.includes('announcements') || intents.includes('general_inquiry')) {
      fetchPromises.push(
        parishTools.getAnnouncements().then(data => { 
          context.announcements = data;
          console.log(`📢 Fetched ${data?.length || 0} announcements`);
        })
      );
    }
    
    // Fetch advisories
    if (intents.includes('advisories') || intents.includes('general_inquiry')) {
      fetchPromises.push(
        parishTools.getAdvisories().then(data => { 
          context.advisories = data;
          console.log(`🔔 Fetched ${data?.length || 0} advisories`);
        })
      );
    }
    
    // Wait for all fetches to complete
    await Promise.all(fetchPromises);
    
    // Handle availability separately as it depends on services being fetched first
    if (intents.includes('check_availability') && context.services?.length > 0) {
      const targetService = findTargetService(context.services, serviceKeywords, message);
      
      if (targetService) {
        const availability = await parishTools.getAvailability(targetService.id, 7);
        context.availability = {
          service: targetService,
          schedule: availability,
          summary: summarizeAvailability(availability)
        };
        console.log(`📆 Fetched availability for ${targetService.name}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Context gathering error:", error);
  }
  
  return context;
}

function findTargetService(services, keywords, message) {
  if (keywords.length > 0) {
    for (const kw of keywords) {
      const found = services.find(s => s.name.toLowerCase().includes(kw));
      if (found) return found;
    }
  }
  // Fallback: return first service if availability was requested
  return services[0] || null;
}

function summarizeAvailability(schedule) {
  const totalSlots = schedule.reduce((sum, day) => sum + (day.remaining || 0), 0);
  const availableDays = schedule.filter(day => day.remaining > 0);
  const nextAvailable = availableDays[0];
  
  return {
    totalSlots,
    availableDaysCount: availableDays.length,
    nextAvailable: nextAvailable ? {
      date: nextAvailable.date,
      slots: nextAvailable.remaining
    } : null
  };
}

/* ===================================================
   📝 Build Natural Context for AI
=================================================== */
function buildContextPrompt(context, userMessage) {
  const { parish, services, availability, events, announcements, advisories, analysis } = context;
  
  let prompt = `USER'S QUESTION: "${userMessage}"\n\n`;
  
  // Add conversation context
  if (analysis.isFollowUp) {
    prompt += `[This is a follow-up question in an ongoing conversation]\n\n`;
  }
  
  prompt += `PARISH KNOWLEDGE BASE:\n\n`;
  
  // Core parish info (always include basics)
  prompt += `Parish: ${parish.parish_name}\n`;
  prompt += `Parish Priest: ${parish.pastor.name} (${parish.pastor.title})\n`;
  prompt += `Location: ${parish.address}\n`;
  prompt += `Phone: ${parish.contact.phone}\n`;
  prompt += `Email: ${parish.contact.email}\n`;
  prompt += `Website: ${parish.contact.website}\n`;
  prompt += `Office Hours: ${parish.contact.office_hours}\n\n`;
  
  // Enhanced Mass Schedule with all details
  prompt += `MASS SCHEDULE:\n`;
  prompt += `Monday to Thursday:\n`;
  prompt += `  - ${parish.mass_schedule.monday_to_thursday.times.join(", ")} (${parish.mass_schedule.monday_to_thursday.type})\n\n`;
  prompt += `Friday:\n`;
  prompt += `  - ${parish.mass_schedule.friday.times.join(", ")}\n`;
  prompt += `  - Notes: ${parish.mass_schedule.friday.notes}\n\n`;
  prompt += `Saturday:\n`;
  prompt += `  - ${parish.mass_schedule.saturday.times.join(", ")}\n`;
  prompt += `  - Notes: ${parish.mass_schedule.saturday.notes}\n\n`;
  prompt += `Sunday:\n`;
  prompt += `  - ${parish.mass_schedule.sunday.times.join(", ")}\n`;
  prompt += `  - Notes: ${parish.mass_schedule.sunday.notes}\n\n`;
  
  // Confession and Online Services
  if (parish.sacraments?.confession) {
    prompt += `Confession Schedule: ${parish.sacraments.confession.schedule}\n`;
    if (parish.sacraments.confession.by_appointment) {
      prompt += `  - Also available by appointment\n`;
    }
    prompt += `\n`;
  }
  
  if (parish.online_services?.facebook_live) {
    prompt += `Online Mass: ${parish.online_services.facebook_live}\n\n`;
  }
  
  // Appointment/Booking Information
  if (analysis.intents.includes('booking_info') || analysis.intents.includes('check_availability')) {
    prompt += `HOW TO BOOK APPOINTMENTS:\n`;
    prompt += `Method: ${parish.appointments.booking_method}\n`;
    prompt += `Instructions: ${parish.appointments.instructions}\n`;
    prompt += `Contact: ${parish.appointments.office_contact}\n\n`;
  }
  
  // Conditionally add relevant data
  if (services && services.length > 0) {
    prompt += `Available Services:\n`;
    services.forEach(s => {
      prompt += `- ${s.name}: ${s.description || 'Available at our parish'}\n`;
    });
    prompt += `\n`;
  }
  
  if (availability) {
    const { service, schedule, summary } = availability;
    prompt += `${service.name} Availability (Next 7 Days):\n`;
    if (summary.totalSlots > 0) {
      prompt += `- Total available slots: ${summary.totalSlots}\n`;
      prompt += `- Next available date: ${summary.nextAvailable.date} (${summary.nextAvailable.slots} slots)\n`;
      prompt += `- Available days: ${summary.availableDaysCount}\n`;
      
      // Show daily breakdown
      const availableDays = schedule.filter(d => d.remaining > 0);
      if (availableDays.length > 0 && availableDays.length <= 3) {
        prompt += `\nDetailed Schedule:\n`;
        availableDays.forEach(day => {
          prompt += `  • ${day.date}: ${day.remaining} slot(s) available\n`;
        });
      }
      prompt += `\nTo book: Visit ${parish.contact.website} or call ${parish.contact.phone}\n`;
    } else {
      prompt += `- Currently fully booked for the next week\n`;
      prompt += `- Recommendation: Contact office at ${parish.contact.phone} for waitlist or future dates\n`;
    }
    prompt += `\n`;
  }
  
  if (events && events.length > 0) {
    prompt += `Upcoming Events:\n`;
    events.slice(0, 3).forEach(e => {
      const dateStr = new Date(e.date).toLocaleDateString('en-US', { 
        month: 'long', day: 'numeric', year: 'numeric' 
      });
      prompt += `- ${e.title} (${dateStr})${e.time ? ` at ${e.time}` : ''}\n`;
      if (e.description) prompt += `  ${e.description}\n`;
    });
    prompt += `\n`;
  } else if (analysis.intents.includes('events')) {
    prompt += `Upcoming Events: No events currently scheduled.\n\n`;
  }
  
  if (announcements && announcements.length > 0) {
    prompt += `Recent Announcements:\n`;
    announcements.forEach(a => {
      prompt += `- ${a.title}\n`;
      if (a.text) prompt += `  ${a.text}\n`;
    });
    prompt += `\n`;
  } else if (analysis.intents.includes('announcements')) {
    prompt += `Recent Announcements: No active announcements at this time.\n\n`;
  }
  
  if (advisories && advisories.length > 0) {
    prompt += `Active Advisories:\n`;
    advisories.forEach(a => {
      prompt += `- ${a.title}: ${a.message}\n`;
    });
    prompt += `\n`;
  } else if (analysis.intents.includes('advisories')) {
    prompt += `Active Advisories: No advisories at this time.\n\n`;
  }
  
  // Add parish mission/vision if relevant
  if (analysis.intents.includes('about_parish')) {
    prompt += `Mission: ${parish.mission}\n`;
    prompt += `Vision: ${parish.vision}\n`;
    prompt += `Ministries: ${parish.ministries.join(", ")}\n\n`;
  }
  
  prompt += `INSTRUCTIONS:\n`;
  prompt += `Answer the user's question using the information above. Be specific, helpful, and natural. `;
  prompt += `If data shows availability, mention specific dates and slots. `;
  prompt += `If asked about booking, guide them to the website (${parish.contact.website}) or office contact. `;
  prompt += `If asked about the priest, mention ${parish.pastor.name} naturally. `;
  prompt += `If no data is available for what they're asking, say so honestly and suggest contacting the office. `;
  prompt += `Keep your response conversational and concise (2-5 sentences typically).`;
  
  return prompt;
}

/* ===================================================
   💬 Main Chat Endpoint
=================================================== */
router.post("/", async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required and must be a non-empty string." });
    }
    
    const userMessage = message.trim();
    const cid = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n💬 [${cid}] User: "${userMessage}"`);
    
    // Get conversation history
    const record = getConversation(cid);
    const history = record?.messages || [];
    const metadata = record?.metadata || {};
    
    // Analyze query with conversation context
    const analysis = analyzeQuery(userMessage, history);
    console.log(`🎯 Analysis:`, { 
      intents: analysis.intents, 
      topics: analysis.topics,
      serviceKeywords: analysis.serviceKeywords 
    });
    
    // Gather relevant context
    const context = await gatherRelevantContext(analysis, userMessage);
    
    // Log what data was fetched
    console.log(`📊 Context gathered:`, {
      hasServices: !!context.services,
      servicesCount: context.services?.length || 0,
      hasAvailability: !!context.availability,
      hasEvents: !!context.events,
      eventsCount: context.events?.length || 0,
      hasAnnouncements: !!context.announcements,
      announcementsCount: context.announcements?.length || 0,
      hasAdvisories: !!context.advisories,
      advisoriesCount: context.advisories?.length || 0
    });
    
    const contextPrompt = buildContextPrompt(context, userMessage);
    
    // Build conversation for AI
    const messages = [
      { role: "user", parts: [{ text: SYSTEM_INSTRUCTIONS }] },
      ...history.slice(-8), // Keep last 8 messages (4 exchanges)
      { role: "user", parts: [{ text: contextPrompt }] }
    ];
    
    // Generate response
    const result = await model.generateContent({
      contents: messages,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 350,
        topP: 0.95,
        topK: 40
      }
    });
    
    const aiResponse = result.response.text()?.trim();
    
    if (!aiResponse || aiResponse.length < 5) {
      throw new Error("AI generated empty response");
    }
    
    console.log(`🤖 AI: "${aiResponse.substring(0, 100)}..."`);
    
    // Update conversation history
    const updatedHistory = [
      ...history.slice(-8),
      { role: "user", parts: [{ text: userMessage }] },
      { role: "model", parts: [{ text: aiResponse }] }
    ];
    
    updateConversation(cid, updatedHistory, {
      ...metadata,
      lastIntent: analysis.intents[0],
      lastTopics: analysis.topics
    });
    
    return res.json({
      message: aiResponse,
      conversationId: cid,
      debug: process.env.NODE_ENV === 'development' ? {
        intents: analysis.intents,
        topics: analysis.topics
      } : undefined
    });
    
  } catch (error) {
    console.error("❌ Chatbot Error:", error);
    
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
   📊 Health Check
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