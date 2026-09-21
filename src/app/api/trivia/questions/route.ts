import { NextResponse } from "next/server";
import { INITIAL_TRIVIA_QUESTIONS } from "@/lib/storyData";

export async function GET() {
  // Strip acceptedAnswers before sending to browser
  const sanitized = INITIAL_TRIVIA_QUESTIONS.map((q) => ({
    id: q.id,
    question: q.question,
    hint: q.hint,
  }));

  return NextResponse.json({ questions: sanitized });
}
