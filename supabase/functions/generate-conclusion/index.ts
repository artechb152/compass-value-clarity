import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

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
    const { title, story, choice1Text, choice2Text, values, scaleValues, reflection, changedDirection } = await req.json();

    const directionText = changedDirection ? "שינה כיוון" : "נשאר באותו כיוון";
    const val1 = values[0];
    const val2 = values[1];
    const scale1 = scaleValues?.[val1] ?? 5;
    const scale2 = scaleValues?.[val2] ?? 5;

    const moreImpacted = scale1 < scale2 ? val1 : scale2 < scale1 ? val2 : null;

    const prompt = `אתה מלווה חינוכי בתחום ערכי רוח צה"ל. כתוב משוב מותאם אישית (3-4 שורות בלבד) לחייל שעבר דילמה ערכית.

דילמה: ${title}
תרחיש (תקציר): ${story}

בחירה ראשונה: ${choice1Text}
בחירה שנייה (אחרי החמרה): ${choice2Text}
המשתמש ${directionText} אחרי ההחמרה.

ערכים שהתנגשו: ${val1} ו-${val2}
סקלת פגיעה (1=כמעט לא נפגע, 10=נפגע מאוד): ${val1}: ${scale1}/10, ${val2}: ${scale2}/10
${moreImpacted ? `הערך שנפגע יותר לפי המשתמש: ${moreImpacted}` : "שני הערכים נפגעו באופן דומה"}

רפלקציה אישית של המשתמש: "${reflection}"

הנחיות כתיבה:
- כתוב בלשון זכר, יחיד, פנייה ישירה
- אל תשפוט, אל תכריע מי צודק
- אל תגיד "טעית" או "צדקת"
- כן תסביר מה הבחירה משקפת
- כן תאיר מה היה המחיר של ההחלטה
- כן תחבר בין ההחלטה לערכים שהתנגשו
- כן תשקף למשתמש איך הוא הפעיל שיקול דעת
- התייחס לשינוי/עקביות הכיוון אחרי ההחמרה
- התייחס לסקלות - איזה ערך נפגע יותר
- שלב התייחסות קצרה לרפלקציה
- טון: רשמי אבל אנושי, לא כבד, לא מטיפני
- אורך: בדיוק 3-4 שורות`;

    const response = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let conclusion = data.choices?.[0]?.message?.content || "";
    // Strip any thinking/reasoning markers from the response
    conclusion = conclusion.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

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
