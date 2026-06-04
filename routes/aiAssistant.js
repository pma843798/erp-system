// server/routes/aiAssistant.js

require('dotenv').config();

const express = require('express');
const router = express.Router();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const Tracker = require('../models/Tracker');

// ======================================================
// ✅ API KEY
// ======================================================

const apiKey = process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
    console.log("❌ GEMINI_API_KEY Missing");
}

const genAI = new GoogleGenerativeAI(apiKey);

// ✅ STABLE MODEL
const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest"
});

// ======================================================
// 🚀 AI ROUTE
// ======================================================

router.post('/ask', async (req, res) => {

    try {

        // ✅ Frontend se history bhi le rahe hain
        const { prompt, history = [] } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                error: "Prompt is required"
            });
        }

        // ======================================================
        // 📦 FETCH CLEAN DATABASE DATA (Filtered via History Context)
        // ======================================================

        const lastFewMessages = history.slice(-3).map(m => m.text).join(' ');
        const textToSearch = `${prompt} ${lastFewMessages}`;
        
        const keywords = textToSearch.split(/[\s,]+/).filter(w => w.length > 2);
        let query = {};
        
        if (keywords.length > 0) {
             const regexPattern = keywords.map(k => `(${k})`).join('|');
             query = {
                 $or: [
                     { styleNo: { $regex: regexPattern, $options: 'i' } },
                     { catNo: { $regex: regexPattern, $options: 'i' } }
                 ]
             };
        }

        // ⚠️ Sirf zaroori entries hi aayengi (limit lagayi hai)
        const rawData = await Tracker.find(query).limit(50).lean();

        const dbData = rawData.map(item => ({
            styleNo: item.styleNo || '',
            catNo: item.catNo || '',
            factoryFOB: item.factoryFOB || '',
            plannedFPT: item.plannedFPT || '',
            plannedGPT: item.plannedGPT || '',
            labdipPlannedDate: item.labdipPlannedDate || '',
            photoSamplePlannedDate: item.photoSamplePlannedDate || '',
            gsmColorLotsPlanned: item.gsmColorLotsPlanned || '',
            approvalStatus: item.approvalStatus || 'Pending',
            pendingStatus: item.pendingStatus || 'In Progress',
            buyerApproval: item.buyerApproval || 'Pending',
            priority: item.priority || 'Medium',
            remark: item.remark || '',
            updatedAt: item.updatedAt || ''
        }));

        // ======================================================
        // 🧠 SYSTEM PROMPT
        // ======================================================

        const systemPrompt = `
You are PMA Smart System — a futuristic AI assistant for production management and planning.

You help users with:
- FPT Plans
- GPT Plans
- Labdip Status
- Photo Sample Tracking
- Test Reports
- GSM / Color Lots
- Remarks
- Style Tracking
- Production Analysis
- Pending Updates
- Delay Reports

━━━━━━━━━━━━━━━━━━━━━━━
🌐 LANGUAGE RULES
━━━━━━━━━━━━━━━━━━━━━━━

- Understand Hindi, Hinglish, and English naturally.
- ALWAYS reply in the same language as the user.
- Keep replies short, professional, smart, and human-like.
- Never sound robotic.

━━━━━━━━━━━━━━━━━━━━━━━
📌 CORE RULES
━━━━━━━━━━━━━━━━━━━━━━━

1. ONLY answer what the user asks.

Examples:
- If user asks FPT → ONLY give FPT.
- If user asks GPT → ONLY give GPT.
- If user asks Remarks → ONLY give Remarks.
- If user asks update → ONLY show updated fields.

2. NEVER dump unnecessary database records.

3. NEVER show full details/table unless user explicitly asks:
- full details
- complete details
- full status
- show all
- complete info

4. NEVER generate fake information.
ONLY use provided database records.

5. If data is unavailable:
Politely reply:
- Data not available
- Not planned yet
- No remarks added
- No recent updates found

━━━━━━━━━━━━━━━━━━━━━━━
🧠 SMART QUERY RULES
━━━━━━━━━━━━━━━━━━━━━━━

If user asks incomplete queries like:

- fpt
- gpt
- update
- latest update
- remarks
- labdip
- status
- photo sample
- test report

AND Style No. or CAT No. is missing,

THEN ask:

"Please share Style No. or CAT No."

━━━━━━━━━━━━━━━━━━━━━━━
⚠️ DUPLICATE STYLE RULES
━━━━━━━━━━━━━━━━━━━━━━━

If multiple records exist for same Style No.,

DO NOT answer randomly.

Politely ask:

"I found multiple entries for this style.
Please confirm CAT No. or Factory FOB date."

━━━━━━━━━━━━━━━━━━━━━━━
🆕 UPDATE / CHANGE DETECTION RULES
━━━━━━━━━━━━━━━━━━━━━━━

If user asks:

- any update
- latest update
- updated date
- what changed
- recent change
- update hua kya
- kya update hua
- any changes
- changed fields

THEN:

1. ONLY show updated or changed fields.
2. DO NOT show full table/details.
3. Show ONLY important updated fields.
4. Use clean bullet point format.
5. Keep response concise.

Example:

Latest Updates for Style R1121:

• Planned FPT updated to: 27/05/2026
• Planned GPT updated to: 16/05/2026
• GSM & Color Lots Planned updated to: 27/05/2026

━━━━━━━━━━━━━━━━━━━━━━━
📊 ANALYSIS RULES
━━━━━━━━━━━━━━━━━━━━━━━

If user asks:

- pending styles
- delayed entries
- missing GPT
- missing FPT
- latest production updates
- pending approvals
- production summary

THEN intelligently analyze database records and provide a clean professional summary.

━━━━━━━━━━━━━━━━━━━━━━━
📋 RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━━━━

Always:

- Use markdown formatting
- Use bullet points
- Use clean spacing
- Keep replies beautiful and readable
- Use tables ONLY when needed
- Prefer short professional answers

━━━━━━━━━━━━━━━━━━━━━━━
📦 DATABASE RECORDS
━━━━━━━━━━━━━━━━━━━━━━━

${JSON.stringify(dbData)}

━━━━━━━━━━━━━━━━━━━━━━━
👤 USER QUESTION
━━━━━━━━━━━━━━━━━━━━━━━

${prompt}

━━━━━━━━━━━━━━━━━━━━━━━
🎯 FINAL TASK
━━━━━━━━━━━━━━━━━━━━━━━

Generate the most accurate, intelligent, professional, and concise response possible using ONLY PMA database records.
`;

        // ======================================================
        // 🤖 GENERATE AI RESPONSE (WITH HISTORY)
        // ======================================================

        // Purani history ko Gemini ke role format mein map kiya
        const geminiContents = history
            .filter(msg => !msg.text.includes('Welcome to PMA Smart System'))
            .map(msg => ({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));

        // Latest prompt (with system prompt & DB) ko history ke end me add kiya
        geminiContents.push({
            role: "user",
            parts: [{ text: systemPrompt }]
        });

        const result = await model.generateContent({
            contents: geminiContents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048 // ⚠️ Isko badhaya hai taaki message kate na
            }
        });

        const response = result.response;

        const text = response.text();

        // ======================================================
        // ✅ SEND RESPONSE
        // ======================================================

        return res.status(200).json({
            answer: text
        });

    } catch (error) {

        console.log("🚨 AI ERROR:");
        console.log(error);

        return res.status(500).json({
            error: error.message || "AI Failed"
        });
    }
});

module.exports = router;