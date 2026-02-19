export type MediaType = "game" | "movie" | "tv" | "anime";

export type MediaStatus = "planned" | "focusing" | "completed" | "dropped";

export type LeaderboardTier = "S" | "A" | "B" | "C";

export type MediaItem = {
  id: string;
  title: string;
  type: MediaType;
  status: MediaStatus;
  notes?: string;
  lastTouched: string;
};
