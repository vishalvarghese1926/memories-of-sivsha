"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, KeyRound, Heart, ChevronRight, HelpCircle, AlertCircle, CheckCircle2, LockOpen } from "lucide-react";
import { useStory } from "@/context/StoryContext";
import CinematicUnlockOverlay from "@/components/ui/CinematicUnlockOverlay";

type GatewayStage = "entry" | "trivia" | "ready-to-unlock";

interface SanitizedQuestion {
  id: string;
  question: string;
  hint?: string;
}

export default function EntryPage() {
  const router = useRouter();
  const { isUnlocked, setIsUnlocked, unlockState, setUnlockState, beginUnlock } = useStory();

  const [stage, setStage] = useState<GatewayStage>("entry");

  // Stage 1: Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [entryError, setEntryError] = useState<string | null>(null);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  // Stage 2: Trivia state
  const [questions, setQuestions] = useState<SanitizedQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [triviaError, setTriviaError] = useState<string | null>(null);
  const [isCheckingTrivia, setIsCheckingTrivia] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // If already unlocked from a previous session, advance to ready
  useEffect(() => {
    if (isUnlocked) {
      setStage("ready-to-unlock");
    }
  }, [isUnlocked]);

  // Pre-fetch sanitized trivia questions on mount to eliminate transition latency
  useEffect(() => {
    fetch("/api/trivia/questions")
      .then((res) => res.json())
      .then((data) => {
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      })
      .catch(() => {});
  }, []);

  // Fallback check if questions failed on initial mount
  useEffect(() => {
    if (stage === "trivia" && questions.length === 0) {
      fetch("/api/trivia/questions")
        .then((res) => res.json())
        .then((data) => {
          if (data.questions && Array.isArray(data.questions)) {
            setQuestions(data.questions);
          }
        })
        .catch(() => {
          setTriviaError("Unable to load trivia questions. Please refresh the page.");
        });
    }
  }, [stage, questions.length]);

  // Track verified answers
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  // Stage 1 Form Submission
  const handleEntrySubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setEntryError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      setEntryError("Please enter your name to proceed.");
      return;
    }
    if (trimmedName.length < 2) {
      setEntryError("Name must be at least 2 characters long.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setEntryError("Please enter a valid email address.");
      return;
    }

    if (!trimmedPassword) {
      setEntryError("Please enter the master password.");
      return;
    }

    setIsSubmittingEntry(true);
    try {
      const res = await fetch("/api/auth/verify-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEntryError(data.error || "The master password doesn't match this private archive.");
        setIsSubmittingEntry(false);
        return;
      }

      // Transition to Stage 2
      setStage("trivia");
    } catch {
      setEntryError("Connection error. Please try again.");
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  // Stage 2 Trivia Answer Submission
  const handleTriviaSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setTriviaError(null);

    const trimmed = currentAnswer.trim();
    if (!trimmed) {
      setTriviaError("Please enter your answer.");
      return;
    }

    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    setIsCheckingTrivia(true);
    try {
      if (currentQIndex < questions.length - 1) {
        // Individual Question Verification
        const res = await fetch("/api/auth/verify-trivia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: currentQ.id,
            answer: trimmed,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success || !data.correct) {
          setTriviaError(data.message || "That answer doesn't feel quite right. Try again.");
          setIsCheckingTrivia(false);
          return;
        }

        setUserAnswers((prev) => ({ ...prev, [currentQ.id]: trimmed }));
        setCurrentQIndex((prev) => prev + 1);
        setCurrentAnswer("");
        setShowHint(false);
      } else {
        // Final Question: Verify complete answers set and establish signed session cookie in ONE reliable trip
        const completeBatch = { ...userAnswers, [currentQ.id]: trimmed };
        const res = await fetch("/api/auth/verify-trivia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: completeBatch }),
        });

        const data = await res.json();
        if (!res.ok || !data.success || !data.correct) {
          setTriviaError(data.message || "That answer doesn't feel quite right. Try again.");
          setIsCheckingTrivia(false);
          return;
        }

        // Purge client-side router cache so Next.js server components recognize the fresh cookie
        router.refresh();
        setIsUnlocked(true);
        setStage("ready-to-unlock");
      }
    } catch {
      setTriviaError("Verification failed. Please try again.");
    } finally {
      setIsCheckingTrivia(false);
    }
  };

  // Stage 3 User Gesture Hook (Gateway for Phase 3 cinematic unlock)
  const handleUnlockClick = () => {
    beginUnlock();
  };

  const handleUnlockComplete = useCallback(() => {
    setUnlockState("unlocked");
    setIsUnlocked(true);
  }, [setIsUnlocked, setUnlockState]);

  const handleEnterStory = useCallback(() => {
    // Authoritative full-page navigation guarantees the httpOnly cookie is sent
    // directly to the server, completely bypassing any stale client-side router cache
    if (typeof window !== "undefined") {
      window.location.href = "/story";
    } else {
      router.push("/story");
    }
  }, [router]);

  return (
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#07050d] text-[#fcfbf7]">
      {/* Cinematic Ambient Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Soft Ambient Radial Lights (Deep Wine & Warm Graphite Harmony) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-[#831843]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[480px] h-[480px] bg-[#2e1065]/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-[#1c1926]/40 rounded-full blur-[120px]" />

        {/* Ambient Subtle Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      {/* Main Glass Card Container */}
      <div className="relative z-10 w-full max-w-lg my-auto pt-safe pb-safe">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-[#e2c275]/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] hover:border-[#e2c275]/35 transition-all duration-500 bg-[#0c0914]/80 backdrop-blur-xl">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs tracking-widest uppercase text-[#e2c275] mb-3.5 font-medium border border-[#e2c275]/30 bg-[#e2c275]/5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#e2c275]" />
              <span>PRIVATE ARCHIVE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif tracking-wide text-[#fcfbf7] font-bold mb-2">
              MEMORIES OF SIVSHA
            </h1>

            <p className="text-sm text-[#a8a29e] font-light">
              Some stories are meant to be discovered.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* STAGE 1: PRIVATE ENTRY FORM                                               */}
          {/* ========================================================================= */}
          {stage === "entry" && (
            <form onSubmit={handleEntrySubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="recipient-name"
                  className="block text-xs font-medium uppercase tracking-wider text-[#d6d3d1] mb-1.5"
                >
                  Your Name
                </label>
                <input
                  id="recipient-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#e2c275] focus:ring-1 focus:ring-[#e2c275]/40 transition-all duration-200"
                />
              </div>

              <div>
                <label
                  htmlFor="recipient-email"
                  className="block text-xs font-medium uppercase tracking-wider text-[#d6d3d1] mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="recipient-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#e2c275] focus:ring-1 focus:ring-[#e2c275]/40 transition-all duration-200"
                />
              </div>

              <div>
                <label
                  htmlFor="master-password"
                  className="block text-xs font-medium uppercase tracking-wider text-[#d6d3d1] mb-1.5"
                >
                  Master Password
                </label>
                <div className="relative">
                  <input
                    id="master-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter private archive password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 text-base rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#e2c275] focus:ring-1 focus:ring-[#e2c275]/40 transition-all duration-200 pr-10"
                  />
                  <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              {/* Error Message with aria-live */}
              {entryError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-center gap-2 p-3 rounded-xl bg-[#4c0519]/60 border border-[#831843] text-[#fecdd3] text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 text-[#fb7185] flex-shrink-0" />
                  <span>{entryError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingEntry}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#831843] hover:from-[#701a3c] hover:to-[#701a3c] text-white font-medium text-sm tracking-wide shadow-[0_4px_20px_rgba(131,24,67,0.35)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
              >
                {isSubmittingEntry ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Our World</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STAGE 2: TRIVIA QUESTIONS                                                 */}
          {/* ========================================================================= */}
          {stage === "trivia" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-medium tracking-widest uppercase text-[#e2c275] font-mono">
                  ONE MORE THING...
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#d6d3d1]">
                  {String(currentQIndex + 1).padStart(2, "0")} /{" "}
                  {String(questions.length || 3).padStart(2, "0")}
                </span>
              </div>

              {questions.length > 0 && questions[currentQIndex] ? (
                <form onSubmit={handleTriviaSubmit} className="space-y-5" noValidate>
                  {/* Question Prompt */}
                  <div className="space-y-2">
                    <p className="text-base sm:text-lg font-serif text-[#fcfbf7] leading-relaxed">
                      {questions[currentQIndex].question}
                    </p>

                    {/* Hint Toggle */}
                    {questions[currentQIndex].hint && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowHint(!showHint)}
                          className="text-xs inline-flex items-center gap-1.5 text-neutral-400 hover:text-[#e2c275] transition-colors cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{showHint ? "Hide hint" : "Need a memory hint?"}</span>
                        </button>
                        {showHint && (
                          <p className="mt-2 text-xs italic p-3 rounded-lg bg-white/5 border border-white/10 text-neutral-300">
                            {questions[currentQIndex].hint}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Answer Input */}
                  <div>
                    <label htmlFor="trivia-answer" className="sr-only">
                      Your Answer
                    </label>
                    <input
                      id="trivia-answer"
                      name="answer"
                      type="text"
                      required
                      placeholder="Type your answer..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      autoFocus
                      className="w-full px-4 py-3 text-base rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#e2c275] focus:ring-1 focus:ring-[#e2c275]/40 transition-all duration-200"
                    />
                  </div>

                  {/* Error Feedback */}
                  {triviaError && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="flex items-center gap-2 p-3 rounded-xl bg-[#4c0519]/60 border border-[#831843] text-[#fecdd3] text-xs font-medium"
                    >
                      <AlertCircle className="w-4 h-4 text-[#fb7185] flex-shrink-0" />
                      <span>{triviaError}</span>
                    </div>
                  )}

                  {/* Continue Button */}
                  <button
                    type="submit"
                    disabled={isCheckingTrivia}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#831843] hover:from-[#701a3c] hover:to-[#701a3c] text-white font-medium text-sm tracking-wide shadow-[0_4px_20px_rgba(131,24,67,0.35)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
                  >
                    {isCheckingTrivia ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{currentQIndex === questions.length - 1 ? "Verify & Proceed" : "Next Memory"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center text-sm text-neutral-400 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#e2c275]/40 border-t-[#e2c275] rounded-full animate-spin" />
                  <span>Loading memories...</span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 3: READY TO UNLOCK ("UNLOCK OUR STORY")                              */}
          {/* ========================================================================= */}
          {stage === "ready-to-unlock" && (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#831843]/20 border border-[#831843]/50 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(131,24,67,0.3)]">
                {unlockState === "unlocked" ? (
                  <LockOpen className="w-8 h-8 text-[#fbcfe8]" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-[#e2c275]" />
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-serif text-[#fcfbf7] font-bold">
                  {unlockState === "unlocked" ? "OUR ARCHIVE IS OPEN" : "OUR STORY AWAITS"}
                </h2>
                <p className="text-sm text-[#d6d3d1] font-light max-w-sm mx-auto leading-relaxed">
                  {unlockState === "unlocked"
                    ? "Welcome home, Sivani. Every chapter of our memory world has been unlocked."
                    : "Welcome, Sivani. Every step of our journey is ready for you."}
                </p>
              </div>

              <div className="pt-2">
                {unlockState === "unlocked" ? (
                  <button
                    type="button"
                    onClick={handleEnterStory}
                    className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#831843] hover:from-[#701a3c] hover:to-[#701a3c] text-white font-medium tracking-widest uppercase text-sm shadow-[0_4px_25px_rgba(131,24,67,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 min-h-[52px] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#e2c275]" />
                    <span>ENTER THE STORY</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUnlockClick}
                    disabled={unlockState === "unlocking"}
                    className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#831843] hover:from-[#701a3c] hover:to-[#701a3c] text-white font-medium tracking-widest uppercase text-sm shadow-[0_4px_25px_rgba(131,24,67,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 min-h-[52px] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {unlockState === "unlocking" ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>OPENING OUR WORLD...</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 fill-white" />
                        <span>UNLOCK OUR STORY</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-neutral-500/70 mt-6 tracking-wider">
          A PRIVATE GIFT &bull; DESIGNED FOR SIVANI
        </p>
      </div>

      {/* Cinematic Unlock Transition Overlay */}
      <CinematicUnlockOverlay
        isActive={unlockState === "unlocking"}
        onComplete={handleUnlockComplete}
      />
    </main>
  );
}
