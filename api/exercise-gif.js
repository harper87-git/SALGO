// ── SALGO exercise name → ExerciseDB search term mapping ──────────────
// ExerciseDB's /exercises/name/ endpoint does substring matching,
// so these just need to be close enough to hit a result.
// Keys are LOWERCASE. Looked up before any API call to avoid wasting quota.
const NAME_MAP = {
  // ── Body Beast / Dumbbell Chest ──
  "db chest press":               "dumbbell bench press",
  "chest press":                  "dumbbell bench press",
  "chest press w/ rotation":      "dumbbell bench press",
  "close grip press":             "close-grip bench press",
  "close grip press to fly":      "dumbbell bench press",
  "incline db press":             "incline dumbbell bench press",
  "incline press":                "incline dumbbell bench press",
  "incline db fly":               "dumbbell incline fly",
  "incline fly":                  "dumbbell incline fly",
  "partial chest fly":            "dumbbell fly",
  "db pull-over":                 "dumbbell pullover",
  "pull-over":                    "dumbbell pullover",
  "press":                        "dumbbell bench press",

  // ── Back ──
  "db row":                       "dumbbell bent over row",
  "one-arm row l":                "dumbbell one arm row",
  "one-arm row r":                "dumbbell one arm row",
  "bent over row":                "barbell bent over row",
  "bent-over row":                "barbell bent over row",
  "reverse bent-over row":        "reverse grip barbell row",
  "reverse grip row":             "reverse grip barbell row",
  "ez bar row":                   "barbell bent over row",
  "db scap trap":                 "dumbbell shrug",
  "db shrug":                     "dumbbell shrug",
  "pull-up":                      "pull up",
  "pull-ups":                     "pull up",
  "close-grip chin-up":           "chin up",
  "reverse fly":                  "dumbbell reverse fly",

  // ── Shoulders ──
  "military press":               "dumbbell shoulder press",
  "shoulder press":               "dumbbell shoulder press",
  "arnold press":                 "dumbbell arnold press",
  "delt raise":                   "dumbbell lateral raise",
  "lateral raise":                "dumbbell lateral raise",
  "alt front raise":              "dumbbell front raise",
  "post delt raise l":            "dumbbell rear lateral raise",
  "post delt raise r":            "dumbbell rear lateral raise",
  "rear delt raise":              "dumbbell rear lateral raise",
  "upright row":                  "dumbbell upright row",
  "1,1,2 front raise":           "dumbbell front raise",
  "1,1,2 military press":        "dumbbell shoulder press",
  "sagi six-way":                 "dumbbell lateral raise",

  // ── Biceps ──
  "bicep curl":                   "dumbbell bicep curl",
  "bicep curl up-hammer down":    "dumbbell curl",
  "standing curl":                "dumbbell curl",
  "seated bicep curl":            "dumbbell concentration curl",
  "hammer curl l":                "dumbbell hammer curl",
  "hammer curl r":                "dumbbell hammer curl",
  "1,1,2 hammer curl":           "dumbbell hammer curl",
  "all-angle bicep":              "dumbbell curl",
  "preacher curl":                "dumbbell preacher curl",
  "hanging curl":                 "dumbbell concentration curl",
  "neutral ez bar curl":          "ez barbell curl",
  "wide ez bar curl":             "ez barbell curl",

  // ── Triceps ──
  "tricep extension":             "dumbbell triceps extension",
  "tricep extension-kickback l":  "dumbbell triceps extension",
  "tricep extension-kickback r":  "dumbbell triceps extension",
  "tricep kickback":              "dumbbell kickback",
  "tricep kickback l":            "dumbbell kickback",
  "tricep kickback r":            "dumbbell kickback",
  "single arm kickback l":        "dumbbell kickback",
  "single arm kickback r":        "dumbbell kickback",
  "skull crusher":                "dumbbell lying triceps extension",
  "tricep push-up":               "diamond push up",
  "ez bar underhand press":       "close grip bench press",

  // ── Legs ──
  "parallel squat":               "barbell full squat",
  "ez squat":                     "bodyweight squat",
  "alt side squat":               "side squat",
  "full to ½ sumo squat":        "sumo squat",
  "sumo squat":                   "dumbbell sumo squat",
  "bulgarian squat l":            "bulgarian split squat",
  "bulgarian squat r":            "bulgarian split squat",
  "split squat l":                "split squat",
  "split squat r":                "split squat",
  "alternating lunge":            "dumbbell lunge",
  "reverse alternating lunge":    "dumbbell rear lunge",
  "reverse lunge":                "dumbbell rear lunge",
  "lunges":                       "dumbbell lunge",
  "front to back lunge l":        "dumbbell lunge",
  "front to back lunge r":        "dumbbell lunge",
  "step-up to rev lunge l":       "dumbbell step up",
  "step-up to rev lunge r":       "dumbbell step up",
  "calf raise":                   "dumbbell calf raise",
  "seated calf raise":            "seated calf raise",
  "single leg calf raise l":      "single leg calf raise",
  "single leg calf raise r":      "single leg calf raise",
  "stiff leg deadlift":           "dumbbell stiff leg deadlift",
  "straight leg deadlift l":      "dumbbell stiff leg deadlift",
  "straight leg deadlift r":      "dumbbell stiff leg deadlift",
  "speed box squat":              "barbell squat",
  "speed bench":                  "barbell bench press",

  // ── Core ──
  "bicycle crunch":               "bicycle crunch",
  "crunch":                       "crunch",
  "weighted crunch":              "weighted crunch",
  "ez bar crunch":                "weighted crunch",
  "cricket crunch":               "crunch",
  "figure 4 crunch":              "crunch",
  "russian twist":                "russian twist",
  "plate twist":                  "russian twist",
  "lat oblique twist":            "oblique crunch",
  "lat oblique twist l":          "oblique crunch",
  "lat oblique twist r":          "oblique crunch",
  "plank rotation":               "plank",
  "plank twist-twist":            "plank",
  "tempo plank":                  "plank",
  "side forearm plank l":         "side plank",
  "side forearm plank r":         "side plank",
  "ins & outs":                   "leg raise",
  "wide plank in & out":          "plank",
  "tuck & roll":                  "lying leg raise",
  "hanging circle":               "hanging leg raise",
  "sit-ups":                      "sit up",
  "superman stretch":             "superman",

  // ── Full Body / Cardio ──
  "push-up":                      "push up",
  "push-ups":                     "push up",
  "decline push-ups":             "decline push up",
  "ez push-up":                   "push up",
  "dips on bench":                "bench dip",
  "jumping jacks":                "jumping jack",
  "speed mountain climber":       "mountain climber",
  "jump squats":                  "jump squat",

  // ── Skip (program names / not real exercises) ──
  "beast abs":                    null,
  "airplane cobra":               null,
  "cobra to airplane":            null,
};

export default async function handler(req, res) {
  const { name, id } = req.query;

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "RAPIDAPI_KEY env var not set" });
  }

  const headers = {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
  };

  // ── MODE 2: Proxy the actual GIF image ──────────────────────────────
  if (id) {
    try {
      const imgUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(id)}&resolution=180`;
      const upstream = await fetch(imgUrl, { headers });
      if (!upstream.ok) return res.status(upstream.status).end();

      res.setHeader("Content-Type", "image/gif");
      res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=86400");
      const buffer = Buffer.from(await upstream.arrayBuffer());
      return res.send(buffer);
    } catch {
      return res.status(500).end();
    }
  }

  // ── MODE 1: Search exercise by name ─────────────────────────────────
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name or id query param required" });
  }

  const lower = name.toLowerCase().trim();

  // Check the hardcoded map first (fast, no API call needed)
  if (lower in NAME_MAP) {
    if (NAME_MAP[lower] === null) {
      // Explicitly skipped exercise
      return res.json({ gifUrl: null });
    }
    // Use the mapped search term
    return searchAndRespond(NAME_MAP[lower], headers, res);
  }

  // Not in the map — apply normalization and try the API
  let cleaned = lower
    .replace(/\bdb\b/g, "dumbbell")
    .replace(/\bbb\b/g, "barbell")
    .replace(/\bohp\b/g, "overhead press")
    .replace(/\brdl\b/g, "romanian deadlift")
    .replace(/\bghr\b/g, "glute ham raise")
    .replace(/\balt\b/g, "alternating")
    .replace(/\brev\b/g, "reverse")
    .replace(/\s+[lr]$/i, "")
    .replace(/\s+w\/.*$/i, "")
    .replace(/\s+to\s+(?:fly|rev|reverse|front|back|lunge|press|curl|raise).*$/i, "")
    .replace(/^[\d,]+\s+/g, "")
    .replace(/\b(warmup|warm-up|warm up|amrap|emom|tempo|speed|heavy|max|pause|banded)\b/gi, "")
    .replace(/\bto 1rm\b/gi, "")
    .replace(/\b\d+\s*(rep|set|min|sec|minute|second)s?\b/gi, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const skipPatterns = ["rest", "cardio", "foam roll", "stretch", "warm-up", "warm up", "limber", "release"];
  if (!cleaned || cleaned.length < 3 || skipPatterns.some(p => cleaned.includes(p))) {
    return res.json({ gifUrl: null });
  }

  // Try full cleaned name, then progressively shorter
  const attempts = [cleaned];
  const words = cleaned.split(" ");
  if (words.length > 3) attempts.push(words.slice(0, 3).join(" "));
  if (words.length > 2) attempts.push(words.slice(0, 2).join(" "));

  for (const query of attempts) {
    const result = await searchAndRespond(query, headers, res, true);
    if (result) return;
  }

  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
  return res.json({ gifUrl: null });
}

async function searchAndRespond(query, headers, res, dryRun = false) {
  try {
    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(query)}?limit=1&offset=0`;
    const upstream = await fetch(url, { headers });
    if (!upstream.ok) {
      if (!dryRun) return res.json({ gifUrl: null });
      return null;
    }

    const data = await upstream.json();
    if (Array.isArray(data) && data.length > 0 && data[0].id) {
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
      res.json({ gifUrl: `/api/exercise-gif?id=${data[0].id}` });
      return true;
    }

    if (!dryRun) {
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
      return res.json({ gifUrl: null });
    }
    return null;
  } catch {
    if (!dryRun) return res.json({ gifUrl: null });
    return null;
  }
}
