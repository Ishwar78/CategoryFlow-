// OCR for bill images/PDFs using Lovable AI Gemini vision.
import { z } from "zod";

const Input = z.object({
  data_url: z.string().min(20), // data:image/...;base64,XXX  or data:application/pdf;base64,...
});

type OcrResult = {
  item_name?: string;
  vendor?: string;
  price?: number;
  quantity?: number;
  purchase_date?: string; // YYYY-MM-DD
  payment_method?: string;
  description?: string;
};

export const ocrBill = async ({ data }: { data: { data_url: string } }): Promise<{ ok: true; fields: OcrResult } | { ok: false; error: string }> => {
  const input = Input.safeParse(data);
  if (!input.success) return { ok: false, error: "Invalid input" };

  const key = import.meta.env.VITE_LOVABLE_API_KEY;
  if (!key) return { ok: false, error: "VITE_LOVABLE_API_KEY not configured" };

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You extract expense bill data. Reply with ONLY a JSON object matching the schema. Use null for unknown fields. Date format: YYYY-MM-DD.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract: item_name (short product/service name), vendor (shop/business name), price (final amount as number, no currency), quantity (number, default 1), purchase_date (YYYY-MM-DD), payment_method (one of: cash, upi, card, bank), description (short notes)." },
              { type: "image_url", image_url: { url: data.data_url } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `OCR failed (${res.status}): ${text.slice(0, 200)}` };
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const fields: OcrResult = {
      item_name: parsed.item_name || undefined,
      vendor: parsed.vendor || undefined,
      price: typeof parsed.price === "number" ? parsed.price : (parsed.price ? Number(parsed.price) : undefined),
      quantity: typeof parsed.quantity === "number" ? parsed.quantity : (parsed.quantity ? Number(parsed.quantity) : undefined),
      purchase_date: parsed.purchase_date || undefined,
      payment_method: parsed.payment_method || undefined,
      description: parsed.description || undefined,
    };
    return { ok: true, fields };
  } catch (e: any) {
    return { ok: false, error: e?.message || "OCR error" };
  }
};
