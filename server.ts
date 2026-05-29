import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

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
        delay = 2 * 60 * 1000; // 2 minutes
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
            // Reminder target is 5 minutes before appointment
            const reminderTime = new Date(apptDateTime.getTime() - 5 * 60 * 1000);
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
            components.body_2 = { type: "text", value: "Vintage Paris" };
            components.body_3 = { type: "text", value: variables?.[0] || "" };
            components.body_4 = { type: "text", value: variables?.[1] || "" };
          } else if (finalTemplateId === 'appointment_follow_up_upsell') {
            components.header_1 = { type: "text", value: customer?.name || "Client" };
            components.body_1 = { type: "text", value: customer?.name || "Client" };
            components.body_2 = { type: "text", value: variables?.[0] || "" };
          } else {
            // Default fallback/reminder template structure
            components.body_1 = { type: "text", value: customer?.name || "Client" };
            components.body_2 = { type: "text", value: variables?.[0] || "Aion Salon" };
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
