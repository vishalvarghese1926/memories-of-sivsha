import { NextRequest, NextResponse } from "next/server";
import { INITIAL_TRIVIA_QUESTIONS } from "@/lib/storyData";
import { createSignedSessionToken } from "@/lib/authSession";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mode A: Single Question Verification
    if (body.questionId && typeof body.answer === "string") {
      const q = INITIAL_TRIVIA_QUESTIONS.find((item) => item.id === body.questionId);
      if (!q) {
        return NextResponse.json(
          { success: false, error: "Question not found." },
          { status: 404 }
        );
      }

      const submittedNorm = body.answer.trim().toLowerCase();
      const isMatch = q.acceptedAnswers.some(
        (accepted) => accepted.trim().toLowerCase() === submittedNorm
      );

      if (!isMatch) {
        return NextResponse.json({
          success: false,
          correct: false,
          message: "That answer doesn't feel quite right. Try again.",
        });
      }

      return NextResponse.json({
        success: true,
        correct: true,
        questionId: q.id,
      });
    }

    // Mode B: Full Verification (batch of answers)
    const answers = body.answers as Record<string, string> | undefined;
    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid answers submitted." },
        { status: 400 }
      );
    }

    const failedQuestions: string[] = [];

    for (const q of INITIAL_TRIVIA_QUESTIONS) {
      const submittedRaw = answers[q.id] || "";
      const submittedNorm = submittedRaw.trim().toLowerCase();

      // Accept valid answers or previously verified indicator
      const isMatch =
        submittedNorm === "verified" ||
        q.acceptedAnswers.some(
          (accepted) => accepted.trim().toLowerCase() === submittedNorm
        );

      if (!isMatch) {
        failedQuestions.push(q.id);
      }
    }

    if (failedQuestions.length > 0) {
      return NextResponse.json({
        success: false,
        failedQuestions,
        message: "That answer doesn't feel quite right. Try again.",
      });
    }

    // All 3 trivia questions passed! Generate cryptographically signed HMAC token
    const signedToken = createSignedSessionToken("Sivani");

    const response = NextResponse.json({
      success: true,
      correct: true,
      isComplete: true,
      message: "Welcome home, Sivani.",
      token: signedToken,
    });

    const isSecure = process.env.NODE_ENV === "production" && !req.url.includes("localhost");

    // Set secure cookie
    response.cookies.set("sivsha_session", signedToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
