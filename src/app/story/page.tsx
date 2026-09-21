import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { verifySessionToken } from "@/lib/authSession";

const StoryEngineClient = dynamic(
  () => import("@/components/story/StoryEngineClient"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 w-full h-[100dvh] bg-[#07050d] flex flex-col items-center justify-center gap-4 text-rose-200">
        <div className="w-8 h-8 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-rose-300/80 font-mono">
          Preparing Our Memories...
        </p>
      </div>
    ),
  }
);

export const metadata = {
  title: "Memories of Sivsha — Our Story",
  description: "A private cinematic relationship story for Sivani.",
};

export default function StoryPage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("sivsha_session");

  if (!sessionCookie?.value) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[StoryPage Auth] 'sivsha_session' cookie not found in cookie store. Redirecting to /");
    }
    redirect("/");
  }

  const { valid } = verifySessionToken(sessionCookie.value);
  if (!valid) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[StoryPage Auth] 'sivsha_session' token failed verification. Redirecting to /");
    }
    redirect("/");
  }

  return <StoryEngineClient />;
}
