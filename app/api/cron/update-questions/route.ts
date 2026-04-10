// app/api/cron/update-questions/route.ts
// This API endpoint should be called by a cron job service (Vercel Cron, EasyCron, etc.)
// Schedule: Every 7 days at 00:00 UTC

import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updateLog = [];

    // For each level, you can implement different logic
    // Option 1: Rotate old questions out, add new ones
    // Option 2: Mark old questions as archived
    // Option 3: Update difficulty based on statistics

    // Example: Log the update
    for (let level = 1; level <= 3; level++) {
      const { data: questions, error } = await supabase
        .from("questions")
        .select("id")
        .eq("level", level);

      if (!error && questions) {
        await supabase.from("question_update_log").insert([
          {
            level,
            questions_added: 0,
            questions_replaced: 0,
            updated_at: new Date(),
          },
        ]);

        updateLog.push({
          level,
          totalQuestions: questions.length,
          status: "logged",
        });
      }
    }

    console.log("Questions update completed:", updateLog);

    return NextResponse.json(
      {
        success: true,
        message: "Questions update scheduled successfully",
        log: updateLog,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
