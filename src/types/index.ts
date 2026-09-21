export type SceneType =
  | "act-0-entry"
  | "act-1-before"
  | "act-2-college"
  | "act-2-college-pen"
  | "act-2-tribly-class"
  | "act-2-same-class"
  | "act-3-train"
  | "act-3-beach"
  | "act-3-late-talks"
  | "act-3-car-memory"
  | "act-3-august-31"
  | "act-3-october-31"
  | "act-3-classic-350"
  | "act-3-himalayan-450"
  | "act-3-mountain-fall"
  | "act-3-life-together"
  | "act-4-finale";

export interface MediaAsset {
  id: string;
  milestoneId?: string;
  url: string;
  type: "image" | "video" | "audio";
  caption?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  date?: string;
  location?: string;
  isCover?: boolean;
}

export interface Milestone {
  id: string;
  sequence: number;
  sceneType: SceneType;
  title: string;
  subtitle?: string;
  captions: string[];
  date?: string;
  location?: string;
  media: MediaAsset[];
  audioNoteUrl?: string;
  custom3DConfig?: {
    splineProgressStart: number;
    splineProgressEnd: number;
    cameraPosition?: [number, number, number];
    cameraLookAt?: [number, number, number];
    cameraFov?: number;
    ambientColor?: string;
    fogDensity?: number;
    fogColor?: string;
    particleIntensity?: number;
  };
}

export interface TriviaQuestion {
  id: string;
  question: string;
  hint?: string;
  // Normalized comparison happens on server
  acceptedAnswers: string[];
}

export interface BirthdayLetter {
  id: string;
  recipientName: string;
  senderName: string;
  date: string;
  headline: string;
  paragraphs: string[];
  signature: string;
  audioNoteUrl?: string;
  waxSealColor?: string;
}

export interface StoryState {
  milestones: Milestone[];
  letter: BirthdayLetter;
  triviaQuestions: TriviaQuestion[];
  isUnlocked: boolean;
  activeActIndex: number;
  scrollProgress: number;
}
