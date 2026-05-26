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

    if (event === 'visit_completed' || event === 'payment_received' || event === 'appointment_confirmed') {
      const delay = 3000; // 3 second delay
      
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
            components.body_2 = { type: "text", value: variables?.[0] || "Aion Salon" };
            components.body_3 = { type: "text", value: variables?.[1] || "500" };
            components.body_4 = { type: "text", value: variables?.[2] || new Date().toLocaleDateString() };
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
