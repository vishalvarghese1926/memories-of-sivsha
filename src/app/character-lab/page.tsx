import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { verifySessionToken } from "@/lib/authSession";

const CharacterLabClient = dynamic(
  () => import("@/components/character-lab/CharacterLabClient"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 w-full h-[100dvh] bg-[#0a0a12] flex flex-col items-center justify-center gap-4 text-rose-200">
        <div className="w-8 h-8 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-rose-300/80 font-mono">
          Loading Character Quality Lab...
        </p>
      </div>
    ),
  }
);

export const metadata = {
  title: "Memories of Sivsha — Character Quality Lab",
  description: "Technical validation environment for Hero 3D character models.",
};

export default function CharacterLabPage() {
  // In development, allow direct developer access.
  // In production, require strict HMAC sivsha_session authorization or return 404.
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("sivsha_session");

    if (!sessionCookie?.value) {
      redirect("/");
    }

    const { valid } = verifySessionToken(sessionCookie.value);
    if (!valid) {
      redirect("/");
    }
  }

  return <CharacterLabClient />;
}
