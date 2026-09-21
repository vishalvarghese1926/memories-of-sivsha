import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const expectedPassword = process.env.PRIVATE_MASTER_PASSWORD;
    if (!expectedPassword) {
      // Fail closed if server master password is not configured
      return NextResponse.json(
        { success: false, error: "Authentication service is currently unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    // 1. Validate Name
    const trimmedName = (name || "").trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
      return NextResponse.json(
        { success: false, error: "Please enter your name to proceed." },
        { status: 400 }
      );
    }

    // 2. Validate Email
    const trimmedEmail = (email || "").trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 3. Validate Master Password using timing-safe comparison
    const trimmedPassword = (password || "").trim();
    if (!trimmedPassword) {
      return NextResponse.json(
        { success: false, error: "Please enter the master password." },
        { status: 400 }
      );
    }

    const userBuffer = Buffer.from(trimmedPassword);
    const expectedBuffer = Buffer.from(expectedPassword.trim());

    const isMatch =
      userBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(userBuffer, expectedBuffer);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "The master password doesn't match this private archive." },
        { status: 401 }
      );
    }

    // Entry credentials verified successfully
    return NextResponse.json({
      success: true,
      message: "Access granted. Please answer the memories verification.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
