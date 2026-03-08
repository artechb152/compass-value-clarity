import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const LOVABLE_API_URL = "https://api.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { title, story, choice1Text, choice2Text, values, reflection } = await req.json();

    const prompt = `אתה מלווה חינוכי בתחום ערכי רוח צה"ל. קיבלת את התשובות של חייל לדילמה ערכית.

דילמה: ${title}
תרחיש: ${story}

החלטה ראשונה: ${choice1Text}
לאחר החמרה, החלטה שנייה: ${choice2Text}
ערכים שהתנגשו: ${values.join(" ו-")}
השיקול המרכזי: ${reflection}

כתוב מסקנה אישית קצרה (2-3 משפטים) בלשון זכר, שמשקפת לחייל מה אפשר ללמוד מהבחירות שלו. אל תשפוט, אל תגיד מה נכון ומה לא. פשוט שקף תובנה עמוקה ואנושית שיכולה לעזור לו להבין את עצמו טוב יותר. כתוב בעברית טבעית ואנושית.`;

    const response = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const conclusion = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ conclusion }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
