import { useState, useEffect, useRef } from "react";

// ─── RAPIDAPI KEY ─────────────────────────────────────────────────────────────
// Paste your RapidAPI key here before deploying to Vercel.
// Free key at rapidapi.com → search "ExerciseDB" → subscribe (500 req/day free).
// Each exercise fetches once then the service worker caches it — works offline after.
const RAPIDAPI_KEY = "3450e5e1d2msh393827151c8d865p199049jsne2d939e58fd4";

const injectFonts = () => {
  if (document.getElementById("sos-fonts")) return;
  const l = document.createElement("link");
  l.id = "sos-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap";
  document.head.appendChild(l);
};

const T = {
  bg:"#0A0A0F", su:"#111118", hi:"#181824", bo:"#222232", lo:"#1A1A28",
  ac:"#0EA86A", acd:"rgba(14,168,106,0.12)", acb:"rgba(14,168,106,0.25)",
  gr:"#2DD4A0", grd:"rgba(45,212,160,0.1)",
  yw:"#F5A623", rd:"#F06060", pu:"#9B7FE8", or:"#F97316",
  pk:"#F472B6", tl:"#00C896", lb:"#7EC8FF",
  tx:"#EEEDF6", mu:"#6A6880", di:"#2C2A42",
  fn:"Manrope,sans-serif", mo:"JetBrains Mono,monospace",
};

const r5 = n => Math.round(n / 5) * 5;
const wt = (pct, max) => Math.max(r5(pct * max), 45);
const fmt = s => String(Math.floor(s / 60)).padStart(2,"0") + ":" + String(s % 60).padStart(2,"0");
const todayStr = () => new Date().toDateString();
const mkSets = (n, reps, weight, isAmrap = false) =>
  Array.from({length: n}, () => ({ reps: String(reps), weight, isAmrap }));
const exo = (name, isMain, note, sets, ss = null) => ({ name, isMain, note, sets, ss });
const pyrSets = b => [
  { reps:"12", weight: wt(0.55,b), isAmrap:false },
  { reps:"10", weight: wt(0.65,b), isAmrap:false },
  { reps:"8",  weight: wt(0.72,b), isAmrap:false },
  { reps:"6",  weight: wt(0.80,b), isAmrap:false },
];

// ─── EXERCISE DATABASE ────────────────────────────────────────────────────────
// [muscles, restSec, tips, ytQuery]
const EDB = {
  "Squat":                 ["Quads/Glutes/Hams",  180, ["Brace before unrack","Break hip and knee together","Knees out over toes","Drive through whole foot"], "back squat form tutorial depth cues"],
  "Deadlift":              ["Hams/Glutes/Back",   180, ["Bar over mid-foot","Lat spread","Drive floor away","Hips and shoulders rise together"], "conventional deadlift form setup cues"],
  "Bench Press":           ["Chest/Triceps/Delts",150, ["Retract and depress scapula","Slight arch, feet planted","Touch lower chest","Drive up and slightly back"], "bench press form setup arch technique"],
  "Overhead Press":        ["Shoulders/Triceps",  150, ["Squeeze glutes, brace hard","Bar just below chin","Press strict vertical","Get head through at lockout"], "overhead press strict form technique"],
  "Barbell Row":           ["Lats/Rhomboids/Biceps",120,["Hinge to 45 degrees","Pull to lower abdomen","Drive elbows back","Control the descent"], "barbell row form back angle technique"],
  "Pull-ups":              ["Lats/Biceps/Core",   120, ["Start from dead hang","Depress shoulder blades first","Drive elbows to hips","Chin clears bar fully"], "pull up dead hang full rom technique"],
  "Push-ups":              ["Chest/Triceps/Shoulders",60,["Chest touches floor","Elbows 45 degrees","Body rigid","Squeeze chest at top"], "push up perfect form chest to floor"],
  "Dips":                  ["Chest/Triceps",       90, ["Lean forward for chest","Elbows slightly flared","Upper arm parallel at bottom","Drive to lockout"], "dip form chest vs triceps lean technique"],
  "Romanian DL":           ["Hams/Glutes",         90, ["Slight knee bend","Push hips straight back","Bar stays close to legs","Stop at hamstring stretch"], "romanian deadlift RDL form hip hinge"],
  "Incline DB Press":      ["Upper Chest/Delts",   90, ["30-45 degree bench","Pinch shoulder blades","Control the descent","Full lockout"], "incline dumbbell press form upper chest"],
  "Leg Press":             ["Quads/Glutes",         90, ["Feet shoulder-width mid-platform","90 degrees at bottom","Press through heels","Never fully lock out"], "leg press foot placement form depth"],
  "Leg Curl":              ["Hamstrings",           60, ["Pad above ankle bone","Curl all the way up","3-second descent","Full range every rep"], "leg curl hamstring machine form technique"],
  "Lateral Raise":         ["Lateral Delts",        60, ["Lead with elbow","Raise to shoulder height","Control descent slowly","No momentum"], "lateral raise side delt form no momentum"],
  "Face Pull":             ["Rear Delts/Rotators",  60, ["Cable at forehead height","Elbows high throughout","Externally rotate at end","Squeeze rear delts"], "face pull rear delt technique cable"],
  "Barbell Curl":          ["Biceps",               60, ["Elbows pinned to sides","Curl to shoulder height","Squeeze at top","3-second descent"], "barbell curl form elbow position strict"],
  "Tricep Pushdown":       ["Triceps",              60, ["Elbows locked at sides","Full complete lockout","Slow controlled up","Flex hard at bottom"], "tricep pushdown form cable lockout"],
  "Plank":                 ["Core/Glutes",          45, ["Forearms flat","Squeeze glutes and core","Neutral spine","Breathe steadily"], "plank form hollow body position"],
  "Hip Thrust":            ["Glutes/Hams",          75, ["Upper back on bench","Drive through heels","Full extension at top","Control the descent"], "hip thrust glute form bench setup"],
  "DB Row":                ["Lats/Rhomboids",       75, ["Full stretch at bottom","Drive elbow up","Squeeze lat at top","Do not rotate torso"], "dumbbell row form lat engagement"],
  "Jump Squats":           ["Quads/Glutes",         60, ["Load quarter squat first","Explode through full extension","Swing arms for power","Land softly"], "jump squat explosive power soft landing"],
  "Burpees":               ["Full Body",            60, ["Chest contacts ground","Jump feet back explosive","Full extension on jump","Arms overhead at top"], "burpee form chest to ground full extension"],
  "Mountain Climbers":     ["Core/Hip Flexors",     45, ["Hips level","Drive knees to chest","Straight arms over wrists","Breathe rhythmically"], "mountain climbers core hips level form"],
  "Sit-ups":               ["Core",                 45, ["Hands behind head lightly","Curl up one vertebra at a time","Touch elbows to knees","Control the descent"], "sit up proper form ab crunch"],
  "Lunges":                ["Quads/Glutes",         60, ["Step long for 90 degree knee","Front shin vertical","Drive off front heel","Keep torso upright"], "lunge walking form front shin vertical"],
  "Speed Bench":           ["Chest/Triceps/CNS",    45, ["Stable setup","Lower controlled","Press maximum bar speed","Full lockout every rep"], "speed bench press dynamic effort bar speed"],
  "Speed Box Squat":       ["Quads/Glutes/CNS",     60, ["Sit back not down","Pause without bouncing","Explode up max intent","Bar speed is the point"], "box squat form sit back technique"],
  "GHR":                   ["Hamstrings/Glutes",    75, ["Anchor ankles","Lower with full control","Curl back up with hamstrings","Never let lower back dominate"], "glute ham raise GHR form technique"],
  "Pendlay Row":           ["Lats/Upper Back",      90, ["Bar resets on floor","Explosive pull to lower chest","Upper back leads","Return to floor fully"], "pendlay row form explosive reset floor"],
  "Bulgarian Split Squat": ["Quads/Glutes",         90, ["Rear foot elevated","Front shin vertical","Lower until rear knee nearly touches","Drive through front heel"], "bulgarian split squat rear foot elevated form"],
};

const exInfo = name => {
  if (!name) return { m:"Multiple muscles", r:90, tips:["Maintain form","Control eccentric","Breathe out on exertion","Stay braced"], yt:"" };
  const key = Object.keys(EDB).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase() === name.toLowerCase().split(" ").slice(0,2).join(" ").toLowerCase()
  );
  if (!key) return { m:"Multiple muscles", r:90, tips:["Maintain form","Control eccentric","Breathe out on exertion","Stay braced"], yt:encodeURIComponent(name + " exercise form tutorial") };
  const [m, r, tips, ytRaw] = EDB[key];
  return { m, r, tips, yt: encodeURIComponent(ytRaw || name + " form tutorial") };
};

// ─── PROGRAM DATA ─────────────────────────────────────────────────────────────
const PROG = {
  ironblocks: {
    id:"ironblocks", name:"The Ron Harper", coach:"Block Hypertrophy Method",
    rating:4.8, reviews:5200, diff:"Intermediate", freq:"5-6x/week", dur:"13 wks",
    color:T.or, goal:"Muscle", equip:"Dumbbells", tags:["Hypertrophy","Muscle","Dumbbells","3-Phase"],
    desc:"3-phase muscle-building system. Build foundation, maximize mass, then combine both for elite results.",
    phil:"Block 1 (Weeks 1-3) uses pyramid singles, supersets and giant sets to build a muscle-growth foundation. Block 2 (Weeks 4-9) introduces force sets, progressive sets and combo sets to shock muscles with new stimuli. Block 3 (Weeks 10-13) merges both phases for maximum adaptation. All exercises use dumbbells — pick a weight you can just complete each set with.",
    lifts:[],
    struct:[{d:"Mon",l:"Chest & Tris"},{d:"Tue",l:"Legs"},{d:"Wed",l:"Back & Bis"},{d:"Thu",l:"Shoulders"},{d:"Fri",l:"Cardio/Abs"},{d:"Sat",l:"REST"},{d:"Sun",l:"Chest & Tris"}],
  },
  wendler531: {
    id:"wendler531", name:"Triple Wave Method", coach:"Classic Powerlifting Protocol",
    rating:4.9, reviews:12400, diff:"Intermediate", freq:"4x/week", dur:"12 wks",
    color:T.ac, goal:"Strength", equip:"Barbell", tags:["Powerlifting","Strength"],
    desc:"Four main barbell lifts, sub-maximal loading, and relentless monthly progress.",
    phil:"Train with a Training Max at 90% of your 1RM. Cycle through three working weeks then deload. The final set of every main lift is AMRAP. Add 5 lbs to pressing TMs and 10 lbs to lower body TMs each cycle.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"OHP"},{d:"Tue",l:"Deadlift"},{d:"Wed",l:"REST"},{d:"Thu",l:"Bench"},{d:"Fri",l:"Squat"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  startingStrength: {
    id:"startingStrength", name:"Linear Progression LP", coach:"Linear Progression Method",
    rating:4.8, reviews:8900, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.yw, goal:"Strength", equip:"Barbell", tags:["Beginner","Linear"],
    desc:"The definitive beginner barbell program. Add weight to every single session.",
    phil:"Exploits the beginner ability to recover in 24-48 hrs. Squat every session. Workout A: squat, bench, deadlift. Workout B: squat, OHP, deadlift. Add 5 lbs upper body, 10 lbs lower body.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Workout A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Workout B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Workout A"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  texasMethod: {
    id:"texasMethod", name:"Volume-Intensity Split", coach:"Volume-Intensity Method",
    rating:4.7, reviews:5200, diff:"Intermediate", freq:"3x/week", dur:"12 wks",
    color:T.rd, goal:"Strength", equip:"Barbell", tags:["Intermediate","Volume"],
    desc:"Volume Monday, Recovery Wednesday, Intensity Friday. Classic weekly periodization.",
    phil:"Monday is high-volume stimulus at 80%. Wednesday is light recovery. Friday is a new 5-rep max attempt. Bench and OHP alternate weekly.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Volume"},{d:"Tue",l:"REST"},{d:"Wed",l:"Recovery"},{d:"Thu",l:"REST"},{d:"Fri",l:"Intensity"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  arnoldSplit: {
    id:"arnoldSplit", name:"Golden Era 6-Day", coach:"Golden Era Methodology",
    rating:4.8, reviews:9100, diff:"Advanced", freq:"6x/week", dur:"12 wks",
    color:T.pu, goal:"Muscle", equip:"Full Gym", tags:["Hypertrophy","Bodybuilding"],
    desc:"Chest/Back, Shoulders/Arms, Legs twice a week. High volume bodybuilding split.",
    phil:"Three pairings — chest+back, shoulders+arms, legs — each trained twice weekly. The chest/back antagonist pairing allows supersets with incredible volume density. Advanced trainees only.",
    lifts:["bench","squat","ohp"],
    struct:[{d:"Mon",l:"Chest & Back"},{d:"Tue",l:"Shoulders & Arms"},{d:"Wed",l:"Legs"},{d:"Thu",l:"Chest & Back"},{d:"Fri",l:"Shoulders & Arms"},{d:"Sat",l:"Legs"},{d:"Sun",l:"REST"}],
  },
  juggernaut: {
    id:"juggernaut", name:"Wave Autoregulation", coach:"Auto-Regulation Method",
    rating:4.7, reviews:4800, diff:"Intermediate", freq:"4x/week", dur:"16 wks",
    color:T.gr, goal:"Strength", equip:"Barbell", tags:["Auto-Regulate","Powerlifting"],
    desc:"Four waves of 10s, 8s, 5s, and 3s. AMRAP sets auto-regulate your progress.",
    phil:"Four 4-week waves targeting different rep ranges. Each wave has accumulation, intensification, and realization phases. The realization AMRAP tells you where you stand.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Squat"},{d:"Tue",l:"Bench"},{d:"Wed",l:"REST"},{d:"Thu",l:"Deadlift"},{d:"Fri",l:"OHP"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  westside: {
    id:"westside", name:"Conjugate Method", coach:"Conjugate System",
    rating:4.6, reviews:3200, diff:"Advanced", freq:"4x/week", dur:"12 wks",
    color:T.or, goal:"Strength", equip:"Powerlifting Gym", tags:["Conjugate","Powerlifting"],
    desc:"Conjugate periodization. Max effort and dynamic effort trained simultaneously.",
    phil:"Train maximal strength AND explosive strength simultaneously. Max Effort days work to a 1-3RM on a rotating exercise. Dynamic Effort days use 50-60% loads moved as explosively as possible.",
    lifts:["squat","bench","deadlift"],
    struct:[{d:"Mon",l:"ME Lower"},{d:"Tue",l:"ME Upper"},{d:"Wed",l:"REST"},{d:"Thu",l:"DE Lower"},{d:"Fri",l:"DE Upper"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  fullbody: {
    id:"fullbody", name:"Full Body Compound", coach:"Classical Barbell Method",
    rating:4.6, reviews:5100, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.gr, goal:"Strength", equip:"Barbell", tags:["Full Body","Compound"],
    desc:"Hit every major muscle every session with a squat, press, hinge, and pull.",
    phil:"Training the whole body each session maximizes frequency per muscle group. Every workout includes a squat, horizontal press, hinge, and pull. Simple structure, brutally effective.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Full Body A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Full Body B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Full Body A"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  fivex5: {
    id:"fivex5", name:"5x5 Strength", coach:"Classic Strength Method",
    rating:4.8, reviews:9200, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.yw, goal:"Strength", equip:"Barbell", tags:["5x5","Strength","Beginner"],
    desc:"Five sets of five reps on foundational barbell lifts. Simple and proven.",
    phil:"Five sets of five sits at the sweet spot between strength and size. Two alternating workouts hit every lift twice weekly. When all 25 reps are complete, add weight.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Workout A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Workout B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Workout A"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  ppl: {
    id:"ppl", name:"Push Pull Legs", coach:"Classic Split Method",
    rating:4.7, reviews:7400, diff:"Intermediate", freq:"3x/week", dur:"12 wks",
    color:T.pu, goal:"Muscle", equip:"Full Gym", tags:["PPL","Hypertrophy","Split"],
    desc:"Chest and shoulders, back and biceps, legs. Each pattern trained with full focus.",
    phil:"Organizes training by movement pattern. Run it 3 days for once-weekly frequency or 6 days for twice-weekly. The 6-day version maximizes muscle growth for intermediate lifters.",
    lifts:["squat","bench","ohp"],
    struct:[{d:"Mon",l:"Push"},{d:"Tue",l:"Pull"},{d:"Wed",l:"Legs"},{d:"Thu",l:"REST"},{d:"Fri",l:"REST"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  upperlower: {
    id:"upperlower", name:"Upper Lower Split", coach:"Classic Split Method",
    rating:4.7, reviews:6100, diff:"Intermediate", freq:"4x/week", dur:"12 wks",
    color:T.ac, goal:"Strength", equip:"Barbell", tags:["Upper Lower","4-Day","Strength"],
    desc:"Alternate upper and lower body days with power and volume sessions each week.",
    phil:"Hits each muscle group twice weekly. Power days are heavy compound work. Volume days shift to moderate loads and more sets. Full recovery between sessions.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Upper Power"},{d:"Tue",l:"Lower Power"},{d:"Wed",l:"REST"},{d:"Thu",l:"Upper Volume"},{d:"Fri",l:"Lower Volume"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  linprog: {
    id:"linprog", name:"Linear Progression Strength", coach:"Progressive Overload Method",
    rating:4.5, reviews:4200, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.rd, goal:"Strength", equip:"Barbell", tags:["Linear","Strength","Beginner"],
    desc:"Add weight to every single session. The most direct path to strength.",
    phil:"Add 5 lbs to pressing lifts and 10 lbs to squat and deadlift after every successful session. When progress stalls consistently, you are ready for an intermediate program.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Session A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Session B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Session A"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  gvt: {
    id:"gvt", name:"German Volume Training", coach:"High Volume Method",
    rating:4.5, reviews:3800, diff:"Intermediate", freq:"4x/week", dur:"12 wks",
    color:T.or, goal:"Muscle", equip:"Barbell", tags:["GVT","Volume","Hypertrophy"],
    desc:"10 sets of 10 reps at 60%. Brutal volume that forces muscle growth.",
    phil:"Hammers a single movement with ten sets of ten at 60% of 1RM. Volume forces hypertrophic adaptation. Rest 90 seconds between sets. Add weight only when every set of ten is completed cleanly.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Chest & Back"},{d:"Tue",l:"Squat"},{d:"Wed",l:"REST"},{d:"Thu",l:"Shoulders & Arms"},{d:"Fri",l:"Deadlift"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  pyramid: {
    id:"pyramid", name:"Pyramid Strength & Size", coach:"Classic Pyramid Method",
    rating:4.4, reviews:3200, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.pk, goal:"Muscle", equip:"Barbell", tags:["Pyramid","Hypertrophy","Strength"],
    desc:"Start light at 12 reps, work up to heavy at 6 reps. Size and strength together.",
    phil:"Starts with higher reps at lighter loads and increases weight while decreasing reps. Builds in a natural warm-up, recruits all fiber types, and provides simultaneous hypertrophy and strength stimulus.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Lower"},{d:"Tue",l:"REST"},{d:"Wed",l:"Upper Push"},{d:"Thu",l:"REST"},{d:"Fri",l:"Upper Pull"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  circuit: {
    id:"circuit", name:"Circuit Conditioning", coach:"Functional Training Method",
    rating:4.3, reviews:2900, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.tl, goal:"Fat Loss", equip:"Full Gym", tags:["Circuit","Conditioning","Fat Loss"],
    desc:"Multiple exercises back-to-back with minimal rest. Burns fat, builds endurance.",
    phil:"Combines strength work with metabolic conditioning by minimizing rest. Keeps heart rate elevated while compound movements preserve muscle mass. Ideal for fat loss with limited time.",
    lifts:[],
    struct:[{d:"Mon",l:"Circuit A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Circuit B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Circuit C"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  hiit: {
    id:"hiit", name:"HIIT Conditioning", coach:"Interval Training Method",
    rating:4.4, reviews:4100, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.rd, goal:"Fat Loss", equip:"No Equipment", tags:["HIIT","Conditioning","Fat Loss"],
    desc:"20s max effort, 10s rest. Maximum calorie burn in minimum time.",
    phil:"Alternates near-maximal effort with brief recovery. Creates an afterburn effect where calories continue burning for hours post-session. Three sessions weekly is sufficient.",
    lifts:[],
    struct:[{d:"Mon",l:"Lower HIIT"},{d:"Tue",l:"REST"},{d:"Wed",l:"Upper HIIT"},{d:"Thu",l:"REST"},{d:"Fri",l:"Full Body HIIT"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  periodized: {
    id:"periodized", name:"Periodized Strength", coach:"Block Periodization Method",
    rating:4.6, reviews:3500, diff:"Intermediate", freq:"4x/week", dur:"12 wks",
    color:T.lb, goal:"Strength", equip:"Barbell", tags:["Periodization","Strength"],
    desc:"Hypertrophy, strength, and power phases rotating every 4 weeks.",
    phil:"Weeks 1-4 build muscle with moderate loads and higher reps. Weeks 5-8 convert that muscle to strength with heavier loads. Weeks 9-12 peak strength with heavy low-rep work.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Lower"},{d:"Tue",l:"Upper"},{d:"Wed",l:"REST"},{d:"Thu",l:"Lower B"},{d:"Fri",l:"Upper B"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  ironblocks: {
    id:"ironblocks", name:"The Ron Harper", coach:"Block Hypertrophy Method",
    rating:4.8, reviews:5200, diff:"Intermediate", freq:"5-6x/week", dur:"13 wks",
    color:T.or, goal:"Muscle", equip:"Dumbbells", tags:["Hypertrophy","Muscle","Dumbbells","3-Phase"],
    desc:"3-phase muscle-building system. Build foundation, maximize mass, then combine both for elite results.",
    phil:"Block 1 (Weeks 1-3) uses pyramid singles, supersets and giant sets to build a muscle-growth foundation. Block 2 (Weeks 4-9) introduces force sets, progressive sets and combo sets to shock muscles with new stimuli. Block 3 (Weeks 10-13) merges both phases for maximum adaptation. All exercises use dumbbells — pick a weight you can just complete each set with.",
    lifts:[],
    struct:[{d:"Mon",l:"Chest & Tris"},{d:"Tue",l:"Legs"},{d:"Wed",l:"Back & Bis"},{d:"Thu",l:"Shoulders"},{d:"Fri",l:"Cardio/Abs"},{d:"Sat",l:"REST"},{d:"Sun",l:"Chest & Tris"}],
  },
};

// ─── WORKOUT BUILDER ──────────────────────────────────────────────────────────
function buildWorkout(pid, mx, wk, dow, sc) {
  const sq = mx.squat || 225;
  const bp = mx.bench || 185;
  const dl = mx.deadlift || 315;
  const op = mx.ohp || 135;
  const pg = (b, lo) => Math.max(wt(0.60, b) + sc * (lo ? 10 : 5), 45);

  if (pid === "wendler531") {
    const dm = {1:"ohp", 2:"deadlift", 4:"bench", 5:"squat"};
    const nm = {ohp:"Overhead Press", deadlift:"Deadlift", bench:"Bench Press", squat:"Squat"};
    const lift = dm[dow]; if (!lift) return null;
    const cy = (wk - 1) % 4;
    const S = [
      [{p:0.65,r:"5"},{p:0.75,r:"5"},{p:0.85,r:"5+"}],
      [{p:0.70,r:"3"},{p:0.80,r:"3"},{p:0.90,r:"3+"}],
      [{p:0.75,r:"5"},{p:0.85,r:"3"},{p:0.95,r:"1+"}],
      [{p:0.40,r:"5"},{p:0.50,r:"5"},{p:0.60,r:"5"}],
    ];
    const WL = ["5s Week","3s Week","1s Week","Deload"];
    const WC = [T.ac, T.yw, T.pk, T.gr];
    const maxVal = {squat:sq, bench:bp, deadlift:dl, ohp:op}[lift];
    const tm = wt(0.9, maxVal);
    const wu = mkSets(3, "5", wt(0.50, tm));
    const main = S[cy].map(s => ({ reps: s.r, weight: wt(s.p, tm), isAmrap: s.r.includes("+") }));
    const acc = {
      ohp: [exo("Dips",false,"5x10",mkSets(5,10,0)), exo("DB Row",false,"5x10",mkSets(5,10,0))],
      deadlift: [exo("Romanian DL",false,"4x10",mkSets(4,10,wt(0.40,tm))), exo("Leg Curl",false,"3x12",mkSets(3,12,0))],
      bench: [exo("Incline DB Press",false,"4x10",mkSets(4,10,r5(bp*0.28))), exo("Tricep Pushdown",false,"3x15",mkSets(3,15,0))],
      squat: [exo("Leg Press",false,"5x10",mkSets(5,10,0)), exo("Leg Curl",false,"4x10",mkSets(4,10,0))],
    };
    return { name: nm[lift], tag: WL[cy], tagColor: WC[cy], weekLabel: "Week "+wk+" - "+WL[cy],
      exercises: [exo(nm[lift]+" Warm-up",false,"Work up",wu), exo(nm[lift],true,"TM: "+tm+" lbs",main), ...(cy===3 ? [] : acc[lift])] };
  }

  if (pid === "startingStrength" || pid === "fivex5") {
    if (![1,3,5].includes(dow)) return null;
    const isA = sc % 2 === 0;
    const n = pid === "fivex5" ? 5 : 3;
    const sqW = pg(sq, true), bpW = pg(bp, false), opW = pg(op, false), dlW = pg(dl, true);
    if (isA) return { name:"Workout A", tag:"A", tagColor:T.yw, weekLabel:"Week "+wk+" - Workout A",
      exercises: [exo("Squat",true,"Add 10 lbs next session",mkSets(n,5,sqW)), exo("Bench Press",true,"Add 5 lbs next session",mkSets(n,5,bpW)), exo("Deadlift",true,"Add 10 lbs next session",mkSets(1,5,dlW))] };
    return { name:"Workout B", tag:"B", tagColor:T.ac, weekLabel:"Week "+wk+" - Workout B",
      exercises: [exo("Squat",true,"Add 10 lbs next session",mkSets(n,5,sqW)), exo("Overhead Press",true,"Add 5 lbs next session",mkSets(n,5,opW)), exo("Deadlift",true,"Add 10 lbs next session",mkSets(1,5,dlW))] };
  }

  if (pid === "texasMethod") {
    if (![1,3,5].includes(dow)) return null;
    const t = {1:"V",3:"R",5:"I"}[dow];
    const useB = wk % 2 === 1;
    const pr = useB ? bp : op;
    const pn = useB ? "Bench Press" : "Overhead Press";
    const bonus = Math.floor((wk - 1) / 2) * 5;
    if (t === "V") return { name:"Volume Day", tag:"VOL", tagColor:T.ac, weekLabel:"Week "+wk+" - Volume",
      exercises: [exo("Squat",true,"5x5 @ "+wt(0.80,sq)+" lbs",mkSets(5,5,wt(0.80,sq))), exo(pn,true,"5x5 @ "+wt(0.80,pr)+" lbs",mkSets(5,5,wt(0.80,pr))), exo("Pendlay Row",false,"5x5",mkSets(5,5,wt(0.70,bp)))] };
    if (t === "R") return { name:"Recovery Day", tag:"REC", tagColor:T.gr, weekLabel:"Week "+wk+" - Recovery",
      exercises: [exo("Squat",true,"2x5 light",mkSets(2,5,wt(0.70,sq))), exo(pn,true,"3x5 light",mkSets(3,5,wt(0.70,pr))), exo("Pull-ups",false,"3xMax",mkSets(3,"Max",0))] };
    return { name:"Intensity Day", tag:"INT", tagColor:T.rd, weekLabel:"Week "+wk+" - Intensity",
      exercises: [exo("Squat",true,"New 5RM",mkSets(1,"5+",r5(wt(1.0,sq)+bonus),true)), exo(pn,true,"New 5RM",mkSets(1,"5+",r5(wt(1.0,pr)+bonus),true)), exo("Deadlift",false,"1x5",mkSets(1,5,wt(0.85,dl)))] };
  }

  if (pid === "arnoldSplit") {
    const fm = {1:"CB",2:"SA",3:"L",4:"CB",5:"SA",6:"L"}[dow]; if (!fm) return null;
    if (fm === "CB") return { name:"Chest & Back", tag:"C+B", tagColor:T.pu, weekLabel:"Week "+wk+" - Chest & Back",
      exercises: [
        exo("Bench Press",true,"Work up 5 sets",[{reps:"10",weight:wt(0.55,bp),isAmrap:false},{reps:"8",weight:wt(0.65,bp),isAmrap:false},{reps:"6",weight:wt(0.75,bp),isAmrap:false},{reps:"4",weight:wt(0.82,bp),isAmrap:false},{reps:"4",weight:wt(0.85,bp),isAmrap:false}], "A"),
        exo("Pull-ups",true,"4xMax — superset with Bench",mkSets(4,"Max",0), "A"),
        exo("Incline DB Press",false,"4x10 — superset with Rows",mkSets(4,10,r5(bp*0.28)), "B"),
        exo("Barbell Row",true,"4x10 — superset with Incline",mkSets(4,10,wt(0.50,bp)), "B"),
        exo("Dips",false,"3x failure",mkSets(3,"Fail",0)),
      ] };
    if (fm === "SA") return { name:"Shoulders & Arms", tag:"S+A", tagColor:T.pk, weekLabel:"Week "+wk+" - Shoulders & Arms",
      exercises: [exo("Overhead Press",true,"4x10",mkSets(4,10,wt(0.60,op))), exo("Lateral Raise",false,"4x12",mkSets(4,12,0)),
        exo("Barbell Curl",true,"4x10 — superset with Triceps",mkSets(4,10,0), "A"),
        exo("Tricep Pushdown",false,"4x12 — superset with Curls",mkSets(4,12,0), "A"),
        exo("Face Pull",false,"3x15",mkSets(3,15,0))] };
    return { name:"Legs", tag:"LEGS", tagColor:T.gr, weekLabel:"Week "+wk+" - Legs",
      exercises: [
        exo("Squat",true,"High reps",[{reps:"20",weight:wt(0.50,sq),isAmrap:false},{reps:"15",weight:wt(0.60,sq),isAmrap:false},{reps:"12",weight:wt(0.70,sq),isAmrap:false},{reps:"10",weight:wt(0.75,sq),isAmrap:false}]),
        exo("Leg Press",false,"4x12",mkSets(4,12,0)), exo("Leg Curl",false,"4x12",mkSets(4,12,0)), exo("Hip Thrust",false,"3x15",mkSets(3,15,0)),
      ] };
  }

  if (pid === "juggernaut") {
    const dm = {1:"squat",2:"bench",4:"deadlift",5:"ohp"};
    const nm = {squat:"Squat",bench:"Bench Press",deadlift:"Deadlift",ohp:"Overhead Press"};
    const lift = dm[dow]; if (!lift) return null;
    const maxVal = mx[lift] || 135;
    const wave = Math.min(Math.floor((wk - 1) / 4), 3);
    const wik = (wk - 1) % 4;
    const W = [
      {n:"10s", s:[[0.55,"10"],[0.60,"10"],[0.65,"10+"]]},
      {n:"8s",  s:[[0.60,"8"],[0.65,"8"],[0.70,"8+"]]},
      {n:"5s",  s:[[0.65,"5"],[0.70,"5"],[0.75,"5+"]]},
      {n:"3s",  s:[[0.70,"3"],[0.75,"3"],[0.80,"3+"]]},
    ];
    const PL = ["Acc I","Acc II","Intensification","Realization"];
    const PC = [T.gr, T.gr, T.yw, T.rd];
    const main = W[wave].s.map(([p, r]) => ({ reps: r, weight: wt(p, maxVal), isAmrap: r.includes("+") }));
    const acc = {
      squat:[exo("Leg Press",false,"3x12",mkSets(3,12,0))],
      bench:[exo("DB Row",false,"4x12",mkSets(4,12,0))],
      deadlift:[exo("Barbell Row",false,"3x8",mkSets(3,8,wt(0.50,maxVal)))],
      ohp:[exo("Lateral Raise",false,"4x15",mkSets(4,15,0))],
    };
    return { name: nm[lift], tag: PL[wik], tagColor: PC[wik], weekLabel: "Week "+wk+" - "+W[wave].n+" - "+PL[wik],
      exercises: [exo(nm[lift],true,W[wave].n+" Wave",main), ...(wik === 3 ? [] : acc[lift])] };
  }

  if (pid === "westside") {
    const tm = {1:"MEL",2:"MEU",4:"DEL",5:"DEU"}[dow]; if (!tm) return null;
    const MEL = ["Box Squat","Safety Bar GM","Sumo DL","Conventional DL","Front Squat"];
    const MEU = ["Floor Press","Board Press","Close-grip Bench","Incline Press"];
    const mi = Math.floor((wk - 1) / 3) % MEL.length;
    const bpP = [0.45,0.50,0.55][(wk-1)%3];
    const sqP = [0.50,0.55,0.60][(wk-1)%3];
    const ramp = max => [0.55,0.70,0.80,0.90,0.97,1.0].map(p => ({ reps: p >= 0.97 ? "1" : "3", weight: wt(p, max), isAmrap: false }));
    if (tm === "MEL") return { name:"ME Lower", tag:"ME", tagColor:"#D68FFF", weekLabel:"Week "+wk+" - ME Lower",
      exercises: [exo(MEL[mi]+" to 1RM",true,"Work to true max",ramp(sq)), exo("Romanian DL",false,"4x8",mkSets(4,8,wt(0.45,dl))), exo("GHR",false,"3x10",mkSets(3,10,0))] };
    if (tm === "MEU") return { name:"ME Upper", tag:"ME", tagColor:"#D68FFF", weekLabel:"Week "+wk+" - ME Upper",
      exercises: [exo(MEU[mi]+" to 1RM",true,"Work to true max",ramp(bp)), exo("Barbell Curl",false,"4x8",mkSets(4,8,0)), exo("DB Row",false,"5x12",mkSets(5,12,0))] };
    if (tm === "DEL") {
      const sqDE = wt(sqP, sq);
      return { name:"DE Lower", tag:"DE", tagColor:T.yw, weekLabel:"Week "+wk+" - DE Lower",
        exercises: [exo("Speed Box Squat",true,"10x2 @ "+sqDE,mkSets(10,2,sqDE)), exo("Deadlift",true,"6x1 speed",mkSets(6,1,wt(0.60,dl)))] };
    }
    const bpDE = wt(bpP, bp);
    return { name:"DE Upper", tag:"DE", tagColor:T.yw, weekLabel:"Week "+wk+" - DE Upper",
      exercises: [exo("Speed Bench",true,"9x3 @ "+bpDE,mkSets(9,3,bpDE)), exo("Tricep Pushdown",false,"5x20",mkSets(5,20,0)), exo("DB Row",false,"4x12",mkSets(4,12,0))] };
  }

  if (pid === "fullbody") {
    if (![1,3,5].includes(dow)) return null;
    if (sc % 2 === 0) return { name:"Full Body A", tag:"A", tagColor:T.gr, weekLabel:"Week "+wk+" - Full Body A",
      exercises: [exo("Squat",true,"3x5 progressive",mkSets(3,5,pg(sq,true))), exo("Bench Press",true,"3x5 progressive",mkSets(3,5,pg(bp,false))), exo("Deadlift",true,"1x5 all out",mkSets(1,5,pg(dl,true))), exo("Barbell Row",false,"3x8",mkSets(3,8,wt(0.60,bp)))] };
    return { name:"Full Body B", tag:"B", tagColor:T.ac, weekLabel:"Week "+wk+" - Full Body B",
      exercises: [exo("Squat",true,"3x5 progressive",mkSets(3,5,pg(sq,true))), exo("Overhead Press",true,"3x5 progressive",mkSets(3,5,pg(op,false))), exo("Deadlift",true,"1x5 all out",mkSets(1,5,pg(dl,true))), exo("Pull-ups",true,"3xMax",mkSets(3,"Max",0))] };
  }

  if (pid === "fivex5") {
    if (![1,3,5].includes(dow)) return null;
    if (sc % 2 === 0) return { name:"Workout A", tag:"A", tagColor:T.yw, weekLabel:"Week "+wk+" - 5x5 A",
      exercises: [exo("Squat",true,"5x5",mkSets(5,5,pg(sq,true))), exo("Bench Press",true,"5x5",mkSets(5,5,pg(bp,false))), exo("Barbell Row",true,"5x5",mkSets(5,5,pg(wt(0.80,bp),false)))] };
    return { name:"Workout B", tag:"B", tagColor:T.ac, weekLabel:"Week "+wk+" - 5x5 B",
      exercises: [exo("Squat",true,"5x5",mkSets(5,5,pg(sq,true))), exo("Overhead Press",true,"5x5",mkSets(5,5,pg(op,false))), exo("Deadlift",true,"1x5",mkSets(1,5,pg(dl,true)))] };
  }

  if (pid === "ppl") {
    if (![1,3,5].includes(dow)) return null;
    const t = sc % 3;
    if (t === 0) return { name:"Push Day", tag:"PUSH", tagColor:T.ac, weekLabel:"Week "+wk+" - Push",
      exercises: [exo("Bench Press",true,"4x8",mkSets(4,8,wt(0.72,bp))), exo("Overhead Press",true,"3x10",mkSets(3,10,wt(0.65,op))),
        exo("Incline DB Press",false,"3x12 — superset with Laterals",mkSets(3,12,r5(bp*0.30)), "A"),
        exo("Lateral Raise",false,"3x15 — superset with Incline",mkSets(3,15,0), "A"),
        exo("Tricep Pushdown",false,"3x15",mkSets(3,15,0))] };
    if (t === 1) return { name:"Pull Day", tag:"PULL", tagColor:T.pu, weekLabel:"Week "+wk+" - Pull",
      exercises: [exo("Pull-ups",true,"4xMax",mkSets(4,"Max",0)), exo("Barbell Row",true,"4x8",mkSets(4,8,wt(0.65,bp))),
        exo("DB Row",false,"3x10 — superset with Face Pulls",mkSets(3,10,r5(bp*0.25)), "A"),
        exo("Face Pull",false,"3x15 — superset with Rows",mkSets(3,15,0), "A"),
        exo("Barbell Curl",false,"3x12",mkSets(3,12,0))] };
    return { name:"Legs Day", tag:"LEGS", tagColor:T.gr, weekLabel:"Week "+wk+" - Legs",
      exercises: [exo("Squat",true,"4x8",mkSets(4,8,wt(0.72,sq))), exo("Romanian DL",true,"3x10",mkSets(3,10,wt(0.58,dl))), exo("Leg Press",false,"3x12",mkSets(3,12,0)), exo("Leg Curl",false,"3x12",mkSets(3,12,0)), exo("Hip Thrust",false,"3x15",mkSets(3,15,0))] };
  }

  if (pid === "upperlower") {
    if (![1,2,4,5].includes(dow)) return null;
    const t = sc % 4;
    if (t === 0) return { name:"Upper Power", tag:"UP", tagColor:T.ac, weekLabel:"Week "+wk+" - Upper Power",
      exercises: [exo("Bench Press",true,"4x5",mkSets(4,5,wt(0.80,bp))), exo("Barbell Row",true,"4x5",mkSets(4,5,wt(0.75,bp))), exo("Overhead Press",false,"3x6",mkSets(3,6,wt(0.78,op))), exo("Pull-ups",false,"3xMax",mkSets(3,"Max",0))] };
    if (t === 1) return { name:"Lower Power", tag:"LP", tagColor:T.yw, weekLabel:"Week "+wk+" - Lower Power",
      exercises: [exo("Squat",true,"4x5",mkSets(4,5,wt(0.80,sq))), exo("Deadlift",true,"3x4",mkSets(3,4,wt(0.82,dl))), exo("Romanian DL",false,"3x8",mkSets(3,8,wt(0.55,dl)))] };
    if (t === 2) return { name:"Upper Volume", tag:"UV", tagColor:T.pu, weekLabel:"Week "+wk+" - Upper Volume",
      exercises: [
        exo("Incline DB Press",true,"4x10 — superset with Rows",mkSets(4,10,r5(bp*0.28)), "A"),
        exo("DB Row",true,"4x10 — superset with Incline",mkSets(4,10,r5(bp*0.28)), "A"),
        exo("Lateral Raise",false,"4x15 — superset with Curls",mkSets(4,15,0), "B"),
        exo("Barbell Curl",false,"3x12 — superset with Laterals",mkSets(3,12,0), "B"),
        exo("Tricep Pushdown",false,"3x15",mkSets(3,15,0))] };
    return { name:"Lower Volume", tag:"LV", tagColor:T.gr, weekLabel:"Week "+wk+" - Lower Volume",
      exercises: [exo("Leg Press",true,"4x12",mkSets(4,12,0)), exo("Romanian DL",true,"3x10",mkSets(3,10,wt(0.58,dl))), exo("Leg Curl",false,"3x12",mkSets(3,12,0)), exo("Hip Thrust",false,"3x15",mkSets(3,15,0)), exo("Plank",false,"3x60s",mkSets(3,"60s",0))] };
  }

  if (pid === "linprog") {
    if (![1,3,5].includes(dow)) return null;
    if (sc % 2 === 0) return { name:"Session A", tag:"A", tagColor:T.rd, weekLabel:"Week "+wk+" - Session A",
      exercises: [exo("Squat",true,"3x5 add 10 lbs next",mkSets(3,5,pg(sq,true))), exo("Bench Press",true,"3x5 add 5 lbs next",mkSets(3,5,pg(bp,false))), exo("Deadlift",true,"1x5 add 10 lbs next",mkSets(1,5,pg(dl,true)))] };
    return { name:"Session B", tag:"B", tagColor:T.or, weekLabel:"Week "+wk+" - Session B",
      exercises: [exo("Squat",true,"3x5 add 10 lbs next",mkSets(3,5,pg(sq,true))), exo("Overhead Press",true,"3x5 add 5 lbs next",mkSets(3,5,pg(op,false))), exo("Barbell Row",true,"3x5 add 5 lbs next",mkSets(3,5,pg(wt(0.85,bp),false)))] };
  }

  if (pid === "gvt") {
    if (![1,2,4,5].includes(dow)) return null;
    const t = sc % 4;
    if (t === 0) return { name:"Chest & Back", tag:"10x10", tagColor:T.or, weekLabel:"Week "+wk+" - Chest & Back (GVT)",
      exercises: [
        exo("Bench Press",true,"10x10 @ 60% — superset with Rows",mkSets(10,10,wt(0.60,bp)), "A"),
        exo("Barbell Row",true,"10x10 @ 60% — superset with Bench",mkSets(10,10,wt(0.60,bp)), "A"),
        exo("Incline DB Press",false,"3x12 — superset with Curls",mkSets(3,12,r5(bp*0.28)), "B"),
        exo("Barbell Curl",false,"3x12 — superset with Incline",mkSets(3,12,0), "B"),
      ] };
    if (t === 1) return { name:"Squat Day", tag:"10x10", tagColor:T.gr, weekLabel:"Week "+wk+" - Squat (GVT)",
      exercises: [exo("Squat",true,"10x10 @ 60% / 90s rest",mkSets(10,10,wt(0.60,sq))), exo("Leg Curl",false,"3x12",mkSets(3,12,0)), exo("Romanian DL",false,"3x10",mkSets(3,10,wt(0.50,dl)))] };
    if (t === 2) return { name:"Shoulders & Arms", tag:"10x10", tagColor:T.yw, weekLabel:"Week "+wk+" - Shoulders & Arms (GVT)",
      exercises: [exo("Overhead Press",true,"10x10 @ 60% / 90s rest",mkSets(10,10,wt(0.60,op))), exo("Pull-ups",true,"10x Max",mkSets(10,"Max",0)), exo("Barbell Curl",false,"3x12",mkSets(3,12,0))] };
    return { name:"Deadlift Day", tag:"10x3", tagColor:T.rd, weekLabel:"Week "+wk+" - Deadlift (GVT)",
      exercises: [exo("Deadlift",true,"10x3 @ 65%",mkSets(10,3,wt(0.65,dl))), exo("Hip Thrust",false,"3x15",mkSets(3,15,0)), exo("Plank",false,"3x60s",mkSets(3,"60s",0))] };
  }

  if (pid === "pyramid") {
    if (![1,3,5].includes(dow)) return null;
    const t = sc % 3;
    if (t === 0) return { name:"Lower Pyramid", tag:"LWR", tagColor:T.pk, weekLabel:"Week "+wk+" - Lower Pyramid",
      exercises: [exo("Squat",true,"12/10/8/6",pyrSets(sq)), exo("Romanian DL",true,"12/10/8/6",pyrSets(dl)), exo("Leg Press",false,"3x12",mkSets(3,12,0))] };
    if (t === 1) return { name:"Upper Push", tag:"PSH", tagColor:T.ac, weekLabel:"Week "+wk+" - Push Pyramid",
      exercises: [exo("Bench Press",true,"12/10/8/6",pyrSets(bp)), exo("Overhead Press",true,"12/10/8/6",pyrSets(op)), exo("Lateral Raise",false,"3x15",mkSets(3,15,0))] };
    return { name:"Upper Pull", tag:"PLL", tagColor:T.pu, weekLabel:"Week "+wk+" - Pull Pyramid",
      exercises: [exo("Deadlift",true,"12/10/8/6",pyrSets(dl)), exo("Barbell Row",true,"12/10/8/6",pyrSets(bp)), exo("Pull-ups",false,"4xMax",mkSets(4,"Max",0))] };
  }

  if (pid === "circuit") {
    if (![1,3,5].includes(dow)) return null;
    const t = sc % 3;
    const cn = "60s rest between rounds only";
    if (t === 0) return { name:"Circuit A", tag:"CIR", tagColor:T.tl, weekLabel:"Week "+wk+" - Circuit A",
      exercises: [exo("Squat",true,cn,mkSets(4,12,wt(0.55,sq))), exo("Push-ups",false,cn,mkSets(4,15,0)), exo("Barbell Row",false,cn,mkSets(4,12,wt(0.50,bp))), exo("Lunges",false,cn,mkSets(4,10,0)), exo("Plank",false,"4x30s",mkSets(4,"30s",0))] };
    if (t === 1) return { name:"Circuit B", tag:"CIR", tagColor:T.tl, weekLabel:"Week "+wk+" - Circuit B",
      exercises: [exo("Deadlift",true,cn,mkSets(4,10,wt(0.55,dl))), exo("Bench Press",false,cn,mkSets(4,12,wt(0.55,bp))), exo("Pull-ups",false,cn,mkSets(4,"Max",0)), exo("Mountain Climbers",false,cn,mkSets(4,20,0)), exo("Sit-ups",false,cn,mkSets(4,20,0))] };
    return { name:"Circuit C", tag:"CIR", tagColor:T.tl, weekLabel:"Week "+wk+" - Circuit C",
      exercises: [exo("Overhead Press",true,cn,mkSets(4,12,wt(0.55,op))), exo("Bulgarian Split Squat",false,cn,mkSets(4,10,0)), exo("Dips",false,cn,mkSets(4,"Max",0)), exo("Barbell Curl",false,cn,mkSets(4,15,0)), exo("Plank",false,"4x45s",mkSets(4,"45s",0))] };
  }

  if (pid === "hiit") {
    if (![1,3,5].includes(dow)) return null;
    const t = sc % 3;
    const hn = "20s max effort / 10s rest";
    if (t === 0) return { name:"Lower HIIT", tag:"LWR", tagColor:T.rd, weekLabel:"Week "+wk+" - Lower HIIT",
      exercises: [exo("Jump Squats",true,hn,mkSets(8,"20s",0)), exo("Lunges",false,hn,mkSets(8,"20s",0)), exo("Burpees",false,hn,mkSets(6,"20s",0)), exo("Mountain Climbers",false,hn,mkSets(6,"20s",0))] };
    if (t === 1) return { name:"Upper HIIT", tag:"UPP", tagColor:T.ac, weekLabel:"Week "+wk+" - Upper HIIT",
      exercises: [exo("Push-ups",true,hn,mkSets(8,"20s",0)), exo("Pull-ups",false,hn,mkSets(6,"Max",0)), exo("Dips",false,hn,mkSets(6,"Max",0)), exo("Mountain Climbers",false,hn,mkSets(6,"20s",0))] };
    return { name:"Full Body HIIT", tag:"FBH", tagColor:T.or, weekLabel:"Week "+wk+" - Full Body HIIT",
      exercises: [exo("Burpees",true,hn,mkSets(8,"20s",0)), exo("Jump Squats",false,hn,mkSets(6,"20s",0)), exo("Push-ups",false,hn,mkSets(6,"20s",0)), exo("Mountain Climbers",false,hn,mkSets(8,"20s",0)), exo("Sit-ups",false,hn,mkSets(6,"20s",0))] };
  }

  if (pid === "periodized") {
    if (![1,2,4,5].includes(dow)) return null;
    const t = sc % 4;
    const ph = wk <= 4
      ? { n:"Hypertrophy", c:T.pu, r:"10", p:0.68, s:4 }
      : wk <= 8
        ? { n:"Strength", c:T.ac, r:"5", p:0.80, s:5 }
        : { n:"Power",    c:T.rd, r:"3", p:0.88, s:5 };
    const ss = b => mkSets(ph.s, ph.r, wt(ph.p, b));
    if (t === 0) return { name:"Lower - "+ph.n, tag:ph.n.slice(0,3).toUpperCase(), tagColor:ph.c, weekLabel:"Week "+wk+" - Lower ("+ph.n+")",
      exercises: [exo("Squat",true,ph.s+"x"+ph.r,ss(sq)), exo("Romanian DL",false,"3x10",mkSets(3,10,wt(0.55,dl))), exo("Leg Press",false,"3x12",mkSets(3,12,0))] };
    if (t === 1) return { name:"Upper - "+ph.n, tag:ph.n.slice(0,3).toUpperCase(), tagColor:ph.c, weekLabel:"Week "+wk+" - Upper ("+ph.n+")",
      exercises: [exo("Bench Press",true,ph.s+"x"+ph.r,ss(bp)), exo("Barbell Row",false,ph.s+"x"+ph.r,mkSets(ph.s,ph.r,wt(0.90,bp))), exo("Overhead Press",false,"3x8",mkSets(3,8,wt(0.70,op)))] };
    if (t === 2) return { name:"Lower B - "+ph.n, tag:ph.n.slice(0,3).toUpperCase(), tagColor:ph.c, weekLabel:"Week "+wk+" - Lower B ("+ph.n+")",
      exercises: [exo("Deadlift",true,ph.s+"x"+ph.r,ss(dl)), exo("Squat",false,"3x8",mkSets(3,8,wt(0.70,sq))), exo("Hip Thrust",false,"3x12",mkSets(3,12,0))] };
    return { name:"Upper B - "+ph.n, tag:ph.n.slice(0,3).toUpperCase(), tagColor:ph.c, weekLabel:"Week "+wk+" - Upper B ("+ph.n+")",
      exercises: [exo("Overhead Press",true,ph.s+"x"+ph.r,ss(op)), exo("Bench Press",false,"3x8",mkSets(3,8,wt(0.70,bp))), exo("Pull-ups",false,"4xMax",mkSets(4,"Max",0))] };
  }

  if (pid === "ironblocks") {
    // Week/day schedule lookup — exact 13-week block schedule
    const SCH = {
      1:  {1:"CT",2:"L", 3:"BB",4:"S", 5:"CA",6:null, 0:"CT"},
      2:  {1:"L", 2:"BB",3:"S", 4:null,5:"CT",6:"L",  0:"BB"},
      3:  {1:"S", 2:null,3:"CT",4:"L", 5:"BB",6:"S",  0:"CA"},
      4:  {1:"BL",2:"BBA",3:"BAR",4:"BSH",5:null,6:"BCH",0:"BCH"},
      5:  {1:"BBA",2:"BAR",3:"BSH",4:null,5:"BCH",6:"BL",0:"BL"},
      6:  {1:"BAR",2:"BSH",3:null,4:"BCH",5:"BL",6:"BBA",0:"BBA"},
      7:  {1:"BSH",2:null,3:"BCH",4:"BL",5:"BBA",6:"BAR",0:"BAR"},
      8:  {1:null,2:"BCH",3:"BL",4:"BBA",5:"BAR",6:"BSH",0:"BSH"},
      9:  {1:"BCH",2:"BL",3:"BBA",4:"BAR",5:"BSH",6:null,0:null},
      10: {1:"BL",2:"BB",3:"CA",4:null,5:"BAR",6:"S",0:"CT"},
      11: {1:"L",2:"CA",3:null,4:"BBA",5:"BAR",6:"CA",0:"BCH"},
      12: {1:"BL",2:"CA",3:null,4:"BB",5:"BSH",6:"CA",0:"CT"},
      13: {1:"L",2:"CT",3:"BB",4:"CA",5:null,6:null,0:"S"},
    };
    const code = (SCH[wk] || {})[dow];
    if (!code) return null;

    // Set builders
    const pyr  = w => [{reps:"15",weight:w,isAmrap:false},{reps:"12",weight:w,isAmrap:false},{reps:"8",weight:w,isAmrap:false},{reps:"8",weight:w,isAmrap:false}];
    const pyr3 = w => [{reps:"15",weight:w,isAmrap:false},{reps:"12",weight:w,isAmrap:false},{reps:"8",weight:w,isAmrap:false}];
    const prg  = w => [{reps:"15",weight:w,isAmrap:false},{reps:"12",weight:w,isAmrap:false},{reps:"8",weight:w,isAmrap:false},{reps:"8",weight:w,isAmrap:false},{reps:"12",weight:w,isAmrap:false},{reps:"15",weight:w,isAmrap:false}];
    const f5   = w => Array.from({length:5},()=>({reps:"5",weight:w,isAmrap:false}));
    const s    = (n,r,w) => mkSets(n,r,w);
    const ss   = "super set — no rest between A and B";
    const gs   = "giant set — no rest A → B → C";
    const sn   = "pyramid 15/12/8/8 — increase weight each set";
    const fn   = "force set — heavy 5 reps × 5 sets, 60s rest";
    const pn   = "progressive 15/12/8/8/12/15 — ride the pyramid";

    // ── BUILD BLOCK workouts ──────────────────────────────────────────────────
    if (code === "CT") return { name:"Build: Chest & Tris", tag:"CT", tagColor:T.or,
      weekLabel:"Week "+wk+" — Build: Chest & Tris",
      exercises:[
        exo("DB Chest Press",true,sn,pyr(0)),
        exo("Incline DB Fly",false,ss,pyr3(0),"A"),
        exo("Incline DB Press",false,ss+" with Fly",pyr3(0),"A"),
        exo("Close Grip Press",false,gs,pyr3(0),"B"),
        exo("Partial Chest Fly",false,gs,pyr3(0),"B"),
        exo("Decline Push-Ups",false,gs,pyr3(0),"B"),
        exo("Tricep Extension",false,sn,pyr(0)),
        exo("Single Arm Kickback L",false,"giant set — no rest A → B → C",pyr3(0),"C"),
        exo("Single Arm Kickback R",false,"giant set — no rest A → B → C",pyr3(0),"C"),
        exo("Tricep Push-Up",false,"giant set — no rest A → B → C",pyr3(0),"C"),
        exo("Dips on Bench",false,"super set — 2 rounds to failure",s(2,"Max",0),"D"),
        exo("Ins & Outs",false,"super set — 2 rounds to failure",s(2,"Max",0),"D"),
      ]};

    if (code === "L") return { name:"Build: Legs", tag:"L", tagColor:T.gr,
      weekLabel:"Week "+wk+" — Build: Legs",
      exercises:[
        exo("Sumo Squat",true,sn,pyr(0)),
        exo("Alternating Lunge",false,"giant set — no rest A → B → C",pyr3(0),"A"),
        exo("Step-Up to Rev Lunge R",false,"giant set — no rest A → B → C",pyr3(0),"A"),
        exo("Step-Up to Rev Lunge L",false,"giant set — no rest A → B → C",pyr3(0),"A"),
        exo("Parallel Squat",false,"giant set — no rest A → B → C → D → E",pyr3(0),"B"),
        exo("Bulgarian Squat L",false,"giant set — no rest A → B → C → D → E",pyr3(0),"B"),
        exo("Bulgarian Squat R",false,"giant set — no rest A → B → C → D → E",pyr3(0),"B"),
        exo("Straight Leg Deadlift R",false,"giant set — no rest A → B → C → D → E",pyr3(0),"B"),
        exo("Straight Leg Deadlift L",false,"giant set — no rest A → B → C → D → E",pyr3(0),"B"),
        exo("Single Leg Calf Raise L",false,"giant set — no rest A → B → C → D",s(2,15,0),"C"),
        exo("Single Leg Calf Raise R",false,"giant set — no rest A → B → C → D",s(2,15,0),"C"),
        exo("Seated Calf Raise",false,"giant set — no rest A → B → C → D",s(2,15,0),"C"),
        exo("Ins & Outs",false,"giant set — no rest A → B → C → D",s(2,15,0),"C"),
      ]};

    if (code === "BB") return { name:"Build: Back & Bis", tag:"BB", tagColor:T.ac,
      weekLabel:"Week "+wk+" — Build: Back & Bis",
      exercises:[
        exo("Deadlift",true,sn,pyr(0)),
        exo("DB Pull-Over",false,ss,pyr3(0),"A"),
        exo("Pull-Up",false,ss+" with Pull-Over",s(4,"Max",0),"A"),
        exo("EZ Bar Row",false,"giant set — no rest A → B → C → D",pyr3(0),"B"),
        exo("One-Arm Row L",false,"giant set — no rest A → B → C → D",pyr3(0),"B"),
        exo("One-Arm Row R",false,"giant set — no rest A → B → C → D",pyr3(0),"B"),
        exo("Reverse Fly",false,"giant set — no rest A → B → C → D",pyr3(0),"B"),
        exo("Close-Grip Chin-Up",false,"3 sets — hold 30s each",s(3,"30s",0)),
        exo("Seated Bicep Curl",false,sn,pyr(0)),
        exo("1,1,2 Hammer Curl",false,"3 sets pyramid 15/12/8",pyr3(0)),
        exo("Neutral EZ Bar Curl",false,"4 sets pyramid 15/12/8/8",pyr(0)),
        exo("Airplane Cobra",false,"2 sets × 15 — back extension finisher",s(2,15,0)),
      ]};

    if (code === "S") return { name:"Build: Shoulders", tag:"SH", tagColor:T.pu,
      weekLabel:"Week "+wk+" — Build: Shoulders",
      exercises:[
        exo("Shoulder Press",true,sn,pyr(0)),
        exo("Lateral Raise",false,ss,pyr3(0),"A"),
        exo("Upright Row",false,ss+" with Laterals",pyr3(0),"A"),
        exo("EZ Bar Underhand Press",false,gs,pyr3(0),"B"),
        exo("1,1,2 Front Raise",false,gs,pyr3(0),"B"),
        exo("Rear Delt Raise",false,gs,pyr3(0),"B"),
        exo("DB Shrug",false,ss,pyr3(0),"C"),
        exo("DB Scap Trap",false,ss+" with Shrug",pyr3(0),"C"),
        exo("Sagi Six-Way",false,"super set — 2 rounds",s(2,10,0),"D"),
        exo("Tuck & Roll",false,"super set — 2 rounds",s(2,10,0),"D"),
      ]};

    if (code === "CA") return { name:"Cardio & Abs", tag:"ABS", tagColor:T.tl,
      weekLabel:"Week "+wk+" — Cardio & Abs",
      exercises:[
        exo("Jumping Jacks",true,"3 sets × 60s",s(3,"60s",0)),
        exo("Crunch",false,"3 sets × 15",s(3,15,0)),
        exo("Plank",false,"3 sets × 45s",s(3,"45s",0)),
        exo("Mountain Climbers",false,"3 sets × 30s",s(3,"30s",0)),
        exo("Bicycle Crunch",false,"3 sets × 20",s(3,20,0)),
        exo("Russian Twist",false,"3 sets × 15",s(3,15,0)),
        exo("Burpees",false,"3 sets × 10",s(3,10,0)),
      ]};

    // ── MASS BLOCK workouts ───────────────────────────────────────────────────
    if (code === "BCH") return { name:"Mass: Chest", tag:"BCH", tagColor:T.or,
      weekLabel:"Week "+wk+" — Mass: Chest",
      exercises:[
        exo("Incline Fly",false,ss,pyr3(0),"A"),
        exo("Incline Press",true,ss+" with Fly",pyr3(0),"A"),
        exo("Chest Press w/ Rotation",false,fn,f5(0)),
        exo("Incline Press",false,pn,prg(0)),
        exo("Close Grip Press to Fly",false,"combo set — 3 sets 15/12/8",pyr3(0)),
        exo("Decline Push-Ups",false,"multi set — giant circuit A → B → C, 3 rounds",s(3,"Max",0),"B"),
        exo("Cobra to Airplane",false,"multi set — giant circuit A → B → C, 3 rounds",s(3,15,0),"B"),
        exo("Russian Twist",false,"multi set — giant circuit A → B → C, 3 rounds",s(3,15,0),"B"),
        exo("Bench Press",false,"drop set — 4 sets, reduce weight each set",pyr(0)),
      ]};

    if (code === "BL") return { name:"Mass: Legs", tag:"BL", tagColor:T.gr,
      weekLabel:"Week "+wk+" — Mass: Legs",
      exercises:[
        exo("Front to Back Lunge R",false,sn,pyr(0)),
        exo("Front to Back Lunge L",false,sn,pyr(0)),
        exo("Squat",true,pn,prg(0)),
        exo("Full to ½ Sumo Squat",false,fn,f5(0)),
        exo("Split Squat R",false,"progressive 3 sets — increase weight each set",pyr3(0)),
        exo("Split Squat L",false,"progressive 3 sets — increase weight each set",pyr3(0)),
        exo("Stiff Leg Deadlift",false,ss,pyr3(0),"A"),
        exo("Alt Side Squat",false,ss+" with SL DL",pyr3(0),"A"),
        exo("Calf Raise",false,ss,s(3,15,0),"B"),
        exo("Beast Abs",false,"super set — abs circuit",s(3,15,0),"B"),
      ]};

    if (code === "BBA") return { name:"Mass: Back", tag:"BBA", tagColor:T.ac,
      weekLabel:"Week "+wk+" — Mass: Back",
      exercises:[
        exo("Pull-Over",false,ss,pyr3(0),"A"),
        exo("Pull-Up",true,ss+" with Pull-Over",s(4,"Max",0),"A"),
        exo("Reverse Grip Row",false,pn,prg(0)),
        exo("One-Arm Row R",false,fn,f5(0)),
        exo("One-Arm Row L",false,fn,f5(0)),
        exo("Deadlift",true,"single set pyramid 15/12/8/8",pyr(0)),
        exo("Reverse Fly",false,"super set — 3 rounds",pyr3(0),"B"),
        exo("Plank Rotation",false,"super set — 3 rounds",pyr3(0),"B"),
      ]};

    if (code === "BAR") return { name:"Mass: Arms", tag:"BAR", tagColor:T.pk,
      weekLabel:"Week "+wk+" — Mass: Arms",
      exercises:[
        exo("Standing Curl",true,pn,prg(0)),
        exo("Tricep Extension",false,sn,pyr(0)),
        exo("Wide EZ Bar Curl",false,fn,f5(0)),
        exo("Skull Crusher",false,sn,pyr(0)),
        exo("Hammer Curl R",false,"progressive 3 sets — 15/12/8",pyr3(0)),
        exo("Hammer Curl L",false,"progressive 3 sets — 15/12/8",pyr3(0)),
        exo("Tricep Kickback R",false,"progressive 3 sets — 15/12/8",pyr3(0)),
        exo("Tricep Kickback L",false,"progressive 3 sets — 15/12/8",pyr3(0)),
        exo("Weighted Crunch",false,"single set × 15",s(1,15,0)),
      ]};

    if (code === "BSH") return { name:"Mass: Shoulders", tag:"BSH", tagColor:T.pu,
      weekLabel:"Week "+wk+" — Mass: Shoulders",
      exercises:[
        exo("Lateral Raise",false,ss,pyr3(0),"A"),
        exo("Arnold Press",true,ss+" with Laterals",pyr3(0),"A"),
        exo("Upright Row",false,pn,prg(0)),
        exo("Alt Front Raise",false,ss,pyr3(0),"B"),
        exo("Plate Twist",false,ss+" with Front Raise",s(3,10,0),"B"),
        exo("Reverse Fly",false,pn,prg(0)),
        exo("Superman Stretch",false,"super set — 2 rounds",s(2,15,0),"C"),
        exo("Plank Twist-Twist",false,"super set — 2 rounds",s(2,15,0),"C"),
      ]};

    return null;
  }

  return null;
}

// ─── CALENDAR GENERATOR ───────────────────────────────────────────────────────
function cloneWo(wo, wk) {
  if (!wo) return null;
  return {
    ...wo,
    weekLabel: (wo.weekLabel || "Week N").replace(/Week [N0-9]+/, "Week " + wk),
    exercises: (wo.exercises || []).map(ex => ({
      ...ex,
      sets: (ex.sets || []).map(s => ({ ...s })),
    })),  };
}

function genCal(pid, mx, customWorkouts, startDate) {
  const DF = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const DS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const total = pid === "juggernaut" ? 112 : pid === "ironblocks" ? 91 : 91;
  const days = [];
  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);
  if (!startDate) {
    const toMon = start.getDay() === 1 ? 0 : start.getDay() === 0 ? 1 : 8 - start.getDay();
    start.setDate(start.getDate() + toMon);
  }
  const cwLen = customWorkouts ? customWorkouts.length : 0;
  const cwDays = cwLen >= 6 ? [1,2,3,4,5,6] : cwLen >= 5 ? [1,2,3,4,5] : cwLen >= 4 ? [1,2,4,5] : [1,3,5];
  let sessionCount = 0;
  for (let i = 0; i < total; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dow = date.getDay();
    const wk = Math.floor(i / 7) + 1;
    let wo = null;
    if (pid === "custom" && cwLen > 0) {
      if (cwDays.includes(dow)) {
        wo = cloneWo(customWorkouts[sessionCount % cwLen], wk);
        sessionCount++;
      }
    } else {
      wo = buildWorkout(pid, mx, wk, dow, sessionCount);
      if (wo) sessionCount++;
    }
    days.push({
      id: "d" + i,
      date,
      dow,
      dayLabel: DS[dow],
      dayFull: DF[dow],
      weekNum: wk,
      isRest: !wo,
      workout: wo,
    });
  }
  return days;
}

// ─── CUSTOM PROGRAM BUILDER ───────────────────────────────────────────────────
function buildCustomProgram(answers) {
  const { equipment: eq, days, goal, level } = answers;
  const nd = Number(days);
  const isBW = eq === "bodyweight";
  const W = {
    squat:    isBW ? 0 : level === "beginner" ? 95  : level === "intermediate" ? 155 : 225,
    bench:    isBW ? 0 : level === "beginner" ? 65  : level === "intermediate" ? 115 : 175,
    deadlift: isBW ? 0 : level === "beginner" ? 115 : level === "intermediate" ? 185 : 275,
    ohp:      isBW ? 0 : level === "beginner" ? 45  : level === "intermediate" ? 75  : 115,
  };
  const h  = (w, s, r) => Array.from({length: s}, () => ({ reps: String(r), weight: w, isAmrap: false }));
  const bw = (s, r)    => Array.from({length: s}, () => ({ reps: String(r), weight: 0, isAmrap: false }));
  let workouts = [];

  if (goal === "strength" && !isBW) {
    const base = [
      { name:"Squat & Press",  tag:"A", tagColor:T.ac, weekLabel:"Week N - Squat & Press",  exercises:[exo("Squat",true,"5x5",h(W.squat,5,5)), exo("Bench Press",true,"5x5",h(W.bench,5,5)), exo("Barbell Row",false,"3x5",h(r5(W.bench*0.85),3,5))] },
      { name:"Hinge & Pull",   tag:"B", tagColor:T.yw, weekLabel:"Week N - Hinge & Pull",   exercises:[exo("Deadlift",true,"3x5",h(W.deadlift,3,5)), exo("Overhead Press",true,"5x5",h(W.ohp,5,5)), exo("Pull-ups",true,"3xMax",bw(3,"Max"))] },
      { name:"Heavy Squat",    tag:"C", tagColor:T.rd, weekLabel:"Week N - Heavy Squat",    exercises:[exo("Squat",true,"5x3 heavy",h(r5(W.squat*1.05),5,3)), exo("Bench Press",true,"5x3",h(r5(W.bench*1.05),5,3)), exo("Barbell Row",false,"3x5",h(W.bench,3,5))] },
      { name:"Upper Power",    tag:"D", tagColor:T.pu, weekLabel:"Week N - Upper Power",    exercises:[exo("Bench Press",true,"4x5",h(W.bench,4,5)), exo("Overhead Press",true,"4x5",h(W.ohp,4,5)), exo("Pull-ups",false,"3xMax",bw(3,"Max"))] },
      { name:"Lower Strength", tag:"E", tagColor:T.or, weekLabel:"Week N - Lower Strength", exercises:[exo("Squat",true,"4x4 heavy",h(r5(W.squat*1.10),4,4)), exo("Deadlift",true,"2x3",h(r5(W.deadlift*1.05),2,3))] },
      { name:"Full Body",      tag:"F", tagColor:T.gr, weekLabel:"Week N - Full Body",      exercises:[exo("Squat",true,"3x5",h(W.squat,3,5)), exo("Bench Press",false,"3x5",h(W.bench,3,5)), exo("Deadlift",false,"1x5",h(W.deadlift,1,5)), exo("Pull-ups",false,"3xMax",bw(3,"Max"))] },
    ];
    workouts = base.slice(0, nd);
  } else if (goal === "muscle" && !isBW) {
    const base = [
      { name:"Push Day",   tag:"PUSH", tagColor:T.ac, weekLabel:"Week N - Push",   exercises:[exo("Bench Press",true,"4x8",h(W.bench,4,8)), exo("Overhead Press",true,"3x10",h(W.ohp,3,10)),
        exo("Incline DB Press",false,"3x12 — superset with Laterals",h(r5(W.bench*0.30),3,12), "A"),
        exo("Lateral Raise",false,"3x15 — superset with Incline",bw(3,15), "A"),
        exo("Tricep Pushdown",false,"3x15",bw(3,15))] },
      { name:"Pull Day",   tag:"PULL", tagColor:T.pu, weekLabel:"Week N - Pull",   exercises:[exo("Pull-ups",true,"4xMax",bw(4,"Max")), exo("Barbell Row",true,"4x8",h(r5(W.bench*0.85),4,8)),
        exo("DB Row",false,"3x10 — superset with Face Pulls",bw(3,10), "A"),
        exo("Face Pull",false,"3x15 — superset with Rows",bw(3,15), "A"),
        exo("Barbell Curl",false,"3x12",bw(3,12))] },
      { name:"Legs Day",   tag:"LEGS", tagColor:T.gr, weekLabel:"Week N - Legs",   exercises:[exo("Squat",true,"4x8",h(W.squat,4,8)), exo("Romanian DL",true,"3x10",h(r5(W.deadlift*0.58),3,10)), exo("Leg Press",false,"3x12",bw(3,12)), exo("Leg Curl",false,"3x12",bw(3,12)), exo("Hip Thrust",false,"3x15",bw(3,15))] },
      { name:"Push B",     tag:"PB",   tagColor:T.ac, weekLabel:"Week N - Push B", exercises:[exo("Overhead Press",true,"4x8",h(W.ohp,4,8)), exo("Incline DB Press",true,"4x10",h(r5(W.bench*0.30),4,10)), exo("Lateral Raise",false,"4x15",bw(4,15)), exo("Tricep Pushdown",false,"4x15",bw(4,15))] },
      { name:"Pull B",     tag:"LB",   tagColor:T.pu, weekLabel:"Week N - Pull B", exercises:[exo("Barbell Row",true,"4x6",h(r5(W.bench*0.85),4,6)), exo("Pull-ups",true,"4xMax",bw(4,"Max")), exo("Barbell Curl",false,"4x12",bw(4,12)), exo("Face Pull",false,"3x15",bw(3,15))] },
      { name:"Legs B",     tag:"L2",   tagColor:T.gr, weekLabel:"Week N - Legs B", exercises:[exo("Deadlift",true,"3x5",h(W.deadlift,3,5)), exo("Squat",false,"3x10",h(r5(W.squat*0.75),3,10)), exo("Hip Thrust",false,"3x15",bw(3,15)), exo("Leg Curl",false,"3x12",bw(3,12))] },
    ];
    workouts = base.slice(0, nd);
  } else if (isBW) {
    const base = [
      { name:"Full Body A", tag:"A",   tagColor:T.ac, weekLabel:"Week N - Full Body A", exercises:[exo("Push-ups",true,"4x20",bw(4,20)), exo("Pull-ups",true,"4xMax",bw(4,"Max")), exo("Squat",true,"3x20",bw(3,20)), exo("Dips",false,"3xMax",bw(3,"Max")), exo("Plank",false,"3x60s",bw(3,"60s"))] },
      { name:"Full Body B", tag:"B",   tagColor:T.pu, weekLabel:"Week N - Full Body B", exercises:[exo("Bulgarian Split Squat",true,"3x8 each",bw(3,8)), exo("Push-ups",true,"5x15",bw(5,15)), exo("Pull-ups",true,"4xMax",bw(4,"Max")), exo("Mountain Climbers",false,"3x20",bw(3,20)), exo("Sit-ups",false,"3x20",bw(3,20))] },
      { name:"Power Day",   tag:"PWR", tagColor:T.rd, weekLabel:"Week N - Power",       exercises:[exo("Jump Squats",true,"5x10",bw(5,10)), exo("Burpees",true,"4x10",bw(4,10)), exo("Push-ups",false,"5x15",bw(5,15)), exo("Lunges",false,"3x12",bw(3,12))] },
      { name:"Skill Day",   tag:"SKL", tagColor:T.gr, weekLabel:"Week N - Skills",      exercises:[exo("Dips",true,"4xMax",bw(4,"Max")), exo("Pull-ups",true,"5xMax",bw(5,"Max")), exo("Bulgarian Split Squat",false,"3x8",bw(3,8)), exo("Plank",false,"3x90s",bw(3,"90s"))] },
    ];
    workouts = base.slice(0, nd);
  } else {
    const base = [
      { name:"Full Body A",    tag:"FA",   tagColor:T.rd, weekLabel:"Week N - Full Body A",    exercises:[exo("Squat",true,"4x12",h(r5(W.squat*0.65),4,12)), exo("Bench Press",true,"4x12",h(r5(W.bench*0.65),4,12)), exo("Barbell Row",false,"3x12",h(r5(W.bench*0.60),3,12)), exo("Plank",false,"3x45s",bw(3,"45s"))] },
      { name:"Full Body B",    tag:"FB",   tagColor:T.or, weekLabel:"Week N - Full Body B",    exercises:[exo("Deadlift",true,"3x8",h(r5(W.deadlift*0.65),3,8)), exo("Overhead Press",true,"3x10",h(W.ohp,3,10)), exo("Pull-ups",false,"4xMax",bw(4,"Max")), exo("Leg Press",false,"3x15",bw(3,15))] },
      { name:"Conditioning",   tag:"COND", tagColor:T.yw, weekLabel:"Week N - Conditioning",   exercises:[exo("Burpees",true,"4x10",bw(4,10)), exo("Jump Squats",true,"4x15",bw(4,15)), exo("Mountain Climbers",false,"3x20",bw(3,20)), exo("Push-ups",false,"4x15",bw(4,15))] },
    ];
    workouts = base.slice(0, nd);
  }

  const nm = { strength:"Power Builder", muscle:"Hypertrophy Protocol", fat_loss:"Shred & Burn", athletic:"Athletic Performance" };
  const tl = { strength:"Heavy compounds, progressive overload, built for strength", muscle:"Volume-focused muscle-building", fat_loss:"High-intensity training to burn fat", athletic:"Balanced strength, power, and conditioning" };
  const cl = { strength:T.ac, muscle:T.pu, fat_loss:T.rd, athletic:T.gr };
  return {
    programName: nm[goal] || "Custom Program",
    tagline:     tl[goal] || "Your custom program",
    color:       cl[goal] || T.ac,
    workouts,
  };
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  ::-webkit-scrollbar { width: 0; }
  body, html { background: #0A0A0F; color: #EEEDF6; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pop  { 0% { transform: scale(0.6); opacity:0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity:1; } }
  textarea { color: #EEEDF6; caret-color: #0EA86A; }
`;

const Badge = ({ ch, color = T.ac, sm }) => (
  <span style={{ background: color+"18", border: "1px solid "+color+"35", color, borderRadius: 6,
    padding: sm ? "1px 6px" : "2px 9px", fontSize: sm ? 9 : 11, fontWeight: 700,
    fontFamily: T.fn, whiteSpace: "nowrap" }}>
    {ch}
  </span>
);

const Pill = ({ ch }) => (
  <span style={{ background: T.hi, border: "1px solid "+T.bo, borderRadius: 20, padding: "3px 9px",
    fontSize: 11, color: T.mu, fontFamily: T.fn, fontWeight: 600, whiteSpace: "nowrap" }}>
    {ch}
  </span>
);

const Btn = ({ ch, onClick, color = T.ac, ghost = false, dim = false, style: s = {}, disabled = false }) => {
  const bg    = ghost ? "transparent" : dim ? color+"14" : color;
  const bdr   = (ghost || dim) ? "1px solid " + (ghost ? T.bo : color+"30") : "none";
  const clr   = ghost ? T.mu : dim ? color : "#fff";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ cursor: disabled ? "not-allowed" : "pointer", fontFamily: T.fn, fontWeight: 700,
        borderRadius: 10, fontSize: 14, padding: "12px 20px", lineHeight: 1,
        background: bg, border: bdr, color: clr, opacity: disabled ? 0.45 : 1, ...s }}>
      {ch}
    </button>
  );
};

const Card = ({ children, style: s = {}, onClick }) => (
  <div onClick={onClick}
    style={{ background: T.su, border: "1px solid "+T.bo, borderRadius: 14,
      overflow: "hidden", cursor: onClick ? "pointer" : "default", ...s }}>
    {children}
  </div>
);

const PBar = ({ val, max, color = T.ac, h = 4 }) => (
  <div style={{ height: h, background: T.bo, borderRadius: h, overflow: "hidden" }}>
    <div style={{ height: "100%", width: Math.min(val / Math.max(max, 1) * 100, 100) + "%",
      background: color, borderRadius: h, transition: "width .6s" }} />
  </div>
);

const BackBtn = ({ onClick, label = "Back" }) => (
  <button onClick={onClick}
    style={{ background: "none", border: "none", color: T.mu, cursor: "pointer",
      fontSize: 13, fontFamily: T.fn, padding: "0 0 20px", display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ fontSize: 16 }}>&larr;</span>{label}
  </button>
);

const Sep = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
    {label && <span style={{ color: T.di, fontSize: 10, fontWeight: 700, letterSpacing: 1,
      fontFamily: T.fn, whiteSpace: "nowrap" }}>{label}</span>}
    <div style={{ height: 1, flex: 1, background: T.lo }} />
  </div>
);

const MAX_1RM = 1500; // no credible raw 1RM exceeds this
const NumInput = ({ label, value, onChange, hint }) => {
  const handleChange = (e) => {
    const raw = e.target.value;
    // Allow empty string so user can clear the field
    if (raw === "") { onChange(""); return; }
    const n = Number(raw);
    if (isNaN(n) || n < 0) return;
    onChange(String(Math.min(Math.floor(n), MAX_1RM)));
  };
  const warn = value && Number(value) >= MAX_1RM;
  return (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ color: T.mu, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, fontFamily: T.fn }}>{label}</span>
      {warn
        ? <span style={{ color: T.rd, fontSize: 11, fontFamily: T.fn }}>Max {MAX_1RM} lbs</span>
        : hint && <span style={{ color: T.di, fontSize: 11, fontFamily: T.fn }}>{hint}</span>}
    </div>
    <div style={{ display: "flex", alignItems: "center", background: T.hi,
      border: "1px solid " + (warn ? T.rd+"60" : value && Number(value) > 0 ? T.ac+"50" : T.bo), borderRadius: 10, overflow: "hidden" }}>
      <input type="number" value={value} onChange={handleChange} placeholder="0" min="0" max={MAX_1RM}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none",
          padding: "12px 14px", fontSize: 20, fontFamily: T.mo, fontWeight: 700, color: T.tx }} />
      <span style={{ color: T.mu, fontSize: 13, paddingRight: 14, fontFamily: T.fn }}>lbs</span>
    </div>
  </div>
  );
};

// ─── EXERCISE PHOTO ───────────────────────────────────────────────────────────
// Fetches animated GIFs from ExerciseDB (RapidAPI free tier).
// Module-level cache: each exercise name fetches once per session, then
// the service worker caches the image URL permanently — works offline after first view.
// Set VITE_RAPIDAPI_KEY in Vercel environment variables to enable.
const _photoCache = new Map(); // name → gifUrl string

// Normalize exercise names to maximize API match rate
const _normalizeName = (name) => {
  return name
    .toLowerCase()
    .replace(/\bdb\b/g, "dumbbell")
    .replace(/\bkb\b/g, "kettlebell")
    .replace(/\brdl\b/g, "romanian deadlift")
    .replace(/\bohp\b/g, "overhead press")
    .replace(/\balt\.?\b/g, "")
    .replace(/\b([-–])?\s*(r|l)\b/g, "")     // strip -R / -L suffixes
    .replace(/1,1,2/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const ExercisePhoto = ({ name, size = "full" }) => {
  const [url, setUrl]       = useState(() => _photoCache.get(name) || null);
  const [status, setStatus] = useState(_photoCache.has(name) ? "done" : "loading");

  useEffect(() => {
    if (_photoCache.has(name)) { setUrl(_photoCache.get(name)); setStatus("done"); return; }
    const apiKey = RAPIDAPI_KEY;
    if (!apiKey) { setStatus("none"); return; }
    const q = encodeURIComponent(_normalizeName(name));
    fetch(`https://exercisedb.p.rapidapi.com/exercises/name/${q}?limit=1&offset=0`, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const gifUrl = Array.isArray(data) && data[0]?.gifUrl;
        if (gifUrl) { _photoCache.set(name, gifUrl); setUrl(gifUrl); }
        setStatus("done");
      })
      .catch(() => setStatus("none"));
  }, [name]);

  if (size === "thumb") {
    if (!url) return null;
    return (
      <img src={url} alt={name}
        style={{ width:44, height:44, borderRadius:8, objectFit:"cover",
          flexShrink:0, border:"1px solid "+T.bo, background:T.hi }} />
    );
  }

  // Full size — used in ExDrawer
  if (status === "loading") return (
    <div style={{ height:160, background:T.hi, borderRadius:12, marginBottom:20,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:24, height:24, borderRadius:"50%", border:"2px solid "+T.bo,
        borderTopColor:T.ac, animation:"spin 1s linear infinite" }} />
    </div>
  );
  if (!url) return null;
  return (
    <div style={{ marginBottom:20, borderRadius:12, overflow:"hidden", background:"#fff" }}>
      <img src={url} alt={name}
        style={{ width:"100%", display:"block", maxHeight:220, objectFit:"contain" }} />
    </div>
  );
};

// ─── EXERCISE DRAWER ──────────────────────────────────────────────────────────
const ExDrawer = ({ ex, color, onClose }) => {
  const info = exInfo(ex.name);
  return (
    <>
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 200 }} />
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 440, background: T.su, borderRadius: "22px 22px 0 0",
        zIndex: 201, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px",
          position: "sticky", top: 0, background: T.su }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: T.bo }} />
        </div>
        <div style={{ padding: "8px 22px 52px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <h3 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 21, color: T.tx,
              margin: 0, flex: 1, paddingRight: 12, lineHeight: 1.2 }}>{ex.name}</h3>
            <button onClick={onClose}
              style={{ background: T.hi, border: "1px solid "+T.bo, borderRadius: 8,
                width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                color: T.mu, cursor: "pointer", fontFamily: T.fn, fontSize: 14 }}>X</button>
          </div>
          <div style={{ color: T.mu, fontSize: 13, fontFamily: T.fn, marginBottom: 16 }}>{info.m}</div>
          <ExercisePhoto name={ex.name} size="full" />
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <div style={{ flex: 1, background: color+"12", border: "1px solid "+color+"28", borderRadius: 12, padding: "13px 14px" }}>
              <div style={{ color: T.di, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn, marginBottom: 5 }}>REST TIME</div>
              <div style={{ color, fontFamily: T.mo, fontWeight: 700, fontSize: 24 }}>{fmt(info.r)}</div>
              <div style={{ color: T.mu, fontSize: 10, fontFamily: T.fn, marginTop: 2 }}>recommended</div>
            </div>
            <div style={{ flex: 1, background: T.hi, border: "1px solid "+T.bo, borderRadius: 12, padding: "13px 14px" }}>
              <div style={{ color: T.di, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn, marginBottom: 5 }}>SETS</div>
              <div style={{ color: T.tx, fontFamily: T.mo, fontWeight: 700, fontSize: 24 }}>{(ex.sets || []).length}</div>
              <div style={{ color: T.mu, fontSize: 10, fontFamily: T.fn, marginTop: 2 }}>this session</div>
            </div>
          </div>
          {ex.note && (
            <div style={{ background: T.hi, border: "1px solid "+T.bo, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ color: T.di, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn, marginBottom: 4 }}>COACH CUE</div>
              <div style={{ color: "#A8A6BE", fontSize: 13, fontFamily: T.fn, lineHeight: 1.6 }}>{ex.note}</div>
            </div>
          )}
          <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn, marginBottom: 10 }}>TECHNIQUE TIPS</div>
          {info.tips.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: color+"15",
                border: "1px solid "+color+"30", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontFamily: T.mo, fontSize: 11, fontWeight: 700, color, marginTop: 1 }}>{i+1}</div>
              <span style={{ color: "#A8A6BE", fontSize: 13, fontFamily: T.fn, lineHeight: 1.6, paddingTop: 2 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ─── REST TIMER ───────────────────────────────────────────────────────────────
const RestTimer = ({ exName, initSec, nextLabel, onDone }) => {
  const [left, setLeft] = useState(initSec);
  const [fin, setFin] = useState(false);
  const total = initSec;
  const dRef = useRef(onDone);
  dRef.current = onDone;

  useEffect(() => {
    const iv = setInterval(() => {
      setLeft(l => {
        if (l <= 1) { setFin(true); return 0; }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!fin) return;
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
    const t = setTimeout(() => dRef.current(), 1800);
    return () => clearTimeout(t);
  }, [fin]);

  const adj = d => setLeft(l => Math.max(5, Math.min(600, l + d)));
  const pct = total > 0 ? Math.max(0, (total - left) / total) : 1;
  const R = 56, circ = 2 * Math.PI * R;
  const urgent = left <= 10 && !fin;
  const rc = fin ? T.gr : urgent ? T.rd : T.ac;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.92)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
        <div style={{ color: fin ? T.gr : T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 3,
          fontFamily: T.fn, marginBottom: 24 }}>{fin ? "TIME TO GO!" : "REST"}</div>
        <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 22px" }}>
          <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="80" cy="80" r={R} fill="none" stroke={T.bo} strokeWidth="10" />
            <circle cx="80" cy="80" r={R} fill="none" stroke={rc} strokeWidth="10"
              strokeLinecap="round" strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center" }}>
            {fin
              ? <div style={{ marginBottom:4 }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill={T.gr+"25"} stroke={T.gr} strokeWidth="1.5"/>
                    <path d="M7 12l4 4 6-7" stroke={T.gr} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              : <div style={{ fontFamily: T.mo, fontWeight: 700, fontSize: 46,
                  color: urgent ? T.rd : T.tx, lineHeight: 1 }}>{fmt(left)}</div>
            }
          </div>
        </div>
        <div style={{ color: T.mu, fontSize: 12, fontFamily: T.fn, marginBottom: 3 }}>After</div>
        <div style={{ color: T.tx, fontWeight: 800, fontSize: 17, fontFamily: T.fn, marginBottom: 18 }}>{exName}</div>
        {nextLabel && !fin && (
          <div style={{ background: T.su, border: "1px solid "+T.bo, borderRadius: 12,
            padding: "10px 18px", marginBottom: 20 }}>
            <div style={{ color: T.di, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn, marginBottom: 3 }}>NEXT</div>
            <div style={{ color: T.tx, fontFamily: T.mo, fontWeight: 700, fontSize: 14 }}>{nextLabel}</div>
          </div>
        )}
        {!fin && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => adj(-30)}
              style={{ background: T.hi, border: "1px solid "+T.bo, borderRadius: 10,
                padding: "11px 14px", fontFamily: T.fn, fontWeight: 700, fontSize: 13, color: T.mu, cursor: "pointer" }}>-30s</button>
            <button onClick={() => dRef.current()}
              style={{ background: T.ac, border: "none", borderRadius: 10, padding: "11px 0",
                fontFamily: T.fn, fontWeight: 700, fontSize: 14, color: "#fff", cursor: "pointer", flex: 1 }}>Skip Rest</button>
            <button onClick={() => adj(30)}
              style={{ background: T.hi, border: "1px solid "+T.bo, borderRadius: 10,
                padding: "11px 14px", fontFamily: T.fn, fontWeight: 700, fontSize: 13, color: T.mu, cursor: "pointer" }}>+30s</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── WELCOME SCREEN ───────────────────────────────────────────────────────────
const Welcome = ({ onCustom, onProven, onChallenge, onBrowse }) => (
  <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", padding:"0 24px" }}>
    <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", paddingTop:60 }}>

      {/* Wordmark */}
      <div style={{ marginBottom:36 }}>
        <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:32, color:T.tx, letterSpacing:-1 }}>SALGO</div>
        <div style={{ color:T.ac, fontSize:12, fontFamily:T.fn, fontWeight:700, letterSpacing:2, marginTop:2 }}>TRAIN SMARTER</div>
      </div>

      <h1 style={{ fontFamily:T.fn, fontWeight:800, fontSize:30, color:T.tx, lineHeight:1.2, marginBottom:12 }}>
        Your program.<br /><span style={{ color:T.ac }}>Your results.</span>
      </h1>
      <p style={{ color:T.mu, fontSize:14, lineHeight:1.65, fontFamily:T.fn, marginBottom:32 }}>
        Custom-built plans, proven frameworks, or a quick challenge — all in one place.
      </p>

      {/* Challenge Generator card */}
      <div onClick={onChallenge}
        style={{ background:"linear-gradient(135deg,"+T.rd+"18,"+T.rd+"06)",
          border:"1.5px solid "+T.rd+"40", borderRadius:16, padding:"18px 20px",
          marginBottom:10, cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:T.rd,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#fff"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:16, color:T.tx, marginBottom:3 }}>Challenge Generator</div>
            <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, lineHeight:1.4 }}>EMOM, AMRAP and interval challenges in seconds</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.rd} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>

      {/* Workout Library card */}
      <div onClick={onBrowse}
        style={{ background:"linear-gradient(135deg,"+T.pu+"18,"+T.pu+"06)",
          border:"1.5px solid "+T.pu+"40", borderRadius:16, padding:"18px 20px",
          marginBottom:10, cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:T.pu,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="#fff"/>
              <rect x="13" y="3" width="8" height="8" rx="2" fill="#fff"/>
              <rect x="3" y="13" width="8" height="8" rx="2" fill="#fff"/>
              <rect x="13" y="13" width="8" height="8" rx="2" fill="#fff"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:16, color:T.tx, marginBottom:3 }}>Workout Library</div>
            <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, lineHeight:1.4 }}>Pick any single workout from any program</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.pu} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>

      {/* Custom Program card */}
      <div onClick={onCustom}
        style={{ background:T.su, border:"1.5px solid "+T.bo, borderRadius:16, padding:"18px 20px",
          marginBottom:10, cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:T.ac+"20",
            border:"1px solid "+T.ac+"30",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill={T.ac}/>
              <path d="M2 17l10 5 10-5" stroke={T.ac} strokeWidth="2" strokeLinecap="round"/>
              <path d="M2 12l10 5 10-5" stroke={T.ac} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:16, color:T.tx, marginBottom:3 }}>Build My Program</div>
            <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, lineHeight:1.4 }}>Tailored to your goals, equipment and schedule</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.mu} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>

      {/* Proven Programs card */}
      <div onClick={onProven}
        style={{ background:T.su, border:"1.5px solid "+T.bo, borderRadius:16, padding:"18px 20px", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:T.yw+"20",
            border:"1px solid "+T.yw+"30",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={T.yw}/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:16, color:T.tx, marginBottom:3 }}>Proven Programs</div>
            <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, lineHeight:1.4 }}>17 battle-tested frameworks from beginner to elite</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.mu} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>

    </div>
    <div style={{ paddingBottom:36, textAlign:"center" }}>
      <span style={{ color:T.di, fontSize:11, fontFamily:T.fn }}>16 programs · Rest timers · Progress tracking · Built-in timers</span>
    </div>
  </div>
);

// ─── ONBOARDING QUESTIONS ─────────────────────────────────────────────────────
const Qs = [
  { id:"equipment", q:"What equipment do you have?", opts:[
    {v:"barbell",    l:"Barbell & Rack",  e:"&#127947;", d:"Full barbell setup"},
    {v:"dumbbells",  l:"Dumbbells Only",  e:"&#128170;", d:"Fixed or adjustable"},
    {v:"bodyweight", l:"No Equipment",    e:"&#129336;", d:"Bodyweight only"},
    {v:"full_gym",   l:"Full Gym",        e:"&#127999;", d:"Commercial gym"},
  ]},
  { id:"days", q:"How many days per week?", opts:[
    {v:"3", l:"3 Days", e:"&#128197;", d:"Mon/Wed/Fri"},
    {v:"4", l:"4 Days", e:"&#128197;", d:"Upper/lower split"},
    {v:"5", l:"5 Days", e:"&#128197;", d:"High frequency"},
    {v:"6", l:"6 Days", e:"&#128197;", d:"Maximum volume"},
  ]},
  { id:"goal", q:"What is your primary goal?", opts:[
    {v:"strength",  l:"Get Stronger",          e:"&#128165;", d:"Bigger numbers"},
    {v:"muscle",    l:"Build Muscle",           e:"&#128170;", d:"More size"},
    {v:"fat_loss",  l:"Lose Fat",               e:"&#128293;", d:"Conditioning"},
    {v:"athletic",  l:"Athletic Performance",  e:"&#9889;",   d:"Power and speed"},
  ]},
  { id:"level", q:"Your training experience?", opts:[
    {v:"beginner",     l:"Beginner",     e:"&#127807;", d:"Under 1 year"},
    {v:"intermediate", l:"Intermediate", e:"&#128200;", d:"1-3 years"},
    {v:"advanced",     l:"Advanced",     e:"&#127942;", d:"3+ years"},
  ]},
  { id:"time", q:"How long per session?", opts:[
    {v:"30", l:"30 min", e:"&#9889;",   d:"Short & efficient"},
    {v:"45", l:"45 min", e:"&#127919;", d:"Focused work"},
    {v:"60", l:"60 min", e:"&#128170;", d:"Full session"},
    {v:"90", l:"90 min", e:"&#128293;", d:"Full volume"},
  ]},
];

const Questions = ({ onDone, onBack }) => {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState({});
  const q = Qs[step];
  const pick = v => {
    const na = { ...ans, [q.id]: v };
    setAns(na);
    if (step < Qs.length - 1) setStep(s => s + 1);
    else onDone(na);
  };
  return (
    <div style={{ minHeight: "100vh", padding: "52px 20px 40px" }}>
      <BackBtn onClick={step === 0 ? onBack : () => setStep(s => s - 1)} label={step === 0 ? "Back" : "Previous"} />
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: T.mu, fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: T.fn }}>QUESTION {step+1} OF {Qs.length}</span>
          <span style={{ color: T.ac, fontSize: 11, fontFamily: T.fn, fontWeight: 700 }}>{Math.round(step / Qs.length * 100)}%</span>
        </div>
        <PBar val={step} max={Qs.length} color={T.ac} h={3} />
      </div>
      <h2 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 24, color: T.tx, margin: "0 0 24px", lineHeight: 1.2 }}>{q.q}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.opts.map(o => (
          <div key={o.v} onClick={() => pick(o.v)}
            style={{ background: ans[q.id] === o.v ? T.acd : T.su,
              border: "1.5px solid " + (ans[q.id] === o.v ? T.ac+"60" : T.bo),
              borderRadius: 14, padding: "16px 18px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0,
              background: ans[q.id] === o.v ? T.ac : T.bo,
              border: "2px solid " + (ans[q.id] === o.v ? T.ac : T.di) }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 15, color: T.tx, marginBottom: 2 }}>{o.l}</div>
              <div style={{ color: T.mu, fontSize: 12, fontFamily: T.fn }}>{o.d}</div>
            </div>
            {ans[q.id] === o.v && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
                <circle cx="12" cy="12" r="10" fill={T.ac}/>
                <path d="M7 12l4 4 6-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── GENERATING SCREEN ────────────────────────────────────────────────────────
// ─── AI PROGRAM GENERATION ───────────────────────────────────────────────────
const SALGO_SYSTEM_PROMPT = `You are an expert strength and conditioning coach with 20 years of programming experience. Your only job is to generate a personalized training program in strict JSON format based on user inputs.

You must respond with ONLY a valid JSON object. No markdown. No code fences. No explanation. No preamble. No trailing text. The response must begin with { and end with } and be parseable by JSON.parse() without any transformation.

---

INPUT FORMAT

You will receive a JSON object with these exact fields:

{
  "equipment": "barbell" | "dumbbells" | "bodyweight" | "full_gym",
  "days": "3" | "4" | "5" | "6",
  "goal": "strength" | "muscle" | "fat_loss" | "athletic",
  "level": "beginner" | "intermediate" | "advanced",
  "time": "30" | "45" | "60" | "90"
}

---

OUTPUT FORMAT

You must return exactly this structure:

{
  "programName": string,
  "tagline": string,
  "color": string,
  "workouts": [WorkoutObject]
}

WorkoutObject:
{
  "name": string,
  "tag": string,
  "tagColor": string,
  "weekLabel": string,
  "exercises": [ExerciseObject]
}

ExerciseObject:
{
  "name": string,
  "isMain": boolean,
  "note": string,
  "sets": [SetObject],
  "ss": null | "A" | "B" | "C"
}

SetObject:
{
  "reps": string,
  "weight": number,
  "isAmrap": boolean
}

---

FIELD RULES

programName: 2-4 words. Strong and confident. Never use generic names like "Custom Program".
tagline: 1 sentence under 12 words describing the program philosophy.
color: Exactly one of these hex values based on goal:
  strength: "#0EA86A"
  muscle: "#9B7FE8"
  fat_loss: "#F06060"
  athletic: "#2DD4A0"

workouts array: Length must equal the number in the days field. Do NOT include rest days.
tag: Uppercase abbreviation, max 5 characters.
tagColor: One of: "#0EA86A" "#9B7FE8" "#2DD4A0" "#F5A623" "#F06060" "#F97316" "#F472B6" "#7EC8FF". Vary across workouts.
weekLabel: Always exactly "Week N - [workout name]". The letter N is literal. Never replace it.

exercises: Count must respect the time field:
  30 min → 3-4 exercises. 45 min → 4-5 exercises. 60 min → 5-6 exercises. 90 min → 6-8 exercises.
  Every workout must have exactly 1-2 exercises with isMain: true (primary compound movements only).

note: Required. Never empty. Format: "4x8" or "3xMax" or "3x45s" or "3x10 — superset with [partner name]".
  Add progression cue for main lifts: "Add 5 lbs when all reps completed cleanly".

sets array: Length must match the number in the note field exactly. e.g. "4x8" = 4 set objects.
reps: String. Standard: "8". AMRAP: "Max". Timed: "45s".
weight: Number in lbs, rounded to nearest 5. Bodyweight = 0 always.
isAmrap: true only for AMRAP sets or final backoff sets taken near failure.

ss field:
  null = straight set.
  "A" = paired with another "A" exercise in same workout (back to back, no rest between).
  "B" = paired with another "B" exercise.
  Rules: Main lifts always have ss: null. Every "A" must have exactly one "A" partner. Max 2 supersets per workout.
  When using ss, add "— superset with [partner name]" to note of both exercises.

---

WEIGHT BASELINES (working weight = 75-85% of 1RM, rounded to nearest 5)

Beginner: Squat 95→75lbs, Bench 65→50lbs, Deadlift 115→90lbs, OHP 45→35lbs, DB Press 25/hand, DB Row 30/hand
Intermediate: Squat 185→145lbs, Bench 135→105lbs, Deadlift 225→175lbs, OHP 95→75lbs, DB Press 45/hand, DB Row 55/hand
Advanced: Squat 275→215lbs, Bench 205→160lbs, Deadlift 315→250lbs, OHP 135→105lbs, DB Press 65/hand, DB Row 75/hand

---

EQUIPMENT CONSTRAINTS (hard rules)

bodyweight: Push-ups, pull-ups, dips, air squats, lunges, jump squats, burpees, mountain climbers, plank, sit-ups, pike push-ups, Bulgarian split squat only. Weight 0 always.
dumbbells: Any dumbbell + bodyweight movement. No barbells.
barbell: Barbell, dumbbell, and bodyweight movements. No machines.
full_gym: Any movement including cables and machines.

---

PROGRAMMING RULES BY GOAL

strength: Rep ranges 3-6 main lifts, 6-10 accessories. 3-5 sets. No supersets on main lifts. Progressive overload cues required.
muscle: Rep ranges 8-15. 3-5 sets. Supersets on accessories encouraged. Balance push/pull.
fat_loss: Rep ranges 10-20. Superset most exercises. Compound movements that elevate heart rate. Note short rest periods.
athletic: Mix power (3-5 reps), hypertrophy (8-12), conditioning (15-20). Include explosive movements where equipment allows.

---

LEVEL CALIBRATION

beginner: 3-4 exercises per session. Simple movement patterns only. No Olympic lifts. All sets same weight.
intermediate: Full movement range. Progressive loading across sets allowed. Supersets allowed.
advanced: Full complexity. Progressive loading within sessions. AMRAP on final working sets (isAmrap: true).

---

VALIDATION — CHECK BEFORE RESPONDING

1. workouts array length equals the days field value
2. Every workout has 1-2 exercises with isMain: true
3. Every ss:"A" exercise has exactly one ss:"A" partner in same workout
4. No main compound lift has ss other than null
5. All weights divisible by 5
6. Bodyweight exercises have weight: 0 in every set
7. sets array length matches number in note (e.g. "4x8" = 4 set objects)
8. weekLabel is exactly "Week N - [workout name]"
9. Response is valid JSON with no trailing commas
10. color is exactly one of the 4 goal hex values`;

const Generating = ({ answers, onDone }) => {
  const [si, setSi]       = useState(0);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const msgs = [
    "Analyzing your profile...",
    "Selecting exercises...",
    "Building your program...",
    "Calculating weights...",
    "Finalizing sets and reps...",
    "Done!"
  ];

  const generate = async () => {
    setError(null);
    // Advance loading messages while API call runs
    let msgIdx = 0;
    const iv = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, msgs.length - 2); // stop at second-to-last
      setSi(msgIdx);
    }, 1200);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SALGO_SYSTEM_PROMPT,
          messages: [{ role: "user", content: JSON.stringify(answers) }],
        }),
      });

      if (!response.ok) throw new Error("API error " + response.status);

      const data = await response.json();
      const text = (data.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("");

      // Strip any accidental markdown fences
      const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      const program = JSON.parse(clean);

      // Validate minimum shape before accepting
      if (!program.programName || !Array.isArray(program.workouts) || program.workouts.length === 0) {
        throw new Error("Invalid program structure returned");
      }

      clearInterval(iv);
      setSi(msgs.length - 1);
      setTimeout(() => onDone(program), 400);

    } catch (err) {
      clearInterval(iv);
      console.error("Program generation failed:", err);
      // Fall back to local builder silently — user never sees the error
      const fallback = buildCustomProgram(answers);
      setSi(msgs.length - 1);
      setTimeout(() => onDone(fallback), 400);
    }
  };

  useEffect(() => { generate(); }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "0 40px", textAlign: "center" }}>
      <div style={{ marginBottom: 32, position: "relative" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid "+T.bo,
          borderTopColor: T.ac, animation: "spin 1s linear infinite" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill={T.ac}/>
            <path d="M2 17l10 5 10-5" stroke={T.ac} strokeWidth="2" strokeLinecap="round"/>
            <path d="M2 12l10 5 10-5" stroke={T.ac} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      <h2 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 24, color: T.tx, marginBottom: 10 }}>Building Your Program</h2>
      <p style={{ color: T.mu, fontSize: 15, fontFamily: T.fn, lineHeight: 1.6, marginBottom: 32 }}>{msgs[si]}</p>
      <div style={{ display: "flex", gap: 8 }}>
        {msgs.map((_, i) => (
          <div key={i} style={{ width: i <= si ? 24 : 6, height: 6, borderRadius: 3,
            background: i <= si ? T.ac : T.bo, transition: "all .4s" }} />
        ))}
      </div>
    </div>
  );
};

// ─── PROGRAM LIST ─────────────────────────────────────────────────────────────
// ─── WORKOUT LIBRARY ──────────────────────────────────────────────────────────
// Generates all unique workout types for a program for single-session use
const getLibraryWorkouts = (pid) => {
  const defaultMx = { squat:185, bench:135, deadlift:225, ohp:95 };
  const workouts = [];
  if (pid === "ironblocks") {
    const codes = [
      {code:"CT",wk:1,dow:1},{code:"L",wk:1,dow:2},{code:"BB",wk:1,dow:3},
      {code:"S",wk:1,dow:4},{code:"CA",wk:1,dow:5},
      {code:"BCH",wk:4,dow:1},{code:"BL",wk:4,dow:2},{code:"BBA",wk:4,dow:3},
      {code:"BAR",wk:4,dow:4},{code:"BSH",wk:4,dow:5},
    ];
    codes.forEach(({wk,dow}) => {
      const wo = buildWorkout(pid, defaultMx, wk, dow, 0);
      if (wo) workouts.push(wo);
    });
  } else {
    // Try dow 1-6, sc 0-5 to collect unique workout names
    const seen = new Set();
    for (let sc = 0; sc < 6; sc++) {
      for (let dow = 0; dow <= 6; dow++) {
        const wo = buildWorkout(pid, defaultMx, 1, dow, sc);
        if (wo && !seen.has(wo.name)) {
          seen.add(wo.name);
          workouts.push(wo);
        }
      }
    }
  }
  return workouts;
};

const WorkoutLibrary = ({ onDoWorkout, onBack, existMx }) => {
  const [openPid, setOpenPid] = useState(null);
  const [search, setSearch] = useState("");
  const mx = existMx && Object.values(existMx).some(v => v > 0) ? existMx : { squat:185, bench:135, deadlift:225, ohp:95 };

  const filtered = Object.values(PROG).filter(p =>
    search === "" || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", paddingBottom:40 }}>
      <div style={{ padding:"52px 20px 16px" }}>
        <BackBtn onClick={onBack} />
        <h1 style={{ fontFamily:T.fn, fontWeight:800, fontSize:26, color:T.tx, margin:"0 0 4px" }}>Workout Library</h1>
        <p style={{ color:T.mu, fontSize:13, margin:"0 0 16px", fontFamily:T.fn }}>Pick any single workout from any program.</p>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search programs..."
          style={{ width:"100%", background:T.hi, border:"1px solid "+T.bo, borderRadius:10,
            padding:"11px 14px", fontFamily:T.fn, fontSize:14, color:T.tx, outline:"none",
            boxSizing:"border-box", marginBottom:4 }} />
      </div>
      <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(p => {
          const isOpen = openPid === p.id;
          const workouts = isOpen ? getLibraryWorkouts(p.id) : [];
          return (
            <div key={p.id} style={{ background:T.su, border:"1px solid "+(isOpen ? p.color+"50" : T.bo),
              borderRadius:14, overflow:"hidden" }}>
              {/* Program header row */}
              <div onClick={() => setOpenPid(isOpen ? null : p.id)}
                style={{ padding:"16px 18px", cursor:"pointer", display:"flex",
                  justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:16, color:T.tx }}>{p.name}</div>
                  <div style={{ color:T.mu, fontSize:11, fontFamily:T.fn, marginTop:2 }}>
                    {p.freq} · {p.equip}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Badge ch={p.diff} color={p.color} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={T.mu} strokeWidth="2.5" strokeLinecap="round"
                    style={{ transform: isOpen ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>

              {/* Expanded workout list */}
              {isOpen && (
                <div style={{ borderTop:"1px solid "+T.bo }}>
                  {workouts.length === 0 && (
                    <div style={{ padding:"16px 18px", color:T.mu, fontSize:13, fontFamily:T.fn }}>
                      No workouts available for preview.
                    </div>
                  )}
                  {workouts.map((wo, i) => (
                    <div key={i} style={{ padding:"14px 18px",
                      borderBottom: i < workouts.length-1 ? "1px solid "+T.hi : "none" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:wo.tagColor || p.color, flexShrink:0 }} />
                          <div style={{ fontFamily:T.fn, fontWeight:700, fontSize:14, color:T.tx }}>{wo.name}</div>
                        </div>
                        <button onClick={() => onDoWorkout({
                            id: "lib_"+p.id+"_"+i,
                            date: new Date(),
                            dow: new Date().getDay(),
                            dayLabel: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()],
                            dayFull: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()],
                            weekNum: 1,
                            isRest: false,
                            workout: wo,
                          }, p.color)}
                          style={{ background:p.color+"18", border:"1px solid "+p.color+"40",
                            borderRadius:8, padding:"7px 14px", cursor:"pointer",
                            fontFamily:T.fn, fontWeight:700, fontSize:12, color:p.color,
                            flexShrink:0, marginLeft:12 }}>
                          Do It
                        </button>
                      </div>
                      {/* Main exercises with thumbnails */}
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap", paddingLeft:16, alignItems:"center" }}>
                        {(wo.exercises||[]).filter(e=>e.isMain).slice(0,4).map((ex,j) => (
                          <div key={j} style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <ExercisePhoto name={ex.name} size="thumb" />
                            <span style={{ color:T.mu, fontSize:11, fontFamily:T.fn }}>{ex.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProvenList = ({ onSelect, active, onBack, onBrowse }) => {
  const [f, setF] = useState("All");
  const filters = ["All","Beginner","Intermediate","Advanced","Strength","Muscle","Fat Loss"];
  const list = Object.values(PROG).filter(p => {
    if (f === "All") return true;
    if (["Beginner","Intermediate","Advanced"].includes(f)) return p.diff === f;
    return p.goal === f.replace(" ","_") || p.goal.replace("_"," ") === f;
  });
  const stars = n => "★".repeat(Math.floor(n)) + "☆".repeat(5 - Math.floor(n));
  return (
    <div style={{ minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ padding: "52px 20px 16px" }}>
        <BackBtn onClick={onBack} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div>
            <h1 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 26, color: T.tx, margin: "0 0 4px" }}>Proven Programs</h1>
            <p style={{ color: T.mu, fontSize: 13, margin: 0, fontFamily: T.fn }}>17 frameworks from beginner to elite.</p>
          </div>
          <button onClick={onBrowse}
            style={{ background:T.ac+"15", border:"1px solid "+T.ac+"40", borderRadius:10,
              padding:"8px 14px", cursor:"pointer", fontFamily:T.fn, fontWeight:700,
              fontSize:12, color:T.ac, flexShrink:0, marginTop:4 }}>
            Browse Workouts
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginTop:16 }}>
          {filters.map(fi => (
            <div key={fi} onClick={() => setF(fi)}
              style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                background: f === fi ? T.ac : T.hi, border: "1px solid " + (f === fi ? T.ac : T.bo),
                color: f === fi ? "#fff" : T.mu, fontSize: 12, fontFamily: T.fn, fontWeight: 700 }}>{fi}</div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map(p => (
          <div key={p.id} onClick={() => onSelect(p.id)}
            style={{ background: T.su, border: "1.5px solid " + (active === p.id ? p.color+"60" : T.bo),
              borderRadius: 14, padding: "18px 20px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
            {active === p.id && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: p.color }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 18, color: T.tx }}>{p.name}</div>
                <div style={{ color: T.mu, fontSize: 11, fontFamily: T.fn, marginBottom: 4 }}>{p.coach}</div>
                <span style={{ color: T.yw, fontSize: 12 }}>{stars(p.rating)}</span>
                <span style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}> {p.rating} ({(p.reviews/1000).toFixed(1)}k)</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                <Badge ch={p.diff} color={p.color} />
                {active === p.id && <Badge ch="ACTIVE" color={T.gr} />}
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              <Pill ch={p.freq} /><Pill ch={p.dur} /><Pill ch={p.equip} />
              {p.tags.map(t => <Pill key={t} ch={t} />)}
            </div>
            <p style={{ color: "#6E6C86", fontSize: 13, margin: 0, lineHeight: 1.5, fontFamily: T.fn }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PROGRAM DETAIL ───────────────────────────────────────────────────────────
const ProgramDetail = ({ pid, onBack, onActivate, existMx, isCustom, cdata }) => {
  const p = isCustom ? null : PROG[pid];
  const color = isCustom ? (cdata && cdata.color || T.ac) : (p && p.color || T.ac);
  const pname = isCustom ? (cdata && cdata.programName || "My Program") : (p && p.name || "");
  const [activeTab, setActiveTab] = useState(isCustom ? "setup" : "overview");
  const [mx, setMx] = useState(existMx || { squat:"", bench:"", deadlift:"", ohp:"" });
  const setM = (k, v) => setMx(m => ({ ...m, [k]: v }));
  const lifts = isCustom ? [] : (p && p.lifts || []);
  const canGo = isCustom || lifts.length === 0 || lifts.every(k => mx[k] && Number(mx[k]) > 0);
  const pMx = {};
  lifts.forEach(k => { pMx[k] = Number(mx[k]) || 135; });

  // Start date — default to next Monday
  const nextMonday = () => {
    const d = new Date(); d.setHours(0,0,0,0);
    const day = d.getDay();
    const toMon = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + toMon);
    return d.toISOString().split("T")[0];
  };
  const todayISO = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().split("T")[0]; };
  const [startDate, setStartDate] = useState(nextMonday());

  const firstDow = { wendler531:1, startingStrength:1, texasMethod:1, arnoldSplit:1, juggernaut:1, westside:1,
    fullbody:1, fivex5:1, ppl:1, upperlower:1, linprog:1, gvt:1, pyramid:1, circuit:1, hiit:1, periodized:1 };
  const sample = !isCustom && lifts.length > 0 && buildWorkout(pid, pMx, 1, firstDow[pid] || 1, 0);
  const lnames = { squat:"Back Squat", bench:"Bench Press", deadlift:"Deadlift", ohp:"Overhead Press" };
  const stars = n => "★".repeat(Math.floor(n)) + "☆".repeat(5 - Math.floor(n));

  const StartDatePicker = () => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 8 }}>
        START DATE
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {[
          { label: "Today", val: todayISO() },
          { label: "Next Monday", val: nextMonday() },
        ].map(opt => (
          <div key={opt.label} onClick={() => setStartDate(opt.val)}
            style={{ padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12,
              fontFamily: T.fn, fontWeight: 700,
              background: startDate === opt.val ? color+"20" : T.hi,
              border: "1px solid " + (startDate === opt.val ? color+"60" : T.bo),
              color: startDate === opt.val ? color : T.mu }}>
            {opt.label}
          </div>
        ))}
      </div>
      <input type="date" value={startDate} min={todayISO()}
        onChange={e => setStartDate(e.target.value)}
        style={{ width: "100%", background: T.hi, border: "1px solid " + T.bo, borderRadius: 10,
          padding: "12px 14px", fontFamily: T.fn, fontSize: 14, color: T.tx, outline: "none",
          colorScheme: "dark", boxSizing: "border-box" }} />
      <div style={{ color: T.di, fontSize: 11, fontFamily: T.fn, marginTop: 6 }}>
        {new Date(startDate + "T00:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ padding: "52px 20px 24px" }}>
        <BackBtn onClick={onBack} label={isCustom ? "Back" : "All Programs"} />
        <div style={{ height: 3, width: 40, background: color, borderRadius: 2, marginBottom: 14 }} />
        {!isCustom && p && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <Badge ch={p.diff} color={color} /><Pill ch={p.freq} /><Pill ch={p.dur} />
          </div>
        )}
        <h1 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 28, color: T.tx, margin: "0 0 3px" }}>{pname}</h1>
        <div style={{ color: T.mu, fontSize: 13, fontFamily: T.fn, marginBottom: isCustom ? 20 : 6 }}>
          {isCustom ? "Your AI-Generated Program" : (p && p.coach || "")}
        </div>
        {!isCustom && p && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            <span style={{ color: T.yw, fontSize: 13 }}>{stars(p.rating)}</span>
            <span style={{ color: T.mu, fontSize: 12, fontFamily: T.fn }}>{p.rating} ({(p.reviews/1000).toFixed(1)}k reviews)</span>
          </div>
        )}
        {!isCustom && (
          <div style={{ display: "flex", gap: 2, background: T.hi, borderRadius: 10, padding: 3, marginBottom: 22 }}>
            {["overview","setup"].map(t => (
              <div key={t} onClick={() => setActiveTab(t)}
                style={{ flex: 1, padding: "9px 0", textAlign: "center", borderRadius: 8,
                  background: activeTab === t ? T.su : "transparent", cursor: "pointer" }}>
                <span style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 13,
                  color: activeTab === t ? T.tx : T.mu }}>{t === "overview" ? "Overview" : "Set Up Program"}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "overview" && !isCustom && p && (
          <div>
            <Card style={{ marginBottom: 12 }}>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 14 }}>WEEKLY STRUCTURE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {p.struct.map((d, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center",
                      padding: "7px 10px", background: d.l === "REST" ? T.bg : T.hi,
                      borderRadius: 8, border: "1px solid " + (d.l === "REST" ? T.lo : T.bo) }}>
                      <span style={{ color: T.di, fontSize: 11, fontFamily: T.fn, fontWeight: 700, width: 26 }}>{d.d}</span>
                      <span style={{ color: d.l === "REST" ? T.di : T.tx, fontSize: 12, fontFamily: T.fn,
                        fontWeight: d.l === "REST" ? 400 : 600 }}>{d.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card style={{ marginBottom: 12 }}>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 14 }}>PHILOSOPHY</div>
                <p style={{ color: "#A8A6BE", fontSize: 13, lineHeight: 1.75, margin: 0, fontFamily: T.fn }}>{p.phil}</p>
              </div>
            </Card>
            <Btn ch="Set Up This Program" onClick={() => setActiveTab("setup")} color={color}
              style={{ width: "100%", padding: 15, borderRadius: 12, fontSize: 15 }} />
          </div>
        )}

        {(activeTab === "setup" || isCustom) && (
          <div>
            {isCustom ? (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 8 }}>YOUR PROGRAM</div>
                    {cdata && <p style={{ color: "#A8A6BE", fontSize: 13, lineHeight: 1.6, margin: "0 0 12px", fontFamily: T.fn }}>{cdata.tagline}</p>}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {cdata && (cdata.workouts || []).map((w, i) => (
                        <div key={i} style={{ background: T.hi, border: "1px solid "+T.bo, borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 13, color: T.tx }}>{w.name}</div>
                          <div style={{ color: T.mu, fontSize: 10, fontFamily: T.fn }}>{(w.exercises && w.exercises.length) || 0} exercises</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <StartDatePicker />
                <Btn ch="Activate My Program" onClick={() => onActivate({}, cdata, startDate)} color={color}
                  style={{ width: "100%", padding: 15, borderRadius: 12, fontSize: 15 }} />
              </>
            ) : (
              <>
                {lifts.length === 0 && (
                  <div style={{ background: T.gr+"10", border: "1px solid "+T.gr+"30", borderRadius: 10,
                    padding: 14, marginBottom: 16, color: T.gr, fontSize: 13, fontFamily: T.fn }}>
                    No 1RM required for this program. Activate to get started.
                  </div>
                )}
                {lifts.length > 0 && (
                  <div style={{ background: color+"0D", border: "1px solid "+color+"22",
                    borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
                    <span style={{ color, fontSize: 13, fontFamily: T.fn }}>Enter your 1-rep max. Weights are calculated automatically.</span>
                  </div>
                )}
                {lifts.map(k => (
                  <NumInput key={k} label={lnames[k] + " 1RM"} value={mx[k]}
                    onChange={v => setM(k, v)}
                    hint={k === "squat" ? "e.g. 225" : k === "bench" ? "e.g. 185" : k === "deadlift" ? "e.g. 315" : "e.g. 135"} />
                ))}
                {sample && lifts.some(k => mx[k] && Number(mx[k]) > 0) && (
                  <>
                    <Sep label="LIVE PREVIEW" />
                    <Card style={{ marginBottom: 16 }}>
                      <div style={{ padding: "14px 16px" }}>
                        {sample.exercises.filter(e => e.isMain).map((ex, i) => (
                          <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 14, color: T.tx, marginBottom: 8 }}>{ex.name}</div>
                            {ex.sets.map((s, j) => (
                              <div key={j} style={{ display: "grid", gridTemplateColumns: "26px 1fr 60px",
                                gap: 3, background: s.isAmrap ? "#D68FFF10" : T.hi,
                                border: "1px solid " + (s.isAmrap ? "#D68FFF30" : T.bo),
                                borderRadius: 8, padding: "8px 6px", marginBottom: 3 }}>
                                <span style={{ fontFamily: T.mo, fontSize: 12, color: T.mu, fontWeight: 700 }}>{j+1}</span>
                                <span style={{ fontFamily: T.mo, fontSize: 14, color: s.weight > 0 ? T.ac : T.di, fontWeight: 700 }}>{s.weight > 0 ? s.weight + " lbs" : "BW"}</span>
                                <span style={{ fontFamily: T.mo, fontSize: 13, color: s.isAmrap ? "#D68FFF" : T.tx, fontWeight: 700 }}>{s.reps}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </>
                )}
                <StartDatePicker />
                <Btn ch={canGo ? "Generate Calendar" : "Enter lifts to continue"}
                  onClick={() => canGo && onActivate(Object.fromEntries(lifts.map(k => [k, Number(mx[k]) || 0])), null, startDate)}
                  disabled={!canGo} color={color}
                  style={{ width: "100%", padding: 15, borderRadius: 12, fontSize: 15 }} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TODAY SCREEN ─────────────────────────────────────────────────────────────
const Today = ({ cal, pname, pcolor, logs, onStart }) => {
  const color = pcolor || T.ac;
  const name = pname || "My Program";
  const ts = todayStr();
  const safeCal = cal || [];
  const todayDay = safeCal.find(d => d.date.toDateString() === ts);
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const nextW = safeCal.find(d => !d.isRest && !logs[d.id] && d.date >= todayMidnight);
  const wd = safeCal.filter(d => d.workout);
  const done = wd.filter(d => logs[d.id]).length;
  const wk = todayDay && todayDay.weekNum;
  const tw = safeCal.filter(d => d.weekNum === wk);
  const twDone = tw.filter(d => d.workout && logs[d.id]).length;
  const twTot = tw.filter(d => d.workout).length;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
      <div style={{ padding: "52px 20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gr }} />
              <span style={{ color: T.mu, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn }}>STRENGTH.OS</span>
            </div>
            <h1 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 22, color: T.tx, margin: 0 }}>{name}</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: T.mo, fontWeight: 700, fontSize: 24, color }}>{Math.round(done / Math.max(wd.length, 1) * 100)}%</div>
            <div style={{ color: T.mu, fontSize: 9, fontFamily: T.fn, fontWeight: 700 }}>COMPLETE</div>
          </div>
        </div>
        <PBar val={done} max={wd.length} color={color} />
        <div style={{ display: "flex", gap: 20, marginTop: 8, marginBottom: 26 }}>
          <span><span style={{ color: T.ac, fontFamily: T.mo, fontWeight: 700 }}>{done}</span><span style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}> done</span></span>
          <span><span style={{ color: T.yw, fontFamily: T.mo, fontWeight: 700 }}>{twDone}/{twTot}</span><span style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}> this week</span></span>
        </div>

        {todayDay && !todayDay.isRest && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn, marginBottom: 8 }}>TODAY</div>
            <div style={{ background: logs[todayDay.id] ? T.grd : color+"12",
              border: "1.5px solid " + (logs[todayDay.id] ? T.gr+"50" : color+"50"),
              borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ marginBottom: 6 }}><Badge ch={todayDay.workout.tag} color={todayDay.workout.tagColor || color} /></div>
                  <div style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 20, color: T.tx }}>{todayDay.workout.name}</div>
                  <div style={{ color: T.mu, fontSize: 12, fontFamily: T.fn, marginTop: 3 }}>{todayDay.workout.weekLabel}</div>
                </div>
                {logs[todayDay.id] && <span style={{ fontSize: 28 }}>&#9989;</span>}
              </div>
              {todayDay.workout.exercises.filter(e => e.isMain).map((ex, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <ExercisePhoto name={ex.name} size="thumb" />
                      <span style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 13, color: T.tx }}>{ex.name}</span>
                    </div>
                    <span style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}>{ex.sets.length} sets</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {ex.sets.map((s, j) => (
                      <div key={j} style={{ background: T.su, border: "1px solid " + (s.isAmrap ? "#D68FFF40" : T.bo),
                        borderRadius: 7, padding: "5px 8px", textAlign: "center" }}>
                        <div style={{ fontFamily: T.mo, fontWeight: 700, fontSize: 11,
                          color: s.isAmrap ? "#D68FFF" : s.weight > 0 ? T.ac : T.mu }}>{s.weight > 0 ? s.weight : "BW"}</div>
                        <div style={{ fontFamily: T.fn, fontSize: 9, color: T.mu, marginTop: 1 }}>{s.reps}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Btn ch={logs[todayDay.id] ? "Log Again" : "Start Workout"}
                onClick={() => onStart(todayDay)} color={logs[todayDay.id] ? T.gr : color}
                style={{ width: "100%", padding: 13, borderRadius: 10, fontSize: 14, marginTop: 8 }} />
            </div>
          </div>
        )}

        {todayDay && todayDay.isRest && (
          <Card style={{ marginBottom: 16, padding: 22, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>&#128564;</div>
            <div style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 18, color: T.tx, marginBottom: 4 }}>Rest Day</div>
            <div style={{ color: T.mu, fontSize: 13, fontFamily: T.fn }}>Recovery is training. Come back stronger.</div>
          </Card>
        )}

        {!todayDay && nextW && (
          <Card style={{ marginBottom: 16, padding: "18px 20px", textAlign: "center" }}>
            <div style={{ marginBottom: 10, display:"flex", justifyContent:"center" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" fill={T.ac+"20"} stroke={T.ac} strokeWidth="1.5"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke={T.ac} strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke={T.ac} strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="9" x2="21" y2="9" stroke={T.ac} strokeWidth="1.5"/>
              </svg>
            </div>
            <div style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 16, color: T.tx, marginBottom: 4 }}>
              Program starts {nextW.dayFull}, {nextW.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div style={{ color: T.mu, fontSize: 13, fontFamily: T.fn }}>Your first workout is queued up below. You can start it early anytime.</div>
          </Card>
        )}

        {nextW && (!todayDay || nextW.date.toDateString() !== ts) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn, marginBottom: 8 }}>
              {todayDay && !todayDay.isRest ? "NEXT UP" : "UP NEXT"}
            </div>
            <div onClick={() => onStart(nextW)}
              style={{ background: color+"0E", border: "1.5px solid "+color+"40", borderRadius: 14,
                padding: "18px 20px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <Pill ch={nextW.dayFull} />
                    <Pill ch={nextW.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <Badge ch={nextW.workout.tag} color={nextW.workout.tagColor || color} />
                  </div>
                  <div style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 18, color: T.tx }}>{nextW.workout.name}</div>
                  <div style={{ color: T.mu, fontSize: 12, fontFamily: T.fn, marginTop: 3 }}>{nextW.workout.weekLabel}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: color+"18",
                  border: "1px solid "+color+"40", display: "flex", alignItems: "center",
                  justifyContent: "center", color, flexShrink: 0, fontSize: 20 }}>&#9654;</div>
              </div>
              {nextW.workout.exercises.filter(e => e.isMain).map((ex, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 13, color: T.tx }}>{ex.name}</span>
                    <span style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}>{ex.sets.length} sets</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {ex.sets.slice(0, 4).map((s, j) => (
                      <div key={j} style={{ background: T.su, border: "1px solid "+T.bo, borderRadius: 7, padding: "5px 8px", textAlign: "center" }}>
                        <div style={{ fontFamily: T.mo, fontWeight: 700, fontSize: 11, color: s.weight > 0 ? T.ac : T.mu }}>{s.weight > 0 ? s.weight : "BW"}</div>
                        <div style={{ fontFamily: T.fn, fontSize: 9, color: T.mu, marginTop: 1 }}>{s.reps}</div>
                      </div>
                    ))}
                    {ex.sets.length > 4 && <div style={{ background: T.su, border: "1px solid "+T.bo, borderRadius: 7, padding: "5px 8px", display: "flex", alignItems: "center" }}><span style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}>+{ex.sets.length - 4}</span></div>}
                  </div>
                </div>
              ))}
              <Btn ch="Start Workout" onClick={() => onStart(nextW)} color={color}
                style={{ width: "100%", padding: 13, borderRadius: 10, fontSize: 14, marginTop: 10 }} />
            </div>
          </div>
        )}

        <Sep />
        <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn, marginBottom: 8 }}>THIS WEEK</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {tw.map(d => {
            const isDone = !!logs[d.id];
            const isTdy = d.date.toDateString() === ts;
            return (
              <div key={d.id} onClick={() => d.workout && onStart(d)}
                style={{ borderRadius: 9, border: "1px solid " + (isDone ? T.gr+"50" : isTdy ? color+"60" : T.bo),
                  background: isDone ? T.grd : isTdy ? color+"12" : T.su,
                  cursor: d.workout ? "pointer" : "default", padding: "8px 3px", textAlign: "center" }}>
                <div style={{ fontSize: 8, color: T.di, fontFamily: T.fn, fontWeight: 700, marginBottom: 2 }}>{d.dayLabel}</div>
                <div style={{ fontSize: 13, color: isDone ? T.gr : isTdy ? color : T.tx, fontFamily: T.mo, fontWeight: 700, marginBottom: 1 }}>
                  {isDone ? "✓" : d.isRest ? "–" : d.date.getDate()}
                </div>
                {d.workout && <div style={{ fontSize: 8, color: d.workout.tagColor || color, fontFamily: T.fn, fontWeight: 700 }}>{d.workout.tag}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── CALENDAR SCREEN ──────────────────────────────────────────────────────────
const CalView = ({ cal, pname, pcolor, logs, onSelect }) => {
  const color = pcolor || T.ac;
  const safeCal = cal || [];
  const wd = safeCal.filter(d => d.workout);
  const done = wd.filter(d => logs[d.id]).length;
  const ts = todayStr();
  const weeks = safeCal.reduce((a, d) => { if (!a[d.weekNum]) a[d.weekNum] = []; a[d.weekNum].push(d); return a; }, {});
  return (
    <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
      <div style={{ padding: "52px 20px 14px" }}>
        <h1 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 22, color: T.tx, margin: "0 0 4px" }}>{pname || "My Program"}</h1>
        <PBar val={done} max={wd.length} color={color} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}>{done}/{wd.length} sessions</span>
          <span style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}>{Math.ceil(safeCal.length / 7)} weeks</span>
        </div>
      </div>
      {Object.entries(weeks).map(([wk, wds]) => (
        <div key={wk}>
          <div style={{ padding: "10px 20px 6px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: T.di, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn }}>WEEK {wk}</span>
            <div style={{ height: 1, flex: 1, background: T.lo }} />
          </div>
          <div style={{ padding: "0 20px 6px", display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
            {wds.map(d => {
              const isDone = !!logs[d.id];
              const isTdy = d.date.toDateString() === ts;
              return (
                <div key={d.id} onClick={() => d.workout && onSelect(d)}
                  style={{ borderRadius: 7, border: "1px solid " + (isDone ? T.gr+"50" : isTdy ? color+"60" : T.lo),
                    background: isDone ? T.grd : isTdy ? color+"12" : T.su,
                    cursor: d.workout ? "pointer" : "default", padding: "5px 2px", textAlign: "center",
                    opacity: (!isTdy && d.date > new Date() && !isDone) ? 0.5 : 1 }}>
                  <div style={{ fontSize: 7, color: T.di, fontFamily: T.fn, fontWeight: 700 }}>{d.dayLabel}</div>
                  <div style={{ fontSize: 11, color: isDone ? T.gr : isTdy ? color : T.tx, fontFamily: T.mo, fontWeight: 700, margin: "2px 0 1px" }}>
                    {isDone ? "✓" : d.isRest ? "–" : d.date.getDate()}
                  </div>
                  {d.workout && <div style={{ fontSize: 7, color: d.workout.tagColor || color, fontFamily: T.fn, fontWeight: 700 }}>{d.workout.tag.slice(0,4)}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 5 }}>
            {wds.filter(d => d.workout).map(d => {
              const isDone = !!logs[d.id];
              const isTdy = d.date.toDateString() === ts;
              return (
                <div key={d.id} onClick={() => onSelect(d)}
                  style={{ background: isDone ? T.grd : isTdy ? color+"10" : T.su,
                    border: "1px solid " + (isDone ? T.gr+"40" : isTdy ? color+"40" : T.bo),
                    borderRadius: 12, padding: "12px 15px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 5, marginBottom: 5, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}>{d.dayFull}</span>
                        <Badge ch={d.workout.tag} color={d.workout.tagColor || color} />
                        {isTdy && <Badge ch="TODAY" color={color} />}
                      </div>
                      <div style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 14, color: T.tx, marginBottom: 2 }}>{d.workout.name}</div>
                      <div style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}>{d.workout.exercises.filter(e => e.isMain).map(e => e.name).join(" · ")}</div>
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: 9,
                      background: isDone ? T.gr+"18" : T.acd,
                      border: "1px solid " + (isDone ? T.gr+"50" : T.acb),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: isDone ? T.gr : T.ac, flexShrink: 0, marginLeft: 8 }}>
                      {isDone ? "✓" : "▶"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── WORKOUT SCREEN ───────────────────────────────────────────────────────────
const Workout = ({ day, pcolor, onComplete, onBack }) => {
  const color = pcolor || T.ac;
  const [completedSets, setCompletedSets] = useState({});
  const [notes, setNotes] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [rest, setRest] = useState(null);
  const total = day.workout.exercises.reduce((s, e) => s + e.sets.length, 0);
  const done = Object.values(completedSets).filter(Boolean).length;

  const tapSet = (ei, si, ex) => {
    const key = ei + "_" + si;
    const nowDone = !completedSets[key];
    setCompletedSets(p => ({ ...p, [key]: nowDone }));
    if (nowDone) {
      const exercises = day.workout.exercises;
      // If this exercise is the A side of a superset (next exercise shares same ss group),
      // skip the rest timer — user goes straight into the B exercise
      const nextEx = exercises[ei + 1];
      const isSupSetA = ex.ss && nextEx && nextEx.ss === ex.ss;
      if (isSupSetA) return; // no rest between A and B

      const info = exInfo(ex.name);
      let nextLabel = null;
      if (si + 1 < ex.sets.length) {
        const ns = ex.sets[si + 1];
        // If B side, next round means going back to A
        const partnerEx = ex.ss && exercises[ei - 1] && exercises[ei - 1].ss === ex.ss
          ? exercises[ei - 1] : null;
        nextLabel = partnerEx
          ? "Round " + (si + 2) + " — back to " + partnerEx.name
          : "Set " + (si + 2) + " — " + (ns.weight > 0 ? ns.weight + " lbs" : "BW") + " x " + ns.reps;
      } else {
        const ne = exercises[ei + 1];
        nextLabel = ne ? "Next: " + ne.name : "Last set — finish strong!";
      }
      setRest({ exName: ex.ss ? ex.name + " + pair" : ex.name, initSec: info.r, nextLabel, ts: Date.now() });
    } else {
      setRest(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 100 }}>
      {drawer && <ExDrawer ex={drawer} color={color} onClose={() => setDrawer(null)} />}
      {rest && (
        <RestTimer key={rest.ts} exName={rest.exName} initSec={rest.initSec}
          nextLabel={rest.nextLabel} onDone={() => setRest(null)} />
      )}
      <div style={{ padding: "52px 20px 20px" }}>
        <BackBtn onClick={onBack} />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          <Pill ch={day.dayFull} />
          <Pill ch={day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
        </div>
        <h1 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 22, color: T.tx, margin: "0 0 3px" }}>{day.workout.name}</h1>
        <div style={{ color: T.mu, fontSize: 12, fontFamily: T.fn, marginBottom: 16 }}>{day.workout.weekLabel}</div>
        <PBar val={done} max={total} color={done === total ? T.gr : color} />
        <div style={{ color: T.mu, fontSize: 11, fontFamily: T.fn, marginTop: 4, marginBottom: 20 }}>
          {done}/{total} sets{done === total ? " — All done!" : ""}
        </div>

        {(() => {
          // Group exercises into blocks: consecutive same-ss exercises become supersets
          const exercises = day.workout.exercises;
          const blocks = [];
          let i = 0;
          while (i < exercises.length) {
            const ex = exercises[i];
            if (ex.ss) {
              // Collect ALL consecutive exercises sharing the same ss tag — handles 2, 3, 4, 5-exercise groups
              const group = [], groupIdxs = [];
              while (i < exercises.length && exercises[i].ss === ex.ss) {
                group.push(exercises[i]);
                groupIdxs.push(i);
                i++;
              }
              blocks.push({ type:"superset", exs:group, idxs:groupIdxs });
            } else {
              blocks.push({ type:"single", ex, idx: i });
              i++;
            }
          }

          return blocks.map((block, bi) => {
            if (block.type === "single") {
              const { ex, idx: ei } = block;
              return (
                <div key={bi} style={{ marginBottom: 22 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 10 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10, flex:1, cursor:"pointer" }} onClick={() => setDrawer(ex)}>
                      <ExercisePhoto name={ex.name} size="thumb" />
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ fontFamily:T.fn, fontWeight:700, fontSize:15, color:T.tx }}>{ex.name}</span>
                          <span style={{ color:T.ac, fontSize:13, opacity:0.7 }}>&#9432;</span>
                        </div>
                        {ex.note && <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, marginTop:2 }}>{ex.note}</div>}
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                      {ex.isMain && <Badge ch="MAIN" color={color} />}
                      <span onClick={() => setDrawer(ex)} style={{ color:T.di, fontSize:10, fontFamily:T.fn, cursor:"pointer", background:T.hi, border:"1px solid "+T.bo, borderRadius:5, padding:"2px 8px", whiteSpace:"nowrap" }}>Rest {fmt(exInfo(ex.name).r)}</span>
                    </div>
                  </div>
                  {ex.sets.map((s, si) => {
                    const key = ei+"_"+si;
                    const isDone = !!completedSets[key];
                    const isAmrap = s.isAmrap || String(s.reps).includes("+");
                    return (
                      <div key={si} onClick={() => tapSet(ei, si, ex)}
                        style={{ display:"grid", gridTemplateColumns:"26px 1fr 60px 30px", gap:4, alignItems:"center",
                          background: isDone ? (isAmrap ? T.yw+"10" : T.grd) : T.hi,
                          border:"1px solid "+(isDone ? (isAmrap ? T.yw+"40" : T.gr+"40") : T.bo),
                          borderRadius:9, padding:"9px 6px", cursor:"pointer", marginBottom:3 }}>
                        <span style={{ fontFamily:T.mo, fontSize:12, fontWeight:700, color:isDone ? T.gr : T.mu }}>{si+1}</span>
                        <span style={{ fontFamily:T.mo, fontSize:14, fontWeight:700, color:isDone ? T.gr : s.weight > 0 ? T.ac : T.di }}>{s.weight > 0 ? s.weight+" lbs" : "BW"}</span>
                        <span style={{ fontFamily:T.mo, fontSize:13, fontWeight:700, color:isAmrap ? "#D68FFF" : isDone ? T.gr : T.tx }}>{s.reps}</span>
                        <div style={{ width:20, height:20, borderRadius:"50%", background:isDone ? T.gr+"20" : T.su, border:"1.5px solid "+(isDone ? T.gr : T.bo), display:"flex", alignItems:"center", justifyContent:"center", color:isDone ? T.gr : T.di, fontSize:10 }}>{isDone ? "✓" : ""}</div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Superset block
            const { exs, idxs } = block;
            const ssColor = T.or;
            const GRP_LABELS = ["A","B","C","D","E","F"];
            const isGiant = exs.length > 2;
            const maxRest = Math.max(...exs.map(e => exInfo(e.name).r));
            return (
              <div key={bi} style={{ marginBottom: 22, border:"1.5px solid "+ssColor+"35", borderRadius:14, overflow:"hidden" }}>
                <div style={{ background:ssColor+"12", padding:"8px 14px", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:ssColor }} />
                  <span style={{ color:ssColor, fontSize:10, fontWeight:800, letterSpacing:1.5, fontFamily:T.fn }}>{isGiant ? "GIANT SET" : "SUPERSET"}</span>
                  <span style={{ color:T.mu, fontSize:10, fontFamily:T.fn }}>
                    {isGiant
                      ? "— " + GRP_LABELS.slice(0,exs.length).join(" → ") + " with no rest, rest after each round"
                      : "— do A then B with no rest between, rest after each round"}
                  </span>
                </div>
                <div style={{ padding:"12px 14px" }}>
                  {exs.map((ex, xi) => {
                    const ei = idxs[xi];
                    return (
                      <div key={xi} style={{ marginBottom: xi < exs.length - 1 ? 0 : 0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                          <div style={{ flex:1, cursor:"pointer" }} onClick={() => setDrawer(ex)}>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <div style={{ width:20, height:20, borderRadius:6, background:ssColor+"20", border:"1px solid "+ssColor+"40", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.mo, fontSize:11, fontWeight:800, color:ssColor, flexShrink:0 }}>{GRP_LABELS[xi]}</div>
                              <ExercisePhoto name={ex.name} size="thumb" />
                              <span style={{ fontFamily:T.fn, fontWeight:700, fontSize:14, color:T.tx }}>{ex.name}</span>
                              <span style={{ color:T.ac, fontSize:12, opacity:0.7 }}>&#9432;</span>
                            </div>
                          </div>
                          {ex.isMain && <Badge ch="MAIN" color={color} />}
                        </div>
                        {Array.from({length: ex.sets.length}).map((_, si) => {
                          const s = ex.sets[si];
                          const key = ei+"_"+si;
                          const isDone = !!completedSets[key];
                          const isAmrap = s.isAmrap || String(s.reps).includes("+");
                          return (
                            <div key={si} onClick={() => tapSet(ei, si, ex)}
                              style={{ display:"grid", gridTemplateColumns:"26px 1fr 60px 30px", gap:4, alignItems:"center",
                                background: isDone ? (isAmrap ? T.yw+"10" : T.grd) : T.hi,
                                border:"1px solid "+(isDone ? (isAmrap ? T.yw+"40" : T.gr+"40") : T.bo),
                                borderRadius:9, padding:"9px 6px", cursor:"pointer", marginBottom:3 }}>
                              <span style={{ fontFamily:T.mo, fontSize:12, fontWeight:700, color:isDone ? T.gr : T.mu }}>{si+1}</span>
                              <span style={{ fontFamily:T.mo, fontSize:14, fontWeight:700, color:isDone ? T.gr : s.weight > 0 ? T.ac : T.di }}>{s.weight > 0 ? s.weight+" lbs" : "BW"}</span>
                              <span style={{ fontFamily:T.mo, fontSize:13, fontWeight:700, color:isAmrap ? "#D68FFF" : isDone ? T.gr : T.tx }}>{s.reps}</span>
                              <div style={{ width:20, height:20, borderRadius:"50%", background:isDone ? T.gr+"20" : T.su, border:"1.5px solid "+(isDone ? T.gr : T.bo), display:"flex", alignItems:"center", justifyContent:"center", color:isDone ? T.gr : T.di, fontSize:10 }}>{isDone ? "✓" : ""}</div>
                            </div>
                          );
                        })}
                        {xi < exs.length - 1 && (
                          <div style={{ display:"flex", alignItems:"center", gap:8, margin:"10px 0 10px" }}>
                            <div style={{ height:1, flex:1, background:ssColor+"25" }} />
                            <span style={{ color:ssColor, fontSize:10, fontWeight:700, fontFamily:T.fn }}>then {GRP_LABELS[xi+1]}</span>
                            <div style={{ height:1, flex:1, background:ssColor+"25" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ background:ssColor+"0A", border:"1px solid "+ssColor+"20", borderRadius:8, padding:"8px 12px", marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="8" fill={T.pu}/><path d="M12 9v4l2.5 2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                    <span style={{ color:T.mu, fontSize:12, fontFamily:T.fn }}>Rest {fmt(maxRest)} after completing {isGiant ? "all " + exs.length + " exercises" : "both A + B"}</span>
                  </div>
                </div>
              </div>
            );
          });
        })()}

        <Sep label="SESSION NOTES" />
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="PRs, how it felt, notes for next session..."
          style={{ width: "100%", background: T.hi, border: "1px solid "+T.bo, borderRadius: 10,
            padding: "12px 14px", fontFamily: T.fn, fontSize: 13, resize: "none",
            outline: "none", minHeight: 80, lineHeight: 1.6 }} />
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 440, padding: "14px 20px",
        background: "linear-gradient(to top, #0A0A0F 55%, transparent)", zIndex: 50 }}>
        <Btn ch={done === total ? "Complete Workout" : "Log Workout (" + done + "/" + total + ")"}
          onClick={() => onComplete({ sets: completedSets, notes, date: new Date().toISOString() })}
          color={done === total ? T.gr : color}
          style={{ width: "100%", padding: 14, fontSize: 14, borderRadius: 12 }} />
      </div>
    </div>
  );
};

// ─── PROGRESS SCREEN ──────────────────────────────────────────────────────────
const Progress = ({ logs, cal, pname, pcolor, maxes, onUpdateMaxes }) => {
  const color = pcolor || T.ac;
  const safeCal = cal || [];
  const cd = safeCal.filter(d => logs[d.id] && d.workout);
  const wt2 = safeCal.filter(d => d.workout).length;
  const pct = wt2 ? Math.round(cd.length / wt2 * 100) : 0;
  const lnames = { squat:"Squat", bench:"Bench Press", deadlift:"Deadlift", ohp:"Overhead Press" };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const openEdit = () => {
    const init = {};
    if (maxes) Object.entries(maxes).forEach(([k,v]) => { if (v > 0) init[k] = String(v); });
    setDraft(init);
    setEditing(true);
  };
  const saveEdit = () => {
    const updated = {};
    Object.entries(draft).forEach(([k,v]) => { if (Number(v) > 0) updated[k] = Number(v); });
    onUpdateMaxes(updated);
    setEditing(false);
  };
  const hasMaxes = maxes && Object.values(maxes).some(v => v > 0);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
      {editing && (
        <>
          <div onClick={() => setEditing(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:200 }} />
          <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
            width:"100%", maxWidth:440, background:T.su, borderRadius:"22px 22px 0 0",
            zIndex:201, padding:"20px 22px 44px" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
              <div style={{ width:40, height:4, borderRadius:2, background:T.bo }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <h3 style={{ fontFamily:T.fn, fontWeight:800, fontSize:20, color:T.tx, margin:0 }}>Update 1RM Maxes</h3>
              <button onClick={() => setEditing(false)}
                style={{ background:T.hi, border:"1px solid "+T.bo, borderRadius:8, width:32, height:32,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:T.mu, cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
            <p style={{ color:T.mu, fontSize:13, fontFamily:T.fn, marginBottom:20, lineHeight:1.5 }}>
              Enter your new maxes. Future workouts will recalculate automatically. Completed sessions are preserved.
            </p>
            {maxes && Object.entries(maxes).filter(([,v]) => v > 0).map(([k]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ color:T.mu, fontSize:11, fontWeight:700, letterSpacing:0.8, fontFamily:T.fn }}>{lnames[k]}</span>
                  <span style={{ color:T.di, fontSize:11, fontFamily:T.fn }}>was {maxes[k]} lbs</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", background:T.hi,
                  border:"1px solid "+(draft[k] && Number(draft[k]) !== maxes[k] ? color+"60" : T.bo),
                  borderRadius:10, overflow:"hidden" }}>
                  <input type="number" value={draft[k] || ""} onChange={e => setDraft(d => ({...d, [k]:e.target.value}))}
                    placeholder={String(maxes[k])}
                    style={{ flex:1, background:"transparent", border:"none", outline:"none",
                      padding:"12px 14px", fontSize:20, fontFamily:T.mo, fontWeight:700, color:T.tx }} />
                  <span style={{ color:T.mu, fontSize:13, paddingRight:14, fontFamily:T.fn }}>lbs</span>
                </div>
                {draft[k] && Number(draft[k]) > 0 && Number(draft[k]) !== maxes[k] && (
                  <div style={{ marginTop:5, display:"flex", gap:12 }}>
                    {[["Training Max", wt(0.9, Number(draft[k])), T.ac],
                      ["Change", (Number(draft[k]) - maxes[k] > 0 ? "+" : "") + (Number(draft[k]) - maxes[k]) + " lbs",
                        Number(draft[k]) > maxes[k] ? T.gr : T.rd]].map(([label, val, c]) => (
                      <div key={label} style={{ background:T.bg, border:"1px solid "+T.bo, borderRadius:7,
                        padding:"5px 10px", display:"flex", gap:5, alignItems:"center" }}>
                        <span style={{ color:T.di, fontSize:10, fontFamily:T.fn }}>{label}:</span>
                        <span style={{ color:c, fontFamily:T.mo, fontWeight:700, fontSize:13 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <Btn ch="Cancel" onClick={() => setEditing(false)} ghost style={{ flex:1, padding:14, borderRadius:12 }} />
              <Btn ch="Save & Recalculate" onClick={saveEdit} color={color} style={{ flex:2, padding:14, borderRadius:12 }} />
            </div>
          </div>
        </>
      )}

      <div style={{ padding: "52px 20px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
          <h1 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 26, color: T.tx, margin: 0 }}>Progress</h1>
          {hasMaxes && (
            <button onClick={openEdit}
              style={{ background:color+"14", border:"1px solid "+color+"35", borderRadius:9,
                padding:"7px 13px", fontFamily:T.fn, fontWeight:700, fontSize:12,
                color, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              &#9998; Update Maxes
            </button>
          )}
        </div>
        <p style={{ color: T.mu, fontSize: 14, margin: "0 0 20px", fontFamily: T.fn }}>{pname || "My Program"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[{l:"Completed",v:cd.length,s:"sessions",c:T.ac},{l:"Done",v:pct+"%",s:"of program",c:T.yw},{l:"Remaining",v:wt2-cd.length,s:"sessions",c:T.mu}].map(stat => (
            <Card key={stat.l} style={{ padding: 16 }}>
              <div style={{ color: T.mu, fontSize: 9, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 5 }}>{stat.l.toUpperCase()}</div>
              <div style={{ fontFamily: T.mo, fontSize: 26, fontWeight: 700, color: stat.c }}>{stat.v}</div>
              <div style={{ color: T.mu, fontSize: 11, fontFamily: T.fn, marginTop: 2 }}>{stat.s}</div>
            </Card>
          ))}
        </div>
        <Card style={{ padding: "16px 18px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: T.mu, fontSize: 10, fontWeight: 700, fontFamily: T.fn }}>PROGRAM COMPLETION</span>
            <span style={{ color, fontFamily: T.mo, fontWeight: 700, fontSize: 13 }}>{pct}%</span>
          </div>
          <PBar val={cd.length} max={wt2} color={color} />
        </Card>
        {hasMaxes && (
          <Card style={{ padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn }}>YOUR 1RM VALUES</span>
              <button onClick={openEdit} style={{ background:"none", border:"none", color:color,
                fontSize:11, fontFamily:T.fn, fontWeight:700, cursor:"pointer", padding:0 }}>Update &#8599;</button>
            </div>
            {Object.entries(maxes).filter(([,v]) => v > 0).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid "+T.lo }}>
                <span style={{ color: T.tx, fontSize: 14, fontWeight: 600, fontFamily: T.fn }}>{lnames[k] || k}</span>
                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: T.di, fontSize: 9, fontFamily: T.fn }}>1RM</div>
                    <div style={{ color: T.mu, fontFamily: T.mo, fontWeight: 700 }}>{v} lbs</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: T.di, fontSize: 9, fontFamily: T.fn }}>TM (90%)</div>
                    <div style={{ color, fontFamily: T.mo, fontWeight: 700 }}>{wt(0.9, v)} lbs</div>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}
        <Sep label="RECENT SESSIONS" />
        {cd.length === 0
          ? <div style={{ textAlign: "center", color: T.mu, paddingTop: 20, fontFamily: T.fn }}>Complete your first workout to see history.</div>
          : cd.slice(-10).reverse().map(d => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "11px 14px", background: T.su, border: "1px solid "+T.gr+"25",
              borderRadius: 11, marginBottom: 5 }}>
              <div>
                <div style={{ color: T.tx, fontWeight: 600, fontSize: 14, fontFamily: T.fn }}>{d.workout && d.workout.name}</div>
                <div style={{ color: T.mu, fontSize: 11, fontFamily: T.fn }}>{d.dayFull} - Week {d.weekNum}</div>
              </div>
              <span style={{ color: T.gr, fontSize: 18 }}>&#10003;</span>
            </div>
          ))}
      </div>
    </div>
  );
};

// ─── SHARED SOUND HOOK ────────────────────────────────────────────────────────
const useSound = () => {
  const [soundOn, setSoundOn] = useState(true);
  const ctxRef = useRef(null);
  const getCtx = () => {
    if (!ctxRef.current) {
      try { ctxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctxRef.current;
  };
  const tone = (freq, dur, vol = 0.45, delay = 0, type = "sine") => {
    if (!soundOn) return;
    const ctx = getCtx(); if (!ctx) return;
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      const t0 = ctx.currentTime + delay;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.start(t0); o.stop(t0 + dur + 0.05);
    } catch(e) {}
  };
  // Bell: layered sine waves with long exponential decay — sounds like a boxing bell
  const beepBell = (delay = 0) => {
    if (!soundOn) return;
    const ctx = getCtx(); if (!ctx) return;
    // Fundamental + 2nd + 3rd partial with different decay rates
    [[880, 1.4, 0.5], [1320, 0.9, 0.25], [1760, 0.5, 0.12]].forEach(([f, dur, vol]) => {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = f;
        const t0 = ctx.currentTime + delay;
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.start(t0); o.stop(t0 + dur + 0.05);
      } catch(e) {}
    });
  };
  const beepGo    = (d=0) => { beepBell(d); };
  const beepRest  = (d=0) => tone(440, 0.22, 0.4, d);
  const beepTick  = (d=0) => tone(660, 0.10, 0.35, d);
  const beepDone  = ()    => { tone(880,0.15,0.5,0); tone(1100,0.15,0.5,0.2); tone(1320,0.3,0.5,0.45); };
  return { soundOn, setSoundOn, beepBell, beepGo, beepRest, beepTick, beepDone };
};

// ─── TIMERS ───────────────────────────────────────────────────────────────────
const Timers = () => {
  const [mode, setMode] = useState(null);
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState("work");
  const [countdown, setCountdown] = useState(null);
  const [done, setDone] = useState(false);
  const ivRef = useRef(null);
  const { soundOn, setSoundOn, beepBell, beepGo, beepRest, beepTick, beepDone } = useSound();

  const [cfg, setCfg] = useState({
    tabata:    { work:20, rest:10, rounds:8 },
    emom:      { work:40, rest:20, rounds:10 },
    amrap:     { total:600 },
    forTime:   { total:1200 },
    countdown: { total:180 },
    stopwatch: { total:0 },
  });

  const MODES = [
    {id:"tabata",    name:"Tabata",    desc:"20s work / 10s rest",        emoji:"&#9889;",   color:T.rd},
    {id:"emom",      name:"EMOM",      desc:"Every minute on the minute", emoji:"&#128257;", color:T.ac},
    {id:"amrap",     name:"AMRAP",     desc:"As many rounds as possible", emoji:"&#128293;", color:T.or},
    {id:"forTime",   name:"For Time",  desc:"Race the clock",             emoji:"&#9201;",   color:T.yw},
    {id:"countdown", name:"Countdown", desc:"Count down from set time",   emoji:"&#9203;",   color:T.pu},
    {id:"stopwatch", name:"Stopwatch", desc:"Count up from zero",         emoji:"&#128336;", color:T.gr},
  ];

  const stopTimer = () => { clearInterval(ivRef.current); setRunning(false); };
  const initTime = id => {
    const c = cfg[id];
    setDone(false); setCountdown(null);
    if (id === "tabata" || id === "emom") { setTime(c.work); setPhase("work"); setRound(1); }
    else if (id === "stopwatch") setTime(0);
    else setTime(c.total);
  };
  const startMode = id => { setMode(id); setRunning(false); initTime(id); };
  const reset = () => { stopTimer(); if (mode) initTime(mode); };

  const triggerCountdown = (accentColor) => {
    setCountdown(3); beepTick(0);
    setTimeout(() => { setCountdown(2); beepTick(); }, 1000);
    setTimeout(() => { setCountdown(1); beepTick(); }, 2000);
    setTimeout(() => setCountdown(null), 3000);
  };

  const handleStart = () => {
    if (running) { stopTimer(); return; }
    beepBell();
    setRunning(true);
  };

  useEffect(() => {
    if (!running || !mode) return;
    ivRef.current = setInterval(() => {
      setTime(t => {
        if (mode === "stopwatch") return t + 1;
        // Fire 3-2-1 at t === 4
        if (t === 4) triggerCountdown();
        if (mode === "tabata" || mode === "emom") {
          if (t <= 1) {
            setPhase(ph => {
              const c = cfg[mode];
              if (ph === "work") {
                beepRest();
                setTimeout(() => setTime(c.rest), 0);
                return "rest";
              }
              setRound(r => {
                const nr = r + 1;
                if (nr > c.rounds) {
                  clearInterval(ivRef.current); setRunning(false); setDone(true); beepDone();
                  return r;
                }
                return nr;
              });
              beepGo();
              setTimeout(() => setTime(c.work), 0);
              return "work";
            });
            return 0;
          }
          return t - 1;
        }
        if (t <= 0) {
          clearInterval(ivRef.current); setRunning(false); setDone(true); beepDone();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(ivRef.current);
  }, [running, mode, soundOn]);

  const isInt = mode === "tabata" || mode === "emom";
  const m = mode && MODES.find(x => x.id === mode);
  const dispColor = isInt ? (phase === "work" ? T.gr : T.rd) : (m && m.color || T.ac);

  const SoundToggle = () => (
    <button onClick={() => setSoundOn(s => !s)}
      style={{ background: soundOn ? T.gr+"18" : T.hi,
        border:"1px solid "+(soundOn ? T.gr+"50" : T.bo),
        borderRadius:8, padding:"5px 11px", cursor:"pointer",
        fontFamily:T.fn, fontSize:12, fontWeight:700,
        color: soundOn ? T.gr : T.mu, display:"flex", alignItems:"center", gap:5 }}>
      {soundOn ? "🔔" : "🔕"} {soundOn ? "On" : "Off"}
    </button>
  );

  const Slider = ({ field, label, min, max, step = 5, showTime = true }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: T.mu, fontSize: 12, fontFamily: T.fn, fontWeight: 700 }}>{label}</span>
        <span style={{ color: T.tx, fontSize: 14, fontFamily: T.mo, fontWeight: 700 }}>
          {showTime ? fmt(cfg[mode][field]) : cfg[mode][field]}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={cfg[mode][field]}
        onChange={e => setCfg(c => ({ ...c, [mode]: { ...c[mode], [field]: Number(e.target.value) } }))}
        style={{ width: "100%", accentColor: m && m.color || T.ac }} />
    </div>
  );

  const TIMER_ICONS = {
    tabata:    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={T.rd}/></svg>,
    emom:      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="8" fill={T.ac}/><path d="M12 9v4l2.5 2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M9 2h6" stroke={T.ac} strokeWidth="2.5" strokeLinecap="round"/></svg>,
    amrap:     <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={T.or}/></svg>,
    forTime:   <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill={T.yw}/><path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
    countdown: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" fill={T.pu}/><path d="M12 8v4l3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
    stopwatch: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="8" fill={T.gr}/><path d="M12 9v5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M9 2h6" stroke={T.gr} strokeWidth="2.5" strokeLinecap="round"/></svg>,
  };

  if (!mode) return (
    <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
      <div style={{ padding: "52px 20px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <h1 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 26, color: T.tx, margin: "0 0 4px" }}>Timers</h1>
            <p style={{ color: T.mu, fontSize: 14, margin: 0, fontFamily: T.fn }}>Tabata, EMOM, AMRAP and more.</p>
          </div>
          <SoundToggle />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {MODES.map(m2 => (
            <div key={m2.id} onClick={() => startMode(m2.id)}
              style={{ background: T.su, border: "1px solid "+T.bo, borderRadius: 14, padding: "18px 16px", cursor: "pointer" }}>
              <div style={{ marginBottom: 10 }}>{TIMER_ICONS[m2.id]}</div>
              <div style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 16, color: T.tx, marginBottom: 4 }}>{m2.name}</div>
              <div style={{ color: T.mu, fontSize: 11, fontFamily: T.fn, lineHeight: 1.4 }}>{m2.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
      {/* 3-2-1 countdown overlay */}
      {countdown !== null && (
        <div style={{ position:"fixed", inset:0, zIndex:300, pointerEvents:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(0,0,0,0.45)" }}>
          <div style={{ fontFamily:T.mo, fontWeight:700, color:"#fff",
            fontSize:160, lineHeight:1, letterSpacing:-4,
            textShadow:"0 0 60px "+dispColor+", 0 0 20px "+dispColor,
            animation:"pop 0.3s ease-out" }}>
            {countdown}
          </div>
        </div>
      )}
      <div style={{ padding: "52px 20px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <BackBtn onClick={() => { stopTimer(); setMode(null); setDone(false); setCountdown(null); }} label="All Timers" />
          <SoundToggle />
        </div>
        {!running && !done && (
          <Card style={{ padding: "18px 20px", marginBottom: 20 }}>
            <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 16 }}>CONFIGURE {m.name.toUpperCase()}</div>
            {mode === "tabata"   && <><Slider field="work" label="Work" min={5} max={60} /><Slider field="rest" label="Rest" min={5} max={60} /><Slider field="rounds" label="Rounds" min={1} max={20} step={1} showTime={false} /></>}
            {mode === "emom"     && <><Slider field="work" label="Work" min={10} max={55} /><Slider field="rest" label="Rest" min={5} max={50} /><Slider field="rounds" label="Minutes" min={5} max={30} step={1} showTime={false} /></>}
            {mode === "amrap"    && <Slider field="total" label="Time Cap" min={60} max={3600} step={60} />}
            {mode === "forTime"  && <Slider field="total" label="Time Cap" min={60} max={3600} step={60} />}
            {mode === "countdown"&& <Slider field="total" label="Duration" min={30} max={3600} step={30} />}
            {mode === "stopwatch"&& <p style={{ color: T.mu, fontSize: 13, fontFamily: T.fn, margin: 0 }}>Hit start and go.</p>}
          </Card>
        )}
        {isInt && !done && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <Badge ch={phase === "work" ? "WORK" : "REST"} color={dispColor} />
            <div style={{ color: T.mu, fontSize: 13, fontFamily: T.fn, marginTop: 6 }}>Round {round} of {cfg[mode].rounds}</div>
          </div>
        )}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontFamily: T.mo, fontSize: 80, fontWeight: 700,
            color: done ? T.gr : countdown !== null ? "#fff" : dispColor,
            lineHeight: 1, letterSpacing: -2, transition:"color 0.15s" }}>{fmt(time)}</div>
        </div>
        {done ? (
          <div style={{ textAlign:"center", marginBottom:16 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🏁</div>
            <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:20, color:T.gr, marginBottom:16 }}>Done!</div>
            <Btn ch="&#8635; Go Again" onClick={reset} color={m.color}
              style={{ width:"100%", padding:16, fontSize:16, borderRadius:12 }} />
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <Btn ch={running ? "Pause" : (mode === "stopwatch" || time < cfg[mode]?.total || round > 1 ? "Resume" : "▶ Start")}
              onClick={handleStart}
              color={running ? T.yw : dispColor} style={{ flex: 1, padding: 16, fontSize: 16, borderRadius: 12 }} />
            <Btn ch="Reset" onClick={reset} ghost style={{ padding: "16px 20px", fontSize: 14, borderRadius: 12 }} />
          </div>
        )}
        {isInt && !done && (
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {Array.from({length: Math.min(cfg[mode].rounds, 20)}).map((_, i) => (
              <div key={i} style={{ width: 16, height: 16, borderRadius: "50%",
                background: i < round-1 ? T.gr : i === round-1 ? dispColor : T.bo,
                border: "2px solid " + (i < round-1 ? T.gr : i === round-1 ? dispColor : T.di) }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── WOD ENGINE ───────────────────────────────────────────────────────────────

// Exercise database — 35 movements with equipment, pattern, Rx and scaling standards
const EX_DB = {
  // Push
  pushUp:      { n:"Push-Ups",              eq:[],              pat:"push",   rx:"Chest to deck, full lockout, hollow body",     sc:"Knee push-ups or box push-ups",             yt:"push up perfect form chest to floor" },
  pikePush:    { n:"Pike Push-Ups",         eq:[],              pat:"push",   rx:"Head to ground, hips stacked over hands",      sc:"Regular push-ups",                          yt:"pike push up form shoulder development" },
  hspu:        { n:"Handstand Push-Ups",    eq:[],              pat:"push",   rx:"Nose and toes to wall, full lockout",          sc:"Pike push-ups",                             yt:"handstand push up wall technique" },
  dip:         { n:"Dips",                  eq:["Pull-up bar"], pat:"push",   rx:"Full lockout, elbows at 0 deg",                sc:"Box dips",                                  yt:"dip form chest vs triceps lean" },
  dbPress:     { n:"DB Shoulder Press",     eq:["Dumbbells"],   pat:"push",   rx:"Strict press, full lockout overhead",          sc:"Seated DB press, lighter weight",           yt:"dumbbell shoulder press strict form" },
  dbIncline:   { n:"DB Incline Press",      eq:["Dumbbells"],   pat:"push",   rx:"45 degree bench, full extension",              sc:"Flat DB press",                             yt:"incline dumbbell press upper chest form" },
  // Pull
  pullUp:      { n:"Pull-Ups",              eq:["Pull-up bar"], pat:"pull",   rx:"Full hang to chin over bar",                   sc:"Ring rows or jumping pull-ups",             yt:"pull up dead hang full rom technique" },
  chinUp:      { n:"Chin-Ups",              eq:["Pull-up bar"], pat:"pull",   rx:"Full hang, supinated grip, chin over bar",     sc:"Banded chin-ups",                           yt:"chin up supinated grip bicep form" },
  ringRow:     { n:"Ring Rows",             eq:["Pull-up bar"], pat:"pull",   rx:"Horizontal body, chest to rings",              sc:"Elevate feet or bend knees",                yt:"ring row inverted row form progression" },
  t2b:         { n:"Toes-to-Bar",           eq:["Pull-up bar"], pat:"core",   rx:"Both feet touch bar simultaneously",           sc:"Knees-to-elbows or V-ups",                  yt:"toes to bar kip technique" },
  dbRow:       { n:"DB Bent-Over Row",      eq:["Dumbbells"],   pat:"pull",   rx:"Flat back, elbow past hip each rep",           sc:"Chest-supported row, lighter weight",       yt:"dumbbell row form lat engagement" },
  kbRow:       { n:"KB Single-Arm Row",     eq:["Kettlebells"], pat:"pull",   rx:"Flat back, bell to hip each rep",              sc:"Lighter KB",                                yt:"kettlebell single arm row form" },
  // Squat
  airSquat:    { n:"Air Squats",            eq:[],              pat:"squat",  rx:"Below parallel, full hip extension at top",    sc:"Box squat or assisted depth",               yt:"air squat full depth hip extension" },
  jumpSquat:   { n:"Jump Squats",           eq:[],              pat:"squat",  rx:"Full depth squat, max height jump, land soft", sc:"Air squats",                                yt:"jump squat explosive power soft landing" },
  lunge:       { n:"Walking Lunges",        eq:[],              pat:"squat",  rx:"Full step, back knee grazes floor, stand tall", sc:"Stationary reverse lunges",                yt:"walking lunge form front shin vertical" },
  boxJump:     { n:"Box Jumps",             eq:[],              pat:"squat",  rx:"24in 20in box, full hip extension at top",     sc:"Step-ups same height",                      yt:"box jump form soft landing full extension" },
  goblet:      { n:"KB Goblet Squat",       eq:["Kettlebells"], pat:"squat",  rx:"Full depth, elbows inside knees at bottom",    sc:"Lighter KB or air squat",                   yt:"goblet squat kettlebell depth form" },
  wallBall:    { n:"Wall Balls",            eq:[],              pat:"squat",  rx:"Full depth, hit 10 ft target every rep",       sc:"9 ft target or lighter ball",               yt:"wall ball shot form squat target" },
  splitSq:     { n:"Bulgarian Split Squat", eq:[],              pat:"squat",  rx:"Rear foot elevated, front knee over toe",      sc:"Stationary split squat",                    yt:"bulgarian split squat rear foot elevated form" },
  // Hinge
  rdl:         { n:"Romanian Deadlift",     eq:["Dumbbells"],   pat:"hinge",  rx:"Hinge to mid-shin, neutral spine throughout",  sc:"Reduce ROM, lighter DB",                    yt:"romanian deadlift RDL form hip hinge" },
  kbSwing:     { n:"KB Swings",             eq:["Kettlebells"], pat:"hinge",  rx:"American hips drive bell overhead",            sc:"Russian swing to eye level",                yt:"kettlebell swing american russian hips technique" },
  kbDL:        { n:"KB Deadlift",           eq:["Kettlebells"], pat:"hinge",  rx:"Full lockout, neutral spine",                  sc:"Lighter KB",                                yt:"kettlebell deadlift form neutral spine" },
  goodMorn:    { n:"Good Mornings",         eq:[],              pat:"hinge",  rx:"Hinge to parallel, flat back, slow descent",   sc:"Reduce range of motion",                    yt:"good morning exercise form hip hinge" },
  // Olympic / compound
  dbThruster:  { n:"DB Thrusters",          eq:["Dumbbells"],   pat:"olympic",rx:"Full squat depth plus full overhead one motion", sc:"Lighter DB or pause at bottom",            yt:"dumbbell thruster form squat press" },
  kbThruster:  { n:"KB Thrusters",          eq:["Kettlebells"], pat:"olympic",rx:"Full squat depth plus full overhead press",    sc:"Lighter KB",                                yt:"kettlebell thruster form clean press squat" },
  dbClean:     { n:"DB Hang Power Clean",   eq:["Dumbbells"],   pat:"olympic",rx:"From hang, explosive extension, stand tall",   sc:"Lighter DB, take from ground",              yt:"dumbbell hang power clean form" },
  sdhp:        { n:"KB Sumo DL High Pull",  eq:["Kettlebells"], pat:"olympic",rx:"Full extension, bell to chin, elbows high",   sc:"Lighter KB",                                yt:"sumo deadlift high pull kettlebell form" },
  dbSnatch:    { n:"DB Snatch",             eq:["Dumbbells"],   pat:"olympic",rx:"One arm, hip extension drives overhead",       sc:"Two-arm lighter DB",                        yt:"dumbbell snatch one arm technique" },
  // Core
  sitUp:       { n:"Sit-Ups",              eq:[],              pat:"core",   rx:"Full sit-up, shoulders past hips at top",      sc:"Crunches",                                  yt:"sit up proper form ab crunch" },
  vUp:         { n:"V-Ups",                eq:[],              pat:"core",   rx:"Straight legs, touch toes at top",             sc:"Tuck-ups or sit-ups",                       yt:"v up exercise form straight legs" },
  plank:       { n:"Plank Hold",           eq:[],              pat:"core",   rx:"Rigid hollow body, no hip sag or piking",      sc:"Knees on ground",                           yt:"plank form hollow body core" },
  mountain:    { n:"Mountain Climbers",    eq:[],              pat:"core",   rx:"Alternate knees fast, hips level",             sc:"Slow and controlled",                       yt:"mountain climbers hips level form" },
  rTwist:      { n:"Russian Twists",       eq:[],              pat:"core",   rx:"Feet elevated, rotate past midline each side", sc:"Feet on ground",                            yt:"russian twist core rotation form" },
  // Full body / conditioning
  burpee:      { n:"Burpees",              eq:[],              pat:"full",   rx:"Chest to deck, jump plus clap overhead",       sc:"Step-back burpee, no jump",                 yt:"burpee form chest to ground full extension" },
  burpeePU:    { n:"Burpee + Pull-Up",     eq:["Pull-up bar"], pat:"full",   rx:"Burpee directly into strict or kipping pull-up", sc:"Burpee plus jumping pull-up",              yt:"burpee pull up combination form" },
  dbBurpee:    { n:"DB Burpee",            eq:["Dumbbells"],   pat:"full",   rx:"Hands on DBs, full burpee, stand with DBs",    sc:"Lighter DBs, no jump",                      yt:"dumbbell burpee form variation" },
  du:          { n:"Double-Unders",        eq:[],              pat:"mono",   rx:"Rope passes twice per jump, consistent rhythm", sc:"3x single-unders",                         yt:"double unders jump rope technique timing" },
  sprint:      { n:"Sprint (100m)",        eq:[],              pat:"mono",   rx:"Max effort 100 meters",                        sc:"50m or reduce pace by 50%",                 yt:"sprint technique acceleration form 100m" },
};

// 15 WOD structure templates — each defines format, timing, rep scheme, description builders
const WOD_STRUCTURES = [
  {
    id:"triplet_219", fmt:"FOR TIME", label:"21-15-9", exCounts:[2,3],
    timeRange:[5,20],
    repFn:(exes,t,lvl)=>{
      const scheme = lvl==="Beginner"?[15,10,5]:lvl==="Advanced"?[30,20,10]:[21,15,9];
      return `For Time:\n${scheme.map(r=>exes.map(e=>`${r} ${e}`).join("\n")).join("\n—\n")}`;
    },
    howItWorks:"Classic descending triplet. Complete all reps of each movement at each round before moving to the next.",
    goal:"Finish as fast as possible. Every second counts.",
    scoreFn:()=>"Total time. Elite athletes finish sub-5 minutes.",
    tip:"Attack the first set like you only have one set. The rep drop gives you just enough recovery to hold on.",
  },
  {
    id:"five_rounds", fmt:"FOR TIME", label:"5 Rounds For Time", exCounts:[2,3],
    timeRange:[10,25],
    repFn:(exes,t,lvl)=>{
      const base=lvl==="Beginner"?7:lvl==="Advanced"?15:10;
      return `5 Rounds For Time:\n${exes.map((e,i)=>`${Math.max(base-i*2,5)} ${e}`).join("\n")}`;
    },
    howItWorks:"Five full rounds of the listed movements. Complete all reps before starting the next round.",
    goal:"Complete all 5 rounds as fast as possible.",
    scoreFn:()=>"Total time. Note your round split every rep.",
    tip:"If round 4 or 5 is 20% slower than round 1 you went out too hard. Find a pace you can hold.",
  },
  {
    id:"three_rounds", fmt:"FOR TIME", label:"3 Rounds For Time", exCounts:[2,3],
    timeRange:[5,15],
    repFn:(exes,t,lvl)=>{
      const base=lvl==="Beginner"?10:lvl==="Advanced"?20:15;
      return `3 Rounds For Time:\n${exes.map((e,i)=>`${Math.max(base-i*3,5)} ${e}`).join("\n")}`;
    },
    howItWorks:"Three rounds, full send. Short enough to push hard from the start.",
    goal:"Finish all 3 rounds as fast as possible.",
    scoreFn:()=>"Total time.",
    tip:"3 rounds rewards aggression. There's no fourth round — leave nothing in the tank.",
  },
  {
    id:"chipper", fmt:"FOR TIME", label:"Chipper", exCounts:[3,3],
    timeRange:[10,30],
    repFn:(exes,t,lvl)=>{
      const scheme=lvl==="Beginner"?[20,15,10]:lvl==="Advanced"?[50,40,30]:[40,30,20];
      return `For Time — Chipper:\n${scheme.map((r,i)=>`${r} ${exes[i]}`).join("\n")}\n\nComplete ALL reps of each movement before advancing.`;
    },
    howItWorks:"A chipper — long rep sets of three movements, done sequentially. No rounds — just chip through from top to bottom.",
    goal:"Get to the bottom of the list as fast as possible.",
    scoreFn:()=>"Total time. Score highest reps reached if time-capped.",
    tip:"Break the large sets early with planned rests. Hitting failure and resting longer costs you more time.",
  },
  {
    id:"pyramid", fmt:"FOR TIME", label:"Rep Pyramid", exCounts:[1,2],
    timeRange:[5,20],
    repFn:(exes,t,lvl)=>{
      const peak=lvl==="Beginner"?5:lvl==="Advanced"?10:7;
      const up=Array.from({length:peak},(_,i)=>i+1);
      const rnds=[...up,...up.slice(0,-1).reverse()];
      return `For Time — Pyramid:\n${rnds.map(r=>exes.map(e=>`${r} ${e}`).join(" + ")).join("\n")}\nTime cap: ${t} min`;
    },
    howItWorks:"Ascending then descending rep ladder. Each line is a round. Catch your breath at the peak.",
    goal:"Complete the full pyramid for time.",
    scoreFn:()=>"Total time, or highest rung reached if time-capped.",
    tip:"The descent is deceptive. Your muscles are pre-fatigued — keep moving rather than resting long.",
  },
  {
    id:"buy_in", fmt:"FOR TIME", label:"Buy-In / Cash-Out", exCounts:[3,3],
    timeRange:[10,20],
    repFn:(exes,t,lvl)=>{
      const n=lvl==="Beginner"?30:lvl==="Advanced"?75:50;
      const mid=Math.floor(t/2);
      return `For Time:\n${n} ${exes[0]}\n— THEN —\n${mid}-min AMRAP:\n  10 ${exes[1]}\n  15 ${exes[2]}\n— THEN —\n${n} ${exes[0]}\n\nTime cap: ${t} min`;
    },
    howItWorks:"Two bookend efforts bracket a central AMRAP. All three count toward your score.",
    goal:"Finish both bookends and maximize rounds in the AMRAP window.",
    scoreFn:()=>"Total time for bookends + AMRAP rounds in the middle.",
    tip:"Don't blow up on the buy-in. You have to cash out too — and the AMRAP will drain you first.",
  },
  {
    id:"ladder_asc", fmt:"FOR TIME", label:"Ascending Ladder", exCounts:[1,2],
    timeRange:[5,15],
    repFn:(exes,t,lvl)=>{
      const top=lvl==="Beginner"?8:lvl==="Advanced"?15:10;
      return `Ascending Ladder — For Time:\n${Array.from({length:top},(_,i)=>i+1).map(r=>exes.map(e=>`${r} ${e}`).join(" + ")).join("\n")}\nTime cap: ${t} min`;
    },
    howItWorks:"Start at 1 rep and add 1 each round. The cumulative reps compound fast.",
    goal:"Complete all rungs within the time cap.",
    scoreFn:()=>"Total time, or highest rung reached.",
    tip:"The last 3 rungs are harder than all previous rungs combined. Respect them.",
  },
  {
    id:"amrap_triplet", fmt:"AMRAP", label:"AMRAP Triplet", exCounts:[3,3],
    timeRange:[10,25],
    repFn:(exes,t,lvl)=>{
      const r=lvl==="Beginner"?[3,6,9]:lvl==="Advanced"?[7,14,21]:[5,10,15];
      return `${t}-Minute AMRAP:\n${r.map((v,i)=>`${v} ${exes[i]}`).join("\n")}`;
    },
    howItWorks:"As many rounds as possible in the time cap. Move continuously — rest only when form breaks.",
    goal:"Maximize complete rounds + additional reps.",
    scoreFn:(exes)=>`Rounds + partial reps. Example: 9 rounds + 8 ${exes[0]}.`,
    tip:"The 3-6-9 or 5-10-15 structure spaces your breathing. Use the lower-rep movement to recover.",
  },
  {
    id:"amrap_couplet", fmt:"AMRAP", label:"AMRAP Couplet", exCounts:[2,2],
    timeRange:[5,20],
    repFn:(exes,t,lvl)=>{
      const a=lvl==="Beginner"?8:lvl==="Advanced"?15:10;
      const b=lvl==="Beginner"?5:lvl==="Advanced"?10:7;
      return `${t}-Minute AMRAP:\n${a} ${exes[0]}\n${b} ${exes[1]}`;
    },
    howItWorks:"Simple couplet — two movements, max rounds. Every rep counts toward your score.",
    goal:"Maximize complete rounds + additional reps.",
    scoreFn:(exes)=>"Rounds + reps.",
    tip:"Find a pace you can hold from minute 1 to the final buzzer. Don't fade.",
  },
  {
    id:"emom_alt", fmt:"EMOM", label:"Alternating EMOM", exCounts:[2,3],
    timeRange:[10,20],
    repFn:(exes,t,lvl)=>{
      const base=lvl==="Beginner"?8:lvl==="Advanced"?15:12;
      return `${t}-Minute EMOM:\n${exes.map((e,i)=>`Min ${i+1}: ${Math.max(base-i*2,5)} ${e}`).join("\n")}\n\nCycle every ${exes.length} minutes.`;
    },
    howItWorks:"Every minute on the minute, complete the prescribed reps before the clock turns. Rest in whatever time remains.",
    goal:"Complete every minute without missing reps.",
    scoreFn:(exes,t)=>`Completed rounds out of ${Math.floor(t/(exes.length))}.`,
    tip:"If you have less than 10 seconds rest per minute, scale the reps down immediately.",
  },
  {
    id:"death_by", fmt:"EMOM", label:"Death By", exCounts:[1,1],
    timeRange:[10,20],
    repFn:(exes,t)=>`Death By ${exes[0]}\n\nMinute 1: 1 rep\nMinute 2: 2 reps\nMinute 3: 3 reps\n...\nAdd 1 rep each minute.\nTime cap: ${t} minutes`,
    howItWorks:"Start with 1 rep in minute 1. Add 1 rep per minute. When you can't complete the required reps before the minute ends, your workout ends.",
    goal:"Survive as many minutes as possible.",
    scoreFn:(exes)=>`Last completed minute. (E.g. Completed minute 12 = 78 total ${exes[0]}.)`,
    tip:"The first 5 minutes feel like nothing. Use every second of rest — you'll need it in the final minutes.",
  },
  {
    id:"max_reps", fmt:"MAX REPS", label:"Max Effort Sets", exCounts:[1,2],
    timeRange:[5,20],
    repFn:(exes,t,lvl)=>{
      const sets=t<=10?3:t<=15?4:5;
      const rest=t<=10?60:90;
      const target=lvl==="Beginner"?8:lvl==="Advanced"?20:12;
      return `${sets} Sets × Max Reps:\n${exes[0]}${exes[1]?`\nSuperset: ${Math.round(target*0.6)} ${exes[1]}`:"" }\n\nRest ${rest}s between sets.\nTarget: ${target}+ reps per set`;
    },
    howItWorks:"Push each set to 1-2 reps before complete failure. Record reps. Rest strictly.",
    goal:"Maximize total reps accumulated across all sets.",
    scoreFn:(exes,t)=>{const sets=t<=10?3:t<=15?4:5;return `Total reps across ${sets} sets.`;},
    tip:"Leave 2 reps in the tank on sets 1 and 2. They come back doubled in the final sets.",
  },
  {
    id:"tabata", fmt:"INTERVAL", label:"Tabata Protocol", exCounts:[1,2],
    timeRange:[4,16],
    repFn:(exes,t)=>{
      const rds=Math.floor(t/4)*8;
      return `Tabata — 20s on / 10s off\n${Math.floor(t/4)} blocks × 8 rounds = ${rds} total\n\n${exes.length===1?`Every round: ${exes[0]}`:`Odd rounds: ${exes[0]}\nEven rounds: ${exes[1]}`}`;
    },
    howItWorks:"20 seconds max effort, 10 seconds rest. Your SCORE is the LOWEST rep count across all rounds — not total reps.",
    goal:"Maintain consistent reps every round. Consistency beats a high first round.",
    scoreFn:()=>"Lowest single-round rep count. Penalizes blowing up early.",
    tip:"Set a pace you can hold for ALL 8 rounds from rep 1. Most people go out 30% too hard.",
  },
  {
    id:"intervals", fmt:"INTERVAL", label:"Work/Rest Intervals", exCounts:[1,2,3],
    timeRange:[5,30],
    repFn:(exes,t)=>{
      const w=t<=10?30:t<=20?40:45;
      const r=t<=10?15:20;
      const cycles=Math.floor(t*60/(w+r));
      return `${w}s on / ${r}s off — ${cycles} rounds\n\n${exes.length===1?`Every round: ${exes[0]}`:exes.map((e,i)=>`Round ${i+1} of each ${exes.length}: ${e}`).join("\n")}`;
    },
    howItWorks:"Max effort during every work interval. The short rest is intentional — it keeps intensity high.",
    goal:"Maintain consistent reps round-to-round. Avoid the blowup-and-recover cycle.",
    scoreFn:()=>"Total reps across all work intervals.",
    tip:"Don't look at the clock during rest. Take 2 full breaths and go. The rest is shorter than it feels.",
  },
  {
    id:"density", fmt:"DENSITY", label:"Density Block", exCounts:[1,2,3],
    timeRange:[5,20],
    repFn:(exes,t,lvl)=>{
      const bl=t<=10?t:Math.round(t/2);
      const blks=t<=10?1:2;
      const base=lvl==="Beginner"?6:lvl==="Advanced"?12:8;
      const ws=exes.map(e=>`${base} ${e}`).join("\n");
      return blks===2
        ?`Block 1 (${bl} min):\n${ws}\nMax rounds.\n\nRest 1 min.\n\nBlock 2 (${bl} min):\n${ws}\nBeat Block 1.`
        :`${bl}-Min Density Block:\n${ws}\nMax rounds.`;
    },
    howItWorks:"Complete the listed reps back-to-back for max rounds. Consistency over sprinting. Every unplanned rest break is a loss.",
    goal:"Maximize total complete rounds in the time block.",
    scoreFn:()=>"Total rounds. Beat this number next session.",
    tip:"Same pace every round beats sprinting and crashing. Density rewards athletes who never fully rest.",
  },
];

// Returns a YouTube search URL for any exercise name — checks EX_DB first, then EDB, then generic
const ytUrl = (name) => {
  // Sanitize: coerce to string, cap length, strip characters that could break a URL
  const safe = String(name || "").slice(0, 100).replace(/[<>"'`]/g, "").trim();
  if (!safe) return "https://www.youtube.com/results?search_query=exercise+form+tutorial";
  const exDbMatch = Object.values(EX_DB).find(e => e.n.toLowerCase() === safe.toLowerCase());
  if (exDbMatch && exDbMatch.yt) return "https://www.youtube.com/results?search_query=" + encodeURIComponent(exDbMatch.yt);
  const info = exInfo(safe);
  if (info.yt) return "https://www.youtube.com/results?search_query=" + info.yt;
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(safe + " exercise form tutorial");
};

// Exercise pool builder — filters to available equipment and focus
const getExPool = (form) => {
  const { focus, equipment } = form;
  const avail = Object.values(EX_DB).filter(ex =>
    ex.eq.length === 0 || ex.eq.some(e => equipment.includes(e))
  );
  const byPat = (pat) => avail.filter(e => e.pat === pat);
  // Return prioritized pool by focus
  if (focus === "Upper body") return [...byPat("push"), ...byPat("pull"), ...byPat("olympic"), ...byPat("core")];
  if (focus === "Lower body") return [...byPat("squat"), ...byPat("hinge"), ...byPat("olympic"), ...byPat("core")];
  if (focus === "Core")       return [...byPat("core"), ...byPat("pull"), ...byPat("full"), ...byPat("mono")];
  // Full body — smart ordering: compound first
  return [...byPat("olympic"), ...byPat("full"), ...byPat("squat"), ...byPat("push"), ...byPat("pull"), ...byPat("hinge"), ...byPat("core"), ...byPat("mono")];
};

// Smart exercise selection with movement variety enforcement
const selectExercises = (pool, count, primary) => {
  const exes = primary ? [primary] : [];
  // Avoid double-same-pattern — track used patterns
  const usedPatterns = new Set();
  const usedNames = new Set(exes.map(e => e.toLowerCase()));
  // Shuffle pool for randomness
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (const ex of shuffled) {
    if (exes.length >= count) break;
    if (usedNames.has(ex.n.toLowerCase())) continue;
    // For 3 exercises: enforce pattern variety
    if (count === 3 && usedPatterns.has(ex.pat) && usedPatterns.size < 3) continue;
    exes.push(ex.n);
    usedNames.add(ex.n.toLowerCase());
    usedPatterns.add(ex.pat);
  }
  // Safety fallback
  const fallbacks = ["Burpees","Air Squats","Push-Ups","Sit-Ups","Mountain Climbers"];
  let fi = 0;
  while (exes.length < count) { exes.push(fallbacks[fi++ % fallbacks.length]); }
  return exes.slice(0, count);
};

// WOD name generator — creates memorable original names
const WOD_ADJ  = ["Iron","Steel","Dark","Raw","Heavy","Cold","Grit","Stone","Forge","Sharp","Deep","Bare","Blunt","Stark"];
const WOD_NOUN = ["Gauntlet","Standard","Engine","Grind","Test","Edge","Cut","Drive","Trial","Circuit","Session","Block","Push","Burn"];
const genWodName = (structure, exes) => {
  if (structure.id === "death_by") return `Death By ${exes[0]}`;
  if (structure.id === "tabata")   return `${exes[0]} Tabata`;
  if (structure.fmt === "AMRAP")   return `The ${WOD_NOUN[Math.floor(Math.random()*WOD_NOUN.length)]}`;
  if (structure.fmt === "EMOM")    return `The ${WOD_ADJ[Math.floor(Math.random()*WOD_ADJ.length)]} ${WOD_NOUN[Math.floor(Math.random()*WOD_NOUN.length)]}`;
  const adj  = WOD_ADJ[Math.floor(Math.random() * WOD_ADJ.length)];
  const noun = WOD_NOUN[Math.floor(Math.random() * WOD_NOUN.length)];
  return `The ${adj} ${noun}`;
};

// ─── CHALLENGE GENERATOR ─────────────────────────────────────────────────────
const buildChallenge = (form) => {
  const { time, focus, level, equipment } = form;
  const t = Number(time);
  const exCount = Number(form.exerciseCount) || 2;
  const primary = form.exercise ? form.exercise.trim() : "";

  // Filter eligible structures by time range and exercise count
  const eligible = WOD_STRUCTURES.filter(s =>
    t >= s.timeRange[0] && t <= s.timeRange[1] &&
    s.exCounts.includes(exCount)
  );
  // Fallback — if nothing matches exactly, relax exercise count constraint
  const pool = eligible.length > 0 ? eligible : WOD_STRUCTURES.filter(s => t >= s.timeRange[0] && t <= s.timeRange[1]);
  const final = pool.length > 0 ? pool : WOD_STRUCTURES;

  // Weighted random — pick structure
  const structure = final[Math.floor(Math.random() * final.length)];

  // Get exercises
  const exPool = getExPool(form);
  const actualCount = structure.exCounts.includes(exCount) ? exCount : structure.exCounts[structure.exCounts.length - 1];
  const exes = selectExercises(exPool, actualCount, primary);

  // Build workout text
  const workout = structure.repFn(exes, t, level);

  // Runner format mapping — FOR TIME uses AMRAP runner (countdown + round counter)
  const fmtRunnerMap = { "FOR TIME":"AMRAP", "AMRAP":"AMRAP", "EMOM":"EMOM", "INTERVAL":"INTERVAL", "MAX REPS":"MAX REPS", "DENSITY":"DENSITY" };

  // Build Rx and Scaled standards per exercise
  const rxStandards   = exes.map(e => { const ex = Object.values(EX_DB).find(x => x.n === e); return ex ? `${e}: ${ex.rx}` : `${e}: Full range of motion`; });
  const scStandards   = exes.map(e => { const ex = Object.values(EX_DB).find(x => x.n === e); return ex ? `${e}: ${ex.sc}` : `${e}: Reduce load or ROM`; });

  return {
    name: genWodName(structure, exes),
    format: fmtRunnerMap[structure.fmt] || "AMRAP",
    displayFormat: structure.label,
    structureId: structure.id,
    timeCap: t + " minutes",
    workout,
    howItWorks: structure.howItWorks,
    goal: structure.goal,
    score: structure.scoreFn(exes, t),
    scaling: scStandards.join("\n"),
    advanced: rxStandards.join("\n"),
    tip: structure.tip,
    rx:     { label:"Rx",     standards: rxStandards },
    scaled: { label:"Scaled", standards: scStandards },
    exercises: exes,
  };
};

// ─── CHALLENGE RUNNER ─────────────────────────────────────────────────────────
const ChallengeRunner = ({ result, form, onBack }) => {
  const fmtType = result.format;
  const displayFmt = result.displayFormat || fmtType;
  const timeSec = Number(form.time) * 60;
  const isEMOM     = fmtType === "EMOM";
  const isInterval = fmtType === "INTERVAL";
  const isMaxReps  = fmtType === "MAX REPS";
  const isAmrap    = fmtType === "AMRAP";

  const workSec = Number(form.time) <= 10 ? 30 : 40;
  const restSec = Number(form.time) <= 10 ? 15 : 20;
  const totalIntervals = Math.floor(timeSec / (workSec + restSec));

  const [timerOn,  setTimerOn]  = useState(false);
  const [time,     setTime]     = useState(isEMOM ? 60 : isInterval ? workSec : timeSec);
  const [phase,    setPhase]    = useState("work");
  const [minute,   setMinute]   = useState(1);
  const [intNum,   setIntNum]   = useState(1);
  const [done,     setDone]     = useState(false);
  const [reps,     setReps]     = useState(0);
  const [setLog,   setSetLog]   = useState([]);
  const [rounds,   setRounds]   = useState(0);
  const [restOn,   setRestOn]   = useState(false);
  const [restSecs, setRestSecs] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const ivRef   = useRef(null);
  const restRef = useRef(null);
  const { soundOn, setSoundOn, beepBell, beepGo, beepRest, beepTick, beepDone } = useSound();

  const triggerCountdown = () => {
    setCountdown(3); beepTick(0);
    setTimeout(() => { setCountdown(2); beepTick(); }, 1000);
    setTimeout(() => { setCountdown(1); beepTick(); }, 2000);
    setTimeout(() => setCountdown(null), 3000);
  };

  const totalSetsMatch  = result.workout.match(/(\d+)\s*sets/);
  const totalSets       = totalSetsMatch ? Number(totalSetsMatch[1]) : 3;
  const restBetweenSets = result.workout.match(/(\d+)\s*seconds/) ? Number(result.workout.match(/(\d+)\s*seconds/)[1]) : 90;
  const exLines = result.workout.split("\n").filter(l => l.trim() && !l.includes("Target") && !l.includes("Repeat") && !l.includes("→")).slice(0,3);
  const currentMinuteEx = isEMOM ? exLines[(minute - 1) % Math.max(exLines.length, 2)] : null;

  // Main timer tick
  useEffect(() => {
    if (!timerOn) { clearInterval(ivRef.current); return; }
    ivRef.current = setInterval(() => {
      setTime(t => {
        // Fire countdown at t === 4
        if (t === 4) triggerCountdown();

        if (isEMOM) {
          if (t <= 1) {
            const nextMin = minute + 1;
            if (nextMin > Number(form.time)) {
              clearInterval(ivRef.current); setTimerOn(false); setDone(true);
              beepDone(); return 0;
            }
            setMinute(nextMin);
            beepGo();
            return 60;
          }
          return t - 1;
        }
        if (isInterval) {
          if (t <= 1) {
            if (phase === "work") {
              setPhase("rest"); beepRest(); return restSec;
            }
            const next = intNum + 1;
            if (next > totalIntervals) {
              clearInterval(ivRef.current); setTimerOn(false); setDone(true);
              beepDone(); return 0;
            }
            setIntNum(next); setPhase("work"); beepGo(); return workSec;
          }
          return t - 1;
        }
        if (t <= 1) {
          clearInterval(ivRef.current); setTimerOn(false); setDone(true);
          beepDone(); return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(ivRef.current);
  }, [timerOn, isEMOM, isInterval, phase, minute, intNum, soundOn]);

  // Rest-between-sets countdown for MAX REPS
  useEffect(() => {
    if (!restOn) { clearInterval(restRef.current); return; }
    restRef.current = setInterval(() => {
      setRestSecs(s => {
        if (s === 4) triggerCountdown();
        if (s <= 1) { clearInterval(restRef.current); setRestOn(false); beepGo(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(restRef.current);
  }, [restOn, soundOn]);

  const resetAll = () => {
    setTimerOn(false); setDone(false);
    setTime(isEMOM ? 60 : isInterval ? workSec : timeSec);
    setPhase("work"); setMinute(1); setIntNum(1);
    setReps(0); setSetLog([]); setRounds(0);
    setRestOn(false); setCountdown(null);
  };

  const logSet = () => {
    const newLog = [...setLog, { set: setLog.length + 1, reps }];
    setSetLog(newLog); setReps(0);
    if (isMaxReps && newLog.length < totalSets) { setRestSecs(restBetweenSets); setRestOn(true); }
    if (isMaxReps && newLog.length >= totalSets) { setDone(true); beepDone(); }
  };

  const fmtColors = { EMOM:T.ac, AMRAP:T.or, LADDER:T.pu, "MAX REPS":T.rd, INTERVAL:T.gr, DENSITY:T.yw };
  const color      = fmtColors[fmtType] || T.ac;
  const timerColor = isInterval ? (phase === "work" ? T.gr : T.rd) : color;
  const showRepCounter = fmtType !== "EMOM";
  const showLogSet = ["MAX REPS","LADDER","DENSITY","AMRAP","INTERVAL"].includes(fmtType);

  return (
    <div style={{ minHeight:"100vh", paddingBottom:90 }}>
      {/* 3-2-1 countdown overlay */}
      {countdown !== null && (
        <div style={{ position:"fixed", inset:0, zIndex:300, pointerEvents:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(0,0,0,0.45)" }}>
          <div style={{ fontFamily:T.mo, fontWeight:700, color:"#fff",
            fontSize:160, lineHeight:1, letterSpacing:-4,
            textShadow:"0 0 60px "+timerColor+", 0 0 20px "+timerColor,
            animation:"pop 0.3s ease-out" }}>
            {countdown}
          </div>
        </div>
      )}

      <div style={{ padding:"8px 20px 24px" }}>
        {/* Header row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:T.mu, cursor:"pointer",
            fontSize:13, fontFamily:T.fn, display:"flex", alignItems:"center", gap:6 }}>
            &#8592; Back
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={() => setSoundOn(s => !s)}
              style={{ background: soundOn ? T.gr+"18" : T.hi,
                border:"1px solid "+(soundOn ? T.gr+"50" : T.bo),
                borderRadius:8, padding:"5px 11px", cursor:"pointer",
                fontFamily:T.fn, fontSize:12, fontWeight:700,
                color: soundOn ? T.gr : T.mu, display:"flex", alignItems:"center", gap:5 }}>
              {soundOn ? "🔔" : "🔕"} Sound {soundOn ? "On" : "Off"}
            </button>
            <Badge ch={displayFmt} color={color} />
          </div>
        </div>

        <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:20, color:T.tx, marginBottom:4 }}>{result.name}</div>
        <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, marginBottom:16 }}>{result.timeCap} · {form.focus} · {form.level}</div>

        {/* Workout reference */}
        <Card style={{ padding:"12px 16px", marginBottom:16 }}>
          {exLines.map((l,i) => (
            <div key={i} style={{ color:i===0?T.tx:T.mu, fontSize:13, fontFamily:T.fn, lineHeight:1.6,
              fontWeight:i===0?700:400,
              borderLeft: isEMOM && (minute-1)%exLines.length===i ? "3px solid "+color : "3px solid transparent",
              paddingLeft:8 }}>{l}</div>
          ))}
        </Card>

        {/* EMOM: minute indicator */}
        {isEMOM && (
          <div style={{ textAlign:"center", marginBottom:12 }}>
            <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, marginBottom:4 }}>Minute {minute} of {form.time}</div>
            <div style={{ color, fontFamily:T.fn, fontWeight:700, fontSize:14 }}>{currentMinuteEx || exLines[0]}</div>
          </div>
        )}

        {/* INTERVAL: phase indicator */}
        {isInterval && (
          <div style={{ textAlign:"center", marginBottom:12 }}>
            <Badge ch={phase === "work" ? "WORK" : "REST"} color={timerColor} />
            <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, marginTop:6 }}>Interval {intNum} of {totalIntervals}</div>
          </div>
        )}

        {/* Main timer */}
        {!isMaxReps && (
          <div style={{ textAlign:"center", padding:"8px 0 16px", position:"relative" }}>
            <div style={{ fontFamily:T.mo, fontSize:80, fontWeight:700,
              color: done ? T.gr : countdown !== null ? "#fff" : timerColor,
              lineHeight:1, letterSpacing:-2,
              transition:"color 0.15s" }}>{fmt(time)}</div>
          </div>
        )}

        {/* MAX REPS: rest period */}
        {isMaxReps && restOn && (
          <div style={{ background:T.ac+"12", border:"1px solid "+T.ac+"30", borderRadius:14,
            padding:"16px", marginBottom:16, textAlign:"center" }}>
            <div style={{ color:T.mu, fontSize:10, fontWeight:700, letterSpacing:1.2, fontFamily:T.fn, marginBottom:8 }}>REST</div>
            <div style={{ fontFamily:T.mo, fontSize:64, fontWeight:700,
              color: countdown !== null ? timerColor : T.ac }}>{fmt(restSecs)}</div>
            <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, marginTop:4 }}>Set {setLog.length + 1} of {totalSets} coming up</div>
          </div>
        )}

        {/* Rep counter */}
        {showRepCounter && !restOn && !done && (
          <Card style={{ padding:"16px 20px", marginBottom:14 }}>
            <div style={{ color:T.mu, fontSize:10, fontWeight:700, letterSpacing:1.2, fontFamily:T.fn, marginBottom:12 }}>
              {isMaxReps ? `SET ${setLog.length + 1} OF ${totalSets} — REP COUNT` : "REP COUNT"}
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
              <button onClick={() => setReps(r => Math.max(0, r-1))}
                style={{ width:56, height:56, borderRadius:14, background:T.hi, border:"1px solid "+T.bo,
                  fontSize:28, color:T.mu, cursor:"pointer", fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
              <div style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontFamily:T.mo, fontSize:64, fontWeight:700, color, lineHeight:1 }}>{reps}</div>
                <div style={{ color:T.mu, fontSize:11, fontFamily:T.fn, marginTop:2 }}>reps</div>
              </div>
              <button onClick={() => setReps(r => r+1)}
                style={{ width:56, height:56, borderRadius:14, background:color+"20", border:"1px solid "+color+"50",
                  fontSize:28, color, cursor:"pointer", fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
            </div>
          </Card>
        )}

        {/* Round counter for AMRAP/DENSITY */}
        {(isAmrap || fmtType === "DENSITY") && !done && (
          <Card style={{ padding:"12px 16px", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ color:T.mu, fontSize:10, fontWeight:700, letterSpacing:1.2, fontFamily:T.fn, marginBottom:2 }}>ROUNDS COMPLETED</div>
              <div style={{ fontFamily:T.mo, fontSize:36, fontWeight:700, color }}>{rounds}</div>
            </div>
            <button onClick={() => setRounds(r => r+1)}
              style={{ width:52, height:52, borderRadius:12, background:color+"20", border:"1px solid "+color+"50",
                fontSize:24, color, cursor:"pointer", fontWeight:700 }}>+</button>
          </Card>
        )}

        {/* Log set/round */}
        {showLogSet && !restOn && !done && (
          <Btn ch={isMaxReps ? `Log Set ${setLog.length+1} (${reps} reps)` : `+ Log Round (${reps} reps)`}
            onClick={logSet} color={color}
            style={{ width:"100%", padding:14, borderRadius:12, fontSize:14, marginBottom:14 }} />
        )}

        {/* Logged sets strip */}
        {setLog.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ color:T.mu, fontSize:10, fontWeight:700, letterSpacing:1.2, fontFamily:T.fn, marginBottom:8 }}>LOGGED SETS</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {setLog.map((s,i) => (
                <div key={i} style={{ background:color+"15", border:"1px solid "+color+"35", borderRadius:8,
                  padding:"6px 12px", fontFamily:T.mo, fontWeight:700, fontSize:13, color }}>
                  Set {s.set}: {s.reps}
                </div>
              ))}
              {setLog.length > 1 && (
                <div style={{ background:T.su, border:"1px solid "+T.bo, borderRadius:8,
                  padding:"6px 12px", fontFamily:T.mo, fontWeight:700, fontSize:13, color:T.mu }}>
                  Total: {setLog.reduce((a,s) => a+s.reps, 0)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timer controls */}
        {!done && !isMaxReps && (
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            <Btn ch={timerOn ? "Pause" : (time < (isEMOM ? 60 : timeSec) || intNum > 1 ? "Resume" : "▶ Start")}
              onClick={() => { if (!timerOn) beepBell(); setTimerOn(o => !o); }}
              color={timerOn ? T.yw : color} style={{ flex:1, padding:16, fontSize:16, borderRadius:12 }} />
            <Btn ch="Reset" ghost onClick={resetAll} style={{ padding:"16px 18px", borderRadius:12 }} />
          </div>
        )}

        {/* EMOM minute dots */}
        {isEMOM && (
          <div style={{ display:"flex", gap:4, justifyContent:"center", flexWrap:"wrap", marginBottom:14 }}>
            {Array.from({length: Number(form.time)}).map((_,i) => (
              <div key={i} style={{ width:14, height:14, borderRadius:"50%",
                background: i < minute-1 ? T.gr : i === minute-1 ? color : T.bo,
                border:"2px solid "+(i < minute-1 ? T.gr : i === minute-1 ? color : T.di) }} />
            ))}
          </div>
        )}

        {/* Done */}
        {done && (
          <div style={{ background:T.gr+"10", border:"1px solid "+T.gr+"40", borderRadius:16,
            padding:"24px 20px", textAlign:"center", marginBottom:14 }}>
            <div style={{ marginBottom:10 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={T.gr}/>
              </svg>
            </div>
            <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:20, color:T.gr, marginBottom:8 }}>
              {isMaxReps ? "Challenge Complete!" : "Time's Up!"}
            </div>
            {setLog.length > 0 && (
              <div style={{ color:T.mu, fontSize:14, fontFamily:T.fn, marginBottom:4 }}>
                Total reps: <span style={{ color:T.tx, fontWeight:700 }}>{setLog.reduce((a,s) => a+s.reps, 0)}</span>
              </div>
            )}
            {rounds > 0 && (
              <div style={{ color:T.mu, fontSize:14, fontFamily:T.fn, marginBottom:4 }}>
                Rounds: <span style={{ color:T.tx, fontWeight:700 }}>{rounds}</span>
              </div>
            )}
            <div style={{ color:T.di, fontSize:12, fontFamily:T.fn, marginTop:8 }}>{result.score}</div>
          </div>
        )}

        <Btn ch="&#8635; Back to Challenge" onClick={onBack} ghost
          style={{ width:"100%", padding:13, borderRadius:12, fontSize:14 }} />
      </div>
    </div>
  );
};

// ─── CHALLENGE GENERATOR ──────────────────────────────────────────────────────
const Challenge = () => {
  const [form, setForm] = useState({ time:"10", focus:"Full body", exercise:"", equipment:["None"], level:"Intermediate", prevScore:"", exerciseCount:"2" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeRun, setActiveRun] = useState(false);
  const [scaling, setScaling] = useState("scaled"); // "rx" | "scaled"
  const [history, setHistory] = useState([]);   // last 10 generated
  const [favorites, setFavorites] = useState([]); // starred workouts
  const [histTab, setHistTab] = useState("history"); // "history" | "favorites"
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleEquip = (opt) => {
    setForm(f => {
      const cur = f.equipment;
      if (opt === "None") return { ...f, equipment: ["None"] };
      const without = cur.filter(e => e !== "None");
      if (without.includes(opt)) {
        const next = without.filter(e => e !== opt);
        return { ...f, equipment: next.length === 0 ? ["None"] : next };
      }
      return { ...f, equipment: [...without, opt] };
    });
  };

  const generate = () => {
    setLoading(true);
    setResult(null);
    setScaling("scaled");
    setTimeout(() => {
      const r = buildChallenge(form);
      setResult(r);
      setLoading(false);
      // Add to history (deduplicate by name, cap at 10)
      const entry = { ...r, form: { ...form }, ts: Date.now(), id: Date.now() };
      setHistory(h => [entry, ...h.filter(x => x.name !== r.name)].slice(0, 10));
    }, 900);
  };

  const isFav = result ? favorites.some(f => f.name === result.name) : false;
  const toggleFav = () => {
    if (!result) return;
    const entry = { ...result, form: { ...form }, ts: Date.now(), id: result.name };
    setFavorites(fv => isFav ? fv.filter(f => f.name !== result.name) : [entry, ...fv]);
  };
  const loadEntry = (entry) => { setResult(entry); setScaling("scaled"); };

  // Display format label — use structureLabel if available, else format
  const displayFmt = result ? (result.displayFormat || result.format) : "";
  const fmtColors = { EMOM:T.ac, AMRAP:T.or, "FOR TIME":T.yw, LADDER:T.pu, "MAX REPS":T.rd, INTERVAL:T.gr, DENSITY:T.yw,
    "21-15-9":T.or, "5 Rounds For Time":T.or, "3 Rounds For Time":T.or, "Chipper":T.rd,
    "Rep Pyramid":T.pu, "Buy-In / Cash-Out":T.rd, "Ascending Ladder":T.yw,
    "AMRAP Triplet":T.or, "AMRAP Couplet":T.or, "Alternating EMOM":T.ac,
    "Death By":T.rd, "Max Effort Sets":T.rd, "Tabata Protocol":T.gr,
    "Work/Rest Intervals":T.gr, "Density Block":T.yw };
  const fmtColor = result ? (fmtColors[displayFmt] || fmtColors[result.format] || T.ac) : T.ac;

  const OptRow = ({ label, options, field }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(o => (
          <div key={o} onClick={() => set(field, o)}
            style={{ padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontSize: 12,
              fontFamily: T.fn, fontWeight: 700,
              background: form[field] === o ? T.ac : T.hi,
              border: "1px solid " + (form[field] === o ? T.ac : T.bo),
              color: form[field] === o ? "#fff" : T.mu }}>
            {o}
          </div>
        ))}
      </div>
    </div>
  );

  const Sec = ({ label, value, color = "#A8A6BE" }) => value ? (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: T.di, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, fontFamily: T.fn, marginBottom: 5 }}>{label}</div>
      <div style={{ color, fontSize: 14, fontFamily: T.fn, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  ) : null;

  if (activeRun && result) {
    return <ChallengeRunner result={result} form={form} onBack={() => setActiveRun(false)} />;
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
      <div style={{ padding: "8px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10,
            background: T.rd+"20", border:"1px solid "+T.rd+"30",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={T.rd}/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 22, color: T.tx, margin: 0 }}>Challenge Generator</h1>
            <div style={{ color: T.mu, fontSize: 12, fontFamily: T.fn }}>Coach-programmed workout challenges</div>
          </div>
        </div>

        {!result && !loading && (
          <div style={{ marginTop: 24 }}>
            <OptRow label="TIME AVAILABLE" field="time" options={["5","10","15","20","30"]} />
            <OptRow label="EXERCISES" field="exerciseCount" options={["1","2","3"]} />
            <OptRow label="BODY PART FOCUS" field="focus" options={["Upper body","Lower body","Core","Full body"]} />
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 8 }}>
                EQUIPMENT <span style={{ color: T.di, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select all that apply)</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["None","Pull-up bar","Dumbbells","Kettlebells","Barbell"].map(o => {
                  const sel = form.equipment.includes(o);
                  return (
                    <div key={o} onClick={() => toggleEquip(o)}
                      style={{ padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontSize: 12,
                        fontFamily: T.fn, fontWeight: 700,
                        background: sel ? (o === "None" ? T.mu : T.ac) : T.hi,
                        border: "1px solid " + (sel ? (o === "None" ? T.mu : T.ac) : T.bo),
                        color: sel ? "#fff" : T.mu }}>
                      {o}
                    </div>
                  );
                })}
              </div>
            </div>
            <OptRow label="DIFFICULTY" field="level" options={["Beginner","Intermediate","Advanced"]} />
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 8 }}>
                PRIMARY EXERCISE <span style={{ color: T.di, fontWeight: 400 }}>(optional — overrides default)</span>
              </div>
              <input value={form.exercise} onChange={e => set("exercise", e.target.value)}
                placeholder="e.g. Push-ups, Pull-ups, Burpees..."
                style={{ width: "100%", background: T.hi, border: "1px solid "+T.bo, borderRadius: 10,
                  padding: "12px 14px", fontFamily: T.fn, fontSize: 14, color: T.tx, outline: "none",
                  boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 8 }}>
                PREVIOUS SCORE <span style={{ color: T.di, fontWeight: 400 }}>(optional — bumps difficulty up)</span>
              </div>
              <input value={form.prevScore} onChange={e => set("prevScore", e.target.value)}
                placeholder="e.g. 8 rounds, 120 reps..."
                style={{ width: "100%", background: T.hi, border: "1px solid "+T.bo, borderRadius: 10,
                  padding: "12px 14px", fontFamily: T.fn, fontSize: 14, color: T.tx, outline: "none",
                  boxSizing: "border-box" }} />
            </div>
            <Btn ch="Generate Challenge" onClick={generate} color={T.ac}
              style={{ width: "100%", padding: 16, borderRadius: 12, fontSize: 15 }} />
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 300, gap: 20 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid "+T.bo,
                borderTopColor: T.ac, animation: "spin 1s linear infinite" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={T.ac}/>
                </svg>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: T.fn, fontWeight: 700, fontSize: 16, color: T.tx, marginBottom: 6 }}>Designing your challenge...</div>
              <div style={{ color: T.mu, fontSize: 13, fontFamily: T.fn }}>Programming {form.time}-min {form.focus.toLowerCase()} • {form.level}</div>
            </div>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 20 }}>
            {/* Header card */}
            <div style={{ background: fmtColor+"12", border:"1.5px solid "+fmtColor+"40",
              borderRadius:16, padding:"18px 20px 14px", marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <h2 style={{ fontFamily:T.fn, fontWeight:800, fontSize:20, color:T.tx, margin:0, lineHeight:1.2, flex:1 }}>
                  {result.name}
                </h2>
                {/* Favorite star */}
                <button onClick={toggleFav}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:22,
                    color: isFav ? T.yw : T.di, padding:"0 0 0 12px", flexShrink:0 }}>
                  {isFav ? "★" : "☆"}
                </button>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <Badge ch={displayFmt} color={fmtColor} />
                <Pill ch={result.timeCap} />
                <Pill ch={form.level} />
                <Pill ch={form.focus} />
              </div>
            </div>

            {/* Workout */}
            <Card style={{ padding:"18px 20px", marginBottom:12 }}>
              <Sec label="THE WORKOUT" value={result.workout} color={T.tx} />
              <Sec label="HOW IT WORKS" value={result.howItWorks} />
            </Card>

            {/* Goal + Score */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <Card style={{ padding:"14px 16px" }}><Sec label="GOAL" value={result.goal} color={fmtColor} /></Card>
              <Card style={{ padding:"14px 16px" }}><Sec label="SCORE" value={result.score} color={T.tx} /></Card>
            </div>

            {/* Rx / Scaled toggle */}
            <Card style={{ padding:"16px 18px", marginBottom:12 }}>
              <div style={{ display:"flex", gap:2, background:T.hi, borderRadius:8, padding:3, marginBottom:14 }}>
                {["scaled","rx"].map(s => (
                  <div key={s} onClick={() => setScaling(s)}
                    style={{ flex:1, padding:"8px 0", textAlign:"center", borderRadius:6, cursor:"pointer",
                      background: scaling===s ? T.su : "transparent" }}>
                    <span style={{ fontFamily:T.fn, fontWeight:700, fontSize:13,
                      color: scaling===s ? (s==="rx"?T.rd:T.gr) : T.mu }}>
                      {s === "rx" ? "Rx (Full)" : "Scaled"}
                    </span>
                  </div>
                ))}
              </div>
              {(scaling === "rx" ? result.rx.standards : result.scaled.standards).map((line, i) => (
                <div key={i} style={{ marginBottom:i < result.rx.standards.length-1 ? 10 : 0 }}>
                  <div style={{ color: scaling==="rx" ? T.rd : T.gr, fontSize:13, fontFamily:T.fn, lineHeight:1.6 }}>{line}</div>
                </div>
              ))}
            </Card>

            {/* Coaching tip */}
            <div style={{ background:T.yw+"0D", border:"1px solid "+T.yw+"30", borderRadius:12,
              padding:"14px 16px", marginBottom:16, display:"flex", gap:12 }}>
              <div style={{ width:6, borderRadius:3, background:T.yw, flexShrink:0 }} />
              <div>
                <div style={{ color:T.yw, fontSize:9, fontWeight:700, letterSpacing:1.5, fontFamily:T.fn, marginBottom:4 }}>COACHING TIP</div>
                <div style={{ color:"#C8C6DC", fontSize:13, fontFamily:T.fn, lineHeight:1.6 }}>{result.tip}</div>
              </div>
            </div>

            <Btn ch="Start Now" onClick={() => setActiveRun(true)} color={fmtColor}
              style={{ width:"100%", padding:16, borderRadius:12, fontSize:16, marginBottom:10 }} />
            <div style={{ display:"flex", gap:10 }}>
              <Btn ch="&#8635; New" onClick={() => setResult(null)} ghost
                style={{ flex:1, padding:14, borderRadius:12 }} />
              <Btn ch="Regenerate" onClick={generate} color={fmtColor}
                style={{ flex:1, padding:14, borderRadius:12 }} />
            </div>
          </div>
        )}

        {/* History + Favorites — shown when no result */}
        {!result && !loading && (history.length > 0 || favorites.length > 0) && (
          <div style={{ marginTop:24 }}>
            <div style={{ display:"flex", gap:2, background:T.hi, borderRadius:8, padding:3, marginBottom:14 }}>
              {["history","favorites"].map(t2 => (
                <div key={t2} onClick={() => setHistTab(t2)}
                  style={{ flex:1, padding:"8px 0", textAlign:"center", borderRadius:6, cursor:"pointer",
                    background: histTab===t2 ? T.su : "transparent" }}>
                  <span style={{ fontFamily:T.fn, fontWeight:700, fontSize:12, color: histTab===t2 ? T.tx : T.mu }}>
                    {t2 === "history" ? `Recent (${history.length})` : `Saved (${favorites.length})`}
                  </span>
                </div>
              ))}
            </div>
            {(histTab === "history" ? history : favorites).map((entry, i) => {
              const ec = fmtColors[entry.displayFormat] || fmtColors[entry.format] || T.ac;
              return (
                <div key={entry.id || i} onClick={() => loadEntry(entry)}
                  style={{ background:T.su, border:"1px solid "+T.bo, borderRadius:12,
                    padding:"12px 16px", marginBottom:8, cursor:"pointer",
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:T.fn, fontWeight:700, fontSize:14, color:T.tx, marginBottom:4 }}>{entry.name}</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <Badge ch={entry.displayFormat || entry.format} color={ec} />
                      <Pill ch={entry.timeCap} />
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.mu} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
const NAV_ICONS = {
  today: (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? color : "none"} stroke={active ? color : "#6A6880"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={active ? color : "#6A6880"} stroke="none"/>
    </svg>
  ),
  cal: (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" fill={active ? color : "#6A6880"}/>
      <rect x="3" y="4" width="18" height="6" rx="0" fill={active ? "#0A7A4D" : "#4A4860"}/>
      <rect x="3" y="4" width="18" height="5.5" rx="2" fill={active ? "#0A7A4D" : "#4A4860"}/>
      <line x1="8" y1="2" x2="8" y2="6" stroke={active ? "#fff" : "#9A98B0"} strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke={active ? "#fff" : "#9A98B0"} strokeWidth="2" strokeLinecap="round"/>
      <rect x="7" y="12" width="3" height="3" rx="0.5" fill={active ? "#fff" : "#9A98B0"}/>
      <rect x="11" y="12" width="3" height="3" rx="0.5" fill={active ? "#fff" : "#9A98B0"}/>
      <rect x="7" y="16" width="3" height="3" rx="0.5" fill={active ? "#fff" : "#9A98B0"}/>
    </svg>
  ),
  prog: (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1.5" fill={active ? color : "#6A6880"}/>
      <rect x="10" y="7" width="4" height="14" rx="1.5" fill={active ? color : "#6A6880"}/>
      <rect x="17" y="3" width="4" height="18" rx="1.5" fill={active ? color : "#6A6880"}/>
    </svg>
  ),
  timers: (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="8" fill={active ? color : "#6A6880"}/>
      <path d="M12 9v4l2.5 2.5" stroke={active ? "#fff" : "#2A2840"} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 2h6" stroke={active ? color : "#6A6880"} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M19 5l1-1" stroke={active ? color : "#6A6880"} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  progs: (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="2" fill={active ? color : "#6A6880"}/>
      <rect x="13" y="3" width="8" height="8" rx="2" fill={active ? color : "#6A6880"}/>
      <rect x="3" y="13" width="8" height="8" rx="2" fill={active ? color : "#6A6880"}/>
      <rect x="13" y="13" width="8" height="8" rx="2" fill={active ? color : "#6A6880"}/>
    </svg>
  ),
};

const Nav = ({ tab, setTab, hasProg }) => {
  const tabs = hasProg
    ? [{id:"today",l:"Today"},{id:"cal",l:"Calendar"},{id:"prog",l:"Progress"},{id:"timers",l:"Timers"},{id:"progs",l:"Programs"}]
    : [{id:"timers",l:"Timers"},{id:"progs",l:"Programs"}];
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:440, background:T.bg+"EE", backdropFilter:"blur(20px)",
      borderTop:"1px solid "+T.bo, padding:"10px 4px 24px",
      display:"flex", justifyContent:"space-around", zIndex:100 }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              cursor:"pointer", padding:"7px 12px", borderRadius:10,
              background: active ? T.acd : "transparent" }}>
            {NAV_ICONS[t.id](active, T.ac)}
            <span style={{ fontFamily:T.fn, fontSize:9, fontWeight:700,
              color: active ? T.ac : T.mu, letterSpacing:0.5 }}>{t.l.toUpperCase()}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
// ─── PERSISTENCE ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "salgo_v1";

// Cal days contain Date objects — serialize/revive them explicitly
const serializeCal = (cal) => {
  if (!cal) return null;
  return cal.map(d => ({ ...d, date: d.date ? d.date.toISOString() : null }));
};
const reviveCal = (raw) => {
  if (!Array.isArray(raw)) return null;
  return raw.map(d => ({ ...d, date: d.date ? new Date(d.date) : null }));
};

const loadPersistedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return {
      ap:     s.ap     || null,
      pname:  s.pname  || null,
      pcolor: s.pcolor || null,
      mx:     s.mx     || {},
      cal:    reviveCal(s.cal),
      logs:   s.logs   || {},
      cdata:  s.cdata  || null,
      tab:    s.tab    || "progs",
    };
  } catch(e) {
    return null;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      cal: serializeCal(state.cal),
    }));
  } catch(e) {
    // Storage full or unavailable — fail silently
  }
};

export default function App() {
  useEffect(() => {
    injectFonts();
    document.body.style.background = T.bg;
    document.documentElement.style.background = T.bg;
  }, []);

  // Lazy initializers — load from localStorage on first render only
  const saved = loadPersistedState();

  const [ap,     setAp]     = useState(saved?.ap     ?? null);
  const [pname,  setPname]  = useState(saved?.pname  ?? null);
  const [pcolor, setPcolor] = useState(saved?.pcolor ?? null);
  const [mx,     setMx]     = useState(saved?.mx     ?? {});
  const [cal,    setCal]    = useState(saved?.cal     ?? null);
  const [logs,   setLogs]   = useState(saved?.logs   ?? {});
  const [cdata,  setCdata]  = useState(saved?.cdata  ?? null);
  const [tab,    setTab]    = useState(saved?.tab    ?? "progs");
  const [sc,     setSc]     = useState(saved?.ap ? null : "welcome");
  const [ans,    setAns]    = useState(null);
  const [did,    setDid]    = useState(null);
  const [wday,   setWday]   = useState(null);
  const [wcolor, setWcolor] = useState(null);

  // Persist whenever critical state changes
  useEffect(() => {
    if (ap) saveState({ ap, pname, pcolor, mx, cal, logs, cdata, tab });
  }, [ap, pname, pcolor, mx, cal, logs, cdata, tab]);

  const activate = (pid, newMx, newCdata, startDate) => {
    const isC = pid === "custom";
    const pd = isC ? newCdata : PROG[pid];
    const workouts = isC && newCdata && Array.isArray(newCdata.workouts) && newCdata.workouts.length > 0
      ? newCdata.workouts : null;
    const newCal = genCal(pid, newMx, workouts, startDate);
    setAp(pid);
    setMx(newMx);
    setCal(newCal);
    setLogs({});
    if (isC && newCdata) {
      setCdata(newCdata);
      setPname(newCdata.programName);
      setPcolor(newCdata.color || T.ac);
    } else if (pd) {
      setPname(pd.name);
      setPcolor(pd.color);
    }
    setSc(null);
    setTab("today");
  };

  const updateMaxes = (newMx) => {
    // Regenerate future calendar with new maxes, preserving existing logs
    const workouts = ap === "custom" && cdata && Array.isArray(cdata.workouts) ? cdata.workouts : null;
    const newCal = genCal(ap, newMx, workouts);
    setMx(newMx);
    setCal(newCal);
    // logs stay intact — completed sessions are preserved by day id
  };

  // Workout screen takes over full page
  if (wday) return (
    <div style={{ maxWidth: 440, margin: "0 auto", fontFamily: T.fn, minHeight: "100vh", background: T.bg }}>
      <style>{css}</style>
      <Workout day={wday} pcolor={wcolor || pcolor}
        onComplete={d => {
          // Only log to calendar if it's a real program day (not a library pick)
          if (!wday.id.startsWith("lib_")) setLogs(l => ({ ...l, [wday.id]: d }));
          setWday(null); setWcolor(null);
        }}
        onBack={() => { setWday(null); setWcolor(null); }} />
    </div>
  );

  // Flow screens
  if (sc === "welcome") return (
    <div style={{ maxWidth: 440, margin: "0 auto", fontFamily: T.fn, minHeight: "100vh", background: T.bg }}>
      <style>{css}</style>
      <Welcome onCustom={() => setSc("q")} onProven={() => setSc("list")} onChallenge={() => setSc("challenge")} onBrowse={() => setSc("library")} />
    </div>
  );
  if (sc === "q") return (
    <div style={{ maxWidth: 440, margin: "0 auto", fontFamily: T.fn, minHeight: "100vh", background: T.bg }}>
      <style>{css}</style>
      <Questions onDone={a => { setAns(a); setSc("gen"); }} onBack={() => setSc("welcome")} />
    </div>
  );
  if (sc === "gen") return (
    <div style={{ maxWidth: 440, margin: "0 auto", fontFamily: T.fn, minHeight: "100vh", background: T.bg }}>
      <style>{css}</style>
      <Generating answers={ans} onDone={d => { setCdata(d); setDid("custom"); setSc("detail"); }} />
    </div>
  );
  if (sc === "list") return (
    <div style={{ maxWidth: 440, margin: "0 auto", fontFamily: T.fn, minHeight: "100vh", background: T.bg }}>
      <style>{css}</style>
      <ProvenList active={ap} onSelect={id => { setDid(id); setSc("detail"); }}
        onBack={() => setSc(ap ? null : "welcome")}
        onBrowse={() => setSc("library")} />
    </div>
  );
  if (sc === "library") return (
    <div style={{ maxWidth: 440, margin: "0 auto", fontFamily: T.fn, minHeight: "100vh", background: T.bg }}>
      <style>{css}</style>
      <WorkoutLibrary
        existMx={mx}
        onBack={() => setSc("list")}
        onDoWorkout={(day, color) => { setWday(day); setWcolor(color); setSc(null); }} />
    </div>
  );
  if (sc === "detail") return (
    <div style={{ maxWidth: 440, margin: "0 auto", fontFamily: T.fn, minHeight: "100vh", background: T.bg }}>
      <style>{css}</style>
      <ProgramDetail
        pid={did === "custom" ? null : did}
        isCustom={did === "custom"}
        cdata={did === "custom" ? cdata : null}
        existMx={mx}
        onBack={() => setSc(did === "custom" ? "welcome" : "list")}
        onActivate={(newMx, newCd, startDate) => {
          if (did === "custom") activate("custom", {}, newCd || cdata, startDate);
          else activate(did, newMx, null, startDate);
        }}
      />
    </div>
  );

  if (sc === "challenge") return (
    <div style={{ maxWidth: 440, margin: "0 auto", fontFamily: T.fn, minHeight: "100vh", background: T.bg }}>
      <style>{css}</style>
      <div style={{ padding: "52px 20px 0" }}>
        <button onClick={() => setSc("welcome")}
          style={{ background:"none", border:"none", color:T.mu, cursor:"pointer",
            fontSize:13, fontFamily:T.fn, padding:"0 0 4px", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:16 }}>&larr;</span> Back
        </button>
      </div>
      <Challenge />
    </div>
  );

  // Main tabbed app
  const renderTab = () => {
    if (tab === "timers") return <Timers />;
    if (!ap || !cal) return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
        <div style={{ marginBottom: 16 }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill={T.ac}/>
            <path d="M2 17l10 5 10-5" stroke={T.ac} strokeWidth="2" strokeLinecap="round"/>
            <path d="M2 12l10 5 10-5" stroke={T.ac} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 22, color: T.tx, marginBottom: 10 }}>No Program Active</h2>
        <Btn ch="Get Started" onClick={() => setSc("welcome")} color={T.ac} />
      </div>
    );
    if (tab === "today")  return <Today     cal={cal} pname={pname} pcolor={pcolor} logs={logs} onStart={d => setWday(d)} />;
    if (tab === "cal")    return <CalView   cal={cal} pname={pname} pcolor={pcolor} logs={logs} onSelect={d => setWday(d)} />;
    if (tab === "prog")   return <Progress  logs={logs} cal={cal} pname={pname} pcolor={pcolor} maxes={mx} onUpdateMaxes={updateMaxes} />;
    if (tab === "progs")  return (
      <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
        <div style={{ padding: "52px 20px 24px" }}>
          <h1 style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 26, color: T.tx, margin: "0 0 20px" }}>Programs</h1>
          {ap && (
            <Card style={{ padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 8 }}>ACTIVE</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: T.fn, fontWeight: 800, fontSize: 18, color: T.tx }}>{pname}</div>
                  <div style={{ color: T.mu, fontSize: 12, fontFamily: T.fn, marginTop: 2 }}>{cal.filter(d => logs[d.id]).length}/{cal.filter(d => d.workout).length} sessions</div>
                </div>
                <Badge ch="ACTIVE" color={pcolor || T.ac} />
              </div>
            </Card>
          )}
          <Btn ch="Build Custom Program" onClick={() => setSc("welcome")} dim color={pcolor || T.ac}
            style={{ width: "100%", padding: 13, borderRadius: 12, fontSize: 14, marginBottom: 10 }} />
          <Btn ch="Browse 17 Programs" onClick={() => setSc("list")} ghost
            style={{ width: "100%", padding: 13, borderRadius: 12, fontSize: 14, marginBottom: 10 }} />
          <Btn ch="Workout Library" onClick={() => setSc("library")} ghost
            style={{ width: "100%", padding: 13, borderRadius: 12, fontSize: 14 }} />
        </div>
      </div>
    );
    return null;
  };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", fontFamily: T.fn, minHeight: "100vh", background: T.bg, color: T.tx }}>
      <style>{css}</style>
      {renderTab()}
      <Nav tab={tab} setTab={t => {
        if (!ap && t !== "progs" && t !== "timers") { setSc("welcome"); return; }
        setTab(t);
      }} hasProg={!!ap} />
    </div>
  );
}
