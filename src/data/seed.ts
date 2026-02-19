import type { MediaItem } from "@/types/media";

export const seedMedia: MediaItem[] = [
  {
    id: "media-zelda",
    title: "The Legend of Zelda: Tears of the Kingdom",
    type: "game",
    status: "focusing",
    notes: "Finish side quests before final dungeon.",
    lastTouched: "2026-02-10",
  },
  {
    id: "media-dune",
    title: "Dune: Part Two",
    type: "movie",
    status: "completed",
    notes: "Rewatch with commentary track.",
    lastTouched: "2026-01-29",
  },
  {
    id: "media-arcane",
    title: "Arcane",
    type: "tv",
    status: "planned",
    notes: "Start season two premiere weekend.",
    lastTouched: "2026-02-01",
  },
  {
    id: "media-frieren",
    title: "Frieren: Beyond Journey's End",
    type: "anime",
    status: "planned",
    notes: "Queue for Friday evening watchlist.",
    lastTouched: "2026-02-05",
  },
  {
    id: "media-hades",
    title: "Hades II",
    type: "game",
    status: "planned",
    notes: "Hold until full release.",
    lastTouched: "2026-02-14",
  },
  {
    id: "media-severance",
    title: "Severance",
    type: "tv",
    status: "dropped",
    notes: "Revisit if pacing picks up.",
    lastTouched: "2026-01-20",
  },
];
