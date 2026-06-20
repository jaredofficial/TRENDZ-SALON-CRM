import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // MSG91 configuration
  const getMsg91Auth = () => {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER;
    
    if (!authKey) console.error("MISSING: MSG91_AUTH_KEY");
    if (!integratedNumber) console.error("MISSING: MSG91_INTEGRATED_NUMBER");
    
    if (!authKey || !integratedNumber) throw new Error("MSG91 credentials missing in environment");
    
    return { authKey, integratedNumber };
  };

  // API: Health Check for Secrets
  app.get("/api/whatsapp/health", (req, res) => {
    const status = {
      MSG91_AUTH_KEY: !!process.env.MSG91_AUTH_KEY,
      MSG91_INTEGRATED_NUMBER: !!process.env.MSG91_INTEGRATED_NUMBER,
      SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
    };
    res.json(status);
  });

  // API: Send WhatsApp Message (via MSG91)
  app.post("/api/whatsapp/send", async (req, res) => {
    const { to, message, templateId, clientId, variables } = req.body;
    
    try {
      const { authKey, integratedNumber } = getMsg91Auth();
      console.log(`Attempting to send WhatsApp via MSG91 to ${to} from ${integratedNumber}`);

      if (!to || (!message && !templateId)) {
        return res.status(400).json({ error: "Missing required fields (to, and either message or templateId)" });
      }

      // MSG91 WhatsApp API requires specific payload
      const payload: any = {
        integrated_number: integratedNumber,
        content_type: templateId ? "template" : "text",
        payload: {
          to: to.replace(/\D/g, ''), // Ensure numeric only
        }
      };

      if (templateId) {
        payload.payload.type = "template";
        payload.payload.template = {
          name: templateId,
          language: { code: "en", policy: "deterministic" },
          components: [
            {
              type: "body",
              parameters: Object.keys(variables || {}).map(key => ({
                type: "text",
                text: variables[key]
              }))
            }
          ]
        };
      } else {
        payload.payload.type = "text";
        payload.payload.text = { body: message };
      }

      const response = await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": authKey
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log("MSG91 Response:", result);

      if (response.ok && !result.hasError) {
        res.json({ success: true, refId: result.message_id || result.msgId || 'msg91-success' });
      } else {
        res.status(500).json({ error: result.message || "MSG91 API error" });
      }
    } catch (error: any) {
      console.error("MSG91 API Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Automation Trigger (via MSG91)
  app.post("/api/automation/trigger", async (req, res) => {
    const { event, customer, template_id, variables } = req.body;
    console.log(`Automation Triggered: ${event} for ${customer?.name}`);

    const supportedEvents = [
      'visit_completed',
      'payment_received',
      'appointment_confirmed',
      'appointment_rescheduled',
      'appointment_reminder',
      'google_review_follow_up',
      'checkout_upsell'
    ];

    if (supportedEvents.includes(event)) {
      let delay = 3000; // default 3s delay

      if (event === 'google_review_follow_up') {
        delay = 24 * 60 * 60 * 1000; // 1 day
      } else if (event === 'checkout_upsell') {
        delay = 6 * 60 * 1000; // 6 minutes
      } else if (event === 'appointment_reminder') {
        const apptDateStr = req.body.appointmentDate;
        const apptTimeStr = req.body.appointmentTime;
        if (apptDateStr && apptTimeStr) {
          const timeMatch = apptTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const ampm = timeMatch[3].toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            const apptDateTime = new Date(apptDateStr);
            apptDateTime.setHours(hours, minutes, 0, 0);
            
            const now = new Date();
            // Reminder target is 24 hours before appointment
            const reminderTime = new Date(apptDateTime.getTime() - 24 * 60 * 60 * 1000);
            const diffMs = reminderTime.getTime() - now.getTime();
            
            // Fallback to 10 seconds if reminder time has passed or is very near
            delay = diffMs > 0 ? diffMs : 10000;
            console.log(`[REMINDER] Calculated delay: ${delay}ms for appointment at ${apptDateTime.toISOString()}`);
          }
        }
      }

      if (req.body.testMode) {
        delay = (event === 'google_review_follow_up' || event === 'checkout_upsell' || event === 'appointment_reminder') ? 5000 : 1000;
        console.log(`[TEST MODE] Overriding delay to ${delay}ms for event '${event}'`);
      }

      console.log(`Scheduling automation for event '${event}' with delay of ${delay}ms`);

      setTimeout(async () => {
        try {
          const { authKey, integratedNumber } = getMsg91Auth();
          const to = customer.phone.replace(/\D/g, ''); 
          
          // Use template_id from body or fallback to env
          const finalTemplateId = template_id || process.env.MSG91_TEMPLATE_ID;

          if (!finalTemplateId) {
            throw new Error("No Template ID provided for automation");
          }

          const components: any = {};
          if (finalTemplateId === 'appointment_confirmed_wa_text_v1') {
            components.body_1 = { type: "text", value: customer?.name || "Client" };
            components.body_2 = { type: "text", value: variables?.[0] || "" };
            components.body_3 = { type: "text", value: variables?.[1] || "" };
            components.body_4 = { type: "text", value: variables?.[2] || "" };
          } else if (finalTemplateId === 'pos_checkout_confirmation') {
            components.body_1 = { type: "text", value: customer?.name || "Client" };
            components.body_2 = { type: "text", value: variables?.[0] || "" };
            components.body_3 = { type: "text", value: variables?.[1] || "" };
          } else if (finalTemplateId === 'appointment_reschedule_text') {
            components.body_1 = { type: "text", value: customer?.name || "Client" };
            components.body_2 = { type: "text", value: variables?.[0] || "" };
            components.body_3 = { type: "text", value: variables?.[1] || "" };
            components.body_4 = { type: "text", value: variables?.[2] || "" };
          } else if (finalTemplateId === 'google_review_follow_up_text') {
            components.body_1 = { type: "text", value: "Trendz Salon" };
            components.body_2 = { type: "text", value: variables?.[0] || "" };
          } else if (finalTemplateId === 'appointment_reminder_text') {
            components.body_1 = { type: "text", value: customer?.name || "Client" };
            components.body_2 = { type: "text", value: "Trendz Salon" };
            components.body_3 = { type: "text", value: variables?.[0] || "" };
            components.body_4 = { type: "text", value: variables?.[1] || "" };
          } else if (finalTemplateId === 'appointment_follow_up_upsell') {
            components.header_1 = { type: "text", value: customer?.name || "Client" };
            components.body_1 = { type: "text", value: variables?.[0] || "" };
            components.body_2 = { type: "text", value: variables?.[1] || "" };
          } else if (finalTemplateId === 'client_reengagement_text') {
            components.body_1 = { type: "text", value: customer?.name || "Client" };
            components.body_2 = { type: "text", value: "Trendz Salon" };
            components.body_3 = { type: "text", value: variables?.[0] || "30" };
            components.body_4 = { type: "text", value: variables?.[1] || "0" };
          } else {

            // Default fallback/reminder template structure
            components.body_1 = { type: "text", value: customer?.name || "Client" };
            components.body_2 = { type: "text", value: variables?.[0] || "Trendz Salon" };
            components.body_3 = { type: "text", value: variables?.[1] || new Date().toLocaleDateString() };
          }


          const payload = {
            integrated_number: integratedNumber,
            content_type: "template",
            payload: {
              messaging_product: "whatsapp",
              type: "template",
              template: {
                name: finalTemplateId,
                language: { 
                  code: "en",
                  policy: "deterministic" 
                },
                namespace: process.env.MSG91_NAMESPACE || "0c39b036_60ef_4a70_817d_744d7f2f92bf",
                to_and_components: [
                  {
                    to: [to],
                    components: components
                  }
                ]
              }
            }
          };

          console.log("[AUTOMATION] Payload to MSG91:", JSON.stringify(payload, null, 2));

          const response = await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              "authkey": authKey 
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();
          console.log(`[AUTOMATION] MSG91 Status for ${customer.name}:`, result);
        } catch (e: any) {
          console.error("Automation Execution Failed:", e.message);
        }
      }, delay);
    }

    res.json({ success: true, message: "Automation triggered" });
  });

  // API: Generate Gemini AI Performance Summary Report
  app.post("/api/ai/report", async (req, res) => {
    const { stats, transactions, clients, staff } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Sandbox fallback report
      const mockReport = `> [!NOTE]
> **Demo Sandbox Mode Active**: Add a valid \`GEMINI_API_KEY\` to your \`.env\` file to activate live real-time analysis from Gemini.

# Executive Performance Summary — Trendz Salon

## ## Overview & Insights
Currently operating in demonstration mode with mock statistics. Based on the loaded business records:
- **Total Revenue**: INR ${stats.monthly || 0} this month (Goal progress: ${Math.round(((stats.monthly || 0) / 500000) * 100)}% of INR 5.0L target).
- **Client Base**: **${clients?.length || 0}** registered profiles with a **${stats.retention || 0}%** client retention rate.
- **Average Ticket Value (ATV)**: INR **${stats.atv || 0}** per customer checkout.

## ## Staff Performance & Incentives
- **Team Size**: **${staff?.length || 0}** active contributors.
- **Incentive Allocation**: 5% incentive model splits earnings proportionally among service contributors, driving higher average order sizes and motivation.

## ## Strategic Recommendations
1. **Target Repeat Visits**: Push personalized loyalty point reminders to the **${clients?.length || 0}** registered clients to boost repeat visit frequency.
2. **Upsell High-Value Packages**: With an ATV of INR **${stats.atv || 0}**, run campaigns promoting Facials and Hair Coloring packages to increase service checkout value.
3. **Optimize Staff Load**: Review staff contributions to identify peak booking hours and adjust shift allocations.`;
      return res.json({ success: true, report: mockReport });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are the Executive Business Analyst AI for "Trendz Salon".
Analyze the following current salon performance data and provide a detailed, highly professional executive summary, business insights, staff performance highlights, and 3 strategic recommendations.

Salon Data:
- Daily Revenue: INR ${stats.daily}
- Weekly Revenue: INR ${stats.weekly}
- Monthly Revenue: INR ${stats.monthly}
- Yearly Revenue: INR ${stats.yearly}
- Retention Rate: ${stats.retention}%
- Average Ticket Value (ATV): INR ${stats.atv}
- Total Transactions: ${transactions?.length || 0}
- Total Registered Clients: ${clients?.length || 0}
- Total Staff Members: ${staff?.length || 0}

Format the report beautifully in Markdown. Use headers (## for main sections, ### for sub-sections), lists (- for bullet points), and bold text (**highlight**) for emphasis. Keep the tone inspiring, strategic, and professional. Do NOT include html tags or raw json.
`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ success: true, report: response.text });
    } catch (error: any) {
      console.error("Gemini AI API Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
