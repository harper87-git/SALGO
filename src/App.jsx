import { useState, useEffect, useRef } from "react";

// ─── GROQ API KEY ─────────────────────────────────────────────────────────────
// Get a free key at console.groq.com — no credit card required.
// Paste it here then commit to GitHub. Vercel redeploys automatically.
const GROQ_API_KEY = "";

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
    id:"ironblocks", name:"Body Beast", coach:"Sagi Kalchev · Beachbody",
    rating:4.8, reviews:5200, diff:"Intermediate", freq:"5-6x/week", dur:"13 wks",
    color:T.or, goal:"Muscle", equip:"Dumbbells", tags:["Hypertrophy","Muscle","Dumbbells","3-Phase"],
    desc:"Sagi Kalchev's dumbbell-only mass program. Three progressive phases — Build, Bulk, and Beast — designed to maximize muscle growth at home with no barbell required.",
    phil:"Block 1 (Weeks 1-3) uses pyramid sets, supersets, and giant sets to build a hypertrophy foundation. Block 2 (Weeks 4-9) introduces force sets, progressive sets, and combo sets to continuously shock the muscles. Block 3 (Weeks 10-13) merges both phases for maximum size and definition. Pick a weight you can just barely complete each set with.",
    lifts:[],
    struct:[{d:"Mon",l:"Chest & Tris"},{d:"Tue",l:"Legs"},{d:"Wed",l:"Back & Bis"},{d:"Thu",l:"Shoulders"},{d:"Fri",l:"Cardio/Abs"},{d:"Sat",l:"REST"},{d:"Sun",l:"Chest & Tris"}],
  },
  wendler531: {
    id:"wendler531", name:"5/3/1", coach:"Jim Wendler",
    rating:4.9, reviews:12400, diff:"Intermediate", freq:"4x/week", dur:"12 wks",
    color:T.ac, goal:"Strength", equip:"Barbell", tags:["Powerlifting","Strength"],
    desc:"Jim Wendler's legendary powerlifting program. Built on sub-maximal loading and monthly progression, it has produced more strong people than almost any program in history.",
    phil:"Train with a Training Max set at 90% of your true 1RM. Cycle through three working weeks then a deload. The final set of every main lift is AMRAP — your performance tells you when to add weight. Add 5 lbs to pressing TMs and 10 lbs to lower body TMs each cycle.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"OHP"},{d:"Tue",l:"Deadlift"},{d:"Wed",l:"REST"},{d:"Thu",l:"Bench"},{d:"Fri",l:"Squat"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  startingStrength: {
    id:"startingStrength", name:"Starting Strength", coach:"Mark Rippetoe",
    rating:4.8, reviews:8900, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.yw, goal:"Strength", equip:"Barbell", tags:["Beginner","Linear"],
    desc:"Mark Rippetoe's definitive beginner barbell program. The fastest way to build a strength base from scratch — add weight every single session.",
    phil:"Exploits the beginner's ability to recover and adapt in 24-48 hours. Squat every session. Workout A: squat, bench, deadlift. Workout B: squat, press, deadlift. Add 5 lbs to upper body lifts and 10 lbs to lower body lifts after every successful session.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Workout A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Workout B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Workout A"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  texasMethod: {
    id:"texasMethod", name:"Texas Method", coach:"Mark Rippetoe & Glenn Pendlay",
    rating:4.7, reviews:5200, diff:"Intermediate", freq:"3x/week", dur:"12 wks",
    color:T.rd, goal:"Strength", equip:"Barbell", tags:["Intermediate","Volume"],
    desc:"The classic intermediate bridge. Volume Monday breaks you down, Recovery Wednesday lets you heal, Intensity Friday lets you set a new 5-rep max.",
    phil:"Monday is high-volume stimulus at 80% — 5 sets of 5. Wednesday is a light recovery session at 70%. Friday is a new 5-rep max attempt. Bench and overhead press alternate weekly. One of the most proven intermediate programs ever written.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Volume"},{d:"Tue",l:"REST"},{d:"Wed",l:"Recovery"},{d:"Thu",l:"REST"},{d:"Fri",l:"Intensity"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  arnoldSplit: {
    id:"arnoldSplit", name:"Arnold Split", coach:"Arnold Schwarzenegger",
    rating:4.8, reviews:9100, diff:"Advanced", freq:"6x/week", dur:"12 wks",
    color:T.pu, goal:"Muscle", equip:"Full Gym", tags:["Hypertrophy","Bodybuilding"],
    desc:"The training split Arnold used to win 7 Mr. Olympia titles. Chest and back, shoulders and arms, legs — each pair trained twice per week with brutal volume.",
    phil:"Three antagonist pairings trained twice weekly. The chest and back combination allows massive volume through supersets — each muscle rests while its opposite works. Shoulders and arms follow, then legs. Six days of training, only the most dedicated need apply.",
    lifts:["bench","squat","ohp"],
    struct:[{d:"Mon",l:"Chest & Back"},{d:"Tue",l:"Shoulders & Arms"},{d:"Wed",l:"Legs"},{d:"Thu",l:"Chest & Back"},{d:"Fri",l:"Shoulders & Arms"},{d:"Sat",l:"Legs"},{d:"Sun",l:"REST"}],
  },
  juggernaut: {
    id:"juggernaut", name:"Juggernaut Method", coach:"Chad Wesley Smith",
    rating:4.7, reviews:4800, diff:"Intermediate", freq:"4x/week", dur:"16 wks",
    color:T.gr, goal:"Strength", equip:"Barbell", tags:["Auto-Regulate","Powerlifting"],
    desc:"Chad Wesley Smith's auto-regulated powerlifting system. Four waves of progressively heavier rep ranges with AMRAP sets that tell you exactly when to advance.",
    phil:"Four 4-week waves targeting 10s, 8s, 5s, and 3s. Each wave has accumulation, intensification, and realization phases. The realization AMRAP determines your training max for the next wave — your performance drives your progress.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Squat"},{d:"Tue",l:"Bench"},{d:"Wed",l:"REST"},{d:"Thu",l:"Deadlift"},{d:"Fri",l:"OHP"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  westside: {
    id:"westside", name:"Westside Barbell", coach:"Louie Simmons",
    rating:4.6, reviews:3200, diff:"Advanced", freq:"4x/week", dur:"12 wks",
    color:T.or, goal:"Strength", equip:"Powerlifting Gym", tags:["Conjugate","Powerlifting"],
    desc:"Louie Simmons' conjugate method from the most accomplished powerlifting gym in history. Train maximal strength and explosive speed simultaneously, every week.",
    phil:"Two Max Effort days work up to a 1-3RM on a rotating exercise. Two Dynamic Effort days use 50-60% of max moved with absolute maximum bar speed. This concurrent training of multiple strength qualities is why Westside has produced more world record holders than any other system.",
    lifts:["squat","bench","deadlift"],
    struct:[{d:"Mon",l:"ME Lower"},{d:"Tue",l:"ME Upper"},{d:"Wed",l:"REST"},{d:"Thu",l:"DE Lower"},{d:"Fri",l:"DE Upper"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  fullbody: {
    id:"fullbody", name:"Full Body Compound", coach:"Classic Barbell Method",
    rating:4.6, reviews:5100, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.gr, goal:"Strength", equip:"Barbell", tags:["Full Body","Compound"],
    desc:"Hit every major muscle group every session. A squat, a press, a hinge, and a pull — the four movements that build real strength.",
    phil:"Training the whole body each session maximizes frequency per muscle group to 3x per week. Every workout includes a squat pattern, horizontal press, hinge, and vertical pull. Simple structure, brutally effective for anyone in their first 1-2 years of serious training.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Full Body A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Full Body B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Full Body A"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  fivex5: {
    id:"fivex5", name:"StrongLifts 5x5", coach:"Mehdi Hadim",
    rating:4.8, reviews:9200, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.yw, goal:"Strength", equip:"Barbell", tags:["5x5","Strength","Beginner"],
    desc:"Mehdi's massively popular beginner program. Five sets of five on the big barbell lifts — the sweet spot between strength and size for anyone starting out.",
    phil:"Five sets of five sits at the intersection of strength and hypertrophy rep ranges. Two alternating workouts hit every lift twice weekly. When all 25 reps are completed with good form, add 5 lbs next session. Straightforward, proven, and free.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Workout A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Workout B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Workout A"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  ppl: {
    id:"ppl", name:"Push Pull Legs", coach:"Classic Split Method",
    rating:4.7, reviews:7400, diff:"Intermediate", freq:"3x/week", dur:"12 wks",
    color:T.pu, goal:"Muscle", equip:"Full Gym", tags:["PPL","Hypertrophy","Split"],
    desc:"The most popular hypertrophy split on the internet. Push days, pull days, and leg days — each movement pattern trained with complete focus and full volume.",
    phil:"Organizes training by movement pattern rather than body part. Run it 3 days a week for once-weekly frequency, or 6 days for twice-weekly. The 6-day version is one of the most effective mass-building programs available for intermediate lifters.",
    lifts:["squat","bench","ohp"],
    struct:[{d:"Mon",l:"Push"},{d:"Tue",l:"Pull"},{d:"Wed",l:"Legs"},{d:"Thu",l:"REST"},{d:"Fri",l:"REST"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  upperlower: {
    id:"upperlower", name:"Upper Lower Split", coach:"Classic Split Method",
    rating:4.7, reviews:6100, diff:"Intermediate", freq:"4x/week", dur:"12 wks",
    color:T.ac, goal:"Strength", equip:"Barbell", tags:["Upper Lower","4-Day","Strength"],
    desc:"Four days, two upper and two lower. Power sessions for heavy compound work, volume sessions for accumulation. One of the most balanced programs for building strength and size together.",
    phil:"Hits each muscle group twice weekly. Power days use heavy compound movements at low reps. Volume days shift to moderate loads with more total sets. Full recovery between similar sessions. Adaptable for strength, size, or both.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Upper Power"},{d:"Tue",l:"Lower Power"},{d:"Wed",l:"REST"},{d:"Thu",l:"Upper Volume"},{d:"Fri",l:"Lower Volume"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  linprog: {
    id:"linprog", name:"Linear Progression", coach:"Progressive Overload Method",
    rating:4.5, reviews:4200, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.rd, goal:"Strength", equip:"Barbell", tags:["Linear","Strength","Beginner"],
    desc:"The simplest program that works. Add weight every session and get stronger faster than you thought possible. The foundation all other programs are built on.",
    phil:"Add 5 lbs to pressing lifts and 10 lbs to squat and deadlift after every successful session. The beginner's ability to recover and adapt in 48 hours means this rate of progress is genuinely achievable. When it stalls consistently, you are ready to move on.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Session A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Session B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Session A"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  gvt: {
    id:"gvt", name:"German Volume Training", coach:"Charles Poliquin",
    rating:4.5, reviews:3800, diff:"Intermediate", freq:"4x/week", dur:"12 wks",
    color:T.or, goal:"Muscle", equip:"Barbell", tags:["GVT","Volume","Hypertrophy"],
    desc:"Charles Poliquin's legendary high-volume method. Ten sets of ten at 60% — more total volume than almost any other program, which forces the body to grow.",
    phil:"Hammers a single movement with ten sets of ten at 60% of 1RM. Rest exactly 90 seconds between sets. The cumulative fatigue is what drives hypertrophy. Add weight only when all ten sets of ten are completed cleanly — that bar will feel heavier than you expect by set seven.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Chest & Back"},{d:"Tue",l:"Squat"},{d:"Wed",l:"REST"},{d:"Thu",l:"Shoulders & Arms"},{d:"Fri",l:"Deadlift"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  pyramid: {
    id:"pyramid", name:"Pyramid Training", coach:"Classic Pyramid Method",
    rating:4.4, reviews:3200, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.pk, goal:"Muscle", equip:"Barbell", tags:["Pyramid","Hypertrophy","Strength"],
    desc:"Start light, build heavy, come back down. The pyramid builds in its own warm-up, recruits every muscle fiber type, and delivers both size and strength in a single session.",
    phil:"Begin with higher reps at lighter loads and increase weight while decreasing reps each set. The ascending pyramid recruits progressively more fast-twitch fibers. The descending phase accumulates volume on already-fatigued muscles — a potent hypertrophy signal.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Lower"},{d:"Tue",l:"REST"},{d:"Wed",l:"Upper Push"},{d:"Thu",l:"REST"},{d:"Fri",l:"Upper Pull"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  circuit: {
    id:"circuit", name:"Circuit Conditioning", coach:"Functional Training Method",
    rating:4.3, reviews:2900, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.tl, goal:"Fat Loss", equip:"Full Gym", tags:["Circuit","Conditioning","Fat Loss"],
    desc:"Back-to-back exercises with minimal rest. Keeps the heart rate elevated while compound movements preserve muscle — the most time-efficient way to lose fat and build endurance simultaneously.",
    phil:"Combines strength work with metabolic conditioning by eliminating rest between exercises. Three different circuits across the week hit every major muscle group and energy system. Ideal for fat loss when you have limited time and need results.",
    lifts:[],
    struct:[{d:"Mon",l:"Circuit A"},{d:"Tue",l:"REST"},{d:"Wed",l:"Circuit B"},{d:"Thu",l:"REST"},{d:"Fri",l:"Circuit C"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  hiit: {
    id:"hiit", name:"HIIT Training", coach:"Interval Training Method",
    rating:4.4, reviews:4100, diff:"Beginner", freq:"3x/week", dur:"12 wks",
    color:T.rd, goal:"Fat Loss", equip:"No Equipment", tags:["HIIT","Conditioning","Fat Loss"],
    desc:"20 seconds of max effort, 10 seconds of rest. Tabata-style intervals that burn more calories in 20 minutes than an hour of steady-state cardio.",
    phil:"Near-maximal effort intervals create an afterburn effect — elevated metabolism for hours after training. No equipment needed. Three sessions per week is enough to see dramatic conditioning improvements. The hardest part is going all out for every interval.",
    lifts:[],
    struct:[{d:"Mon",l:"Lower HIIT"},{d:"Tue",l:"REST"},{d:"Wed",l:"Upper HIIT"},{d:"Thu",l:"REST"},{d:"Fri",l:"Full Body HIIT"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
  },
  periodized: {
    id:"periodized", name:"Block Periodization", coach:"Vladimir Issurin",
    rating:4.6, reviews:3500, diff:"Intermediate", freq:"4x/week", dur:"12 wks",
    color:T.lb, goal:"Strength", equip:"Barbell", tags:["Periodization","Strength"],
    desc:"The Soviet sports science system adapted for the gym. Three distinct training blocks — hypertrophy, strength, and power — each building on the last for a peak at week 12.",
    phil:"Weeks 1-4 build muscle with moderate loads and higher reps. Weeks 5-8 convert that new muscle to strength with heavier loads and fewer reps. Weeks 9-12 peak strength with heavy low-rep work. Each block builds the foundation for the next — the sequence is what makes it work.",
    lifts:["squat","bench","deadlift","ohp"],
    struct:[{d:"Mon",l:"Lower"},{d:"Tue",l:"Upper"},{d:"Wed",l:"REST"},{d:"Thu",l:"Lower B"},{d:"Fri",l:"Upper B"},{d:"Sat",l:"REST"},{d:"Sun",l:"REST"}],
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
      10: {1:"BL",2:"TCT",3:"CA",4:"L7",5:"BAR",6:"TBB",0:"CT"},
      11: {1:"L",2:"CA",3:"BT",4:"BBA",5:"L7",6:"TCT",0:"BCH"},
      12: {1:"BL",2:"TBB",3:"BT",4:"TCT",5:"BSH",6:"CA",0:"CT"},
      13: {1:"L",2:"CT",3:"TCT",4:"TBB",5:"BT",6:null,0:"L7"},
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

    // ── BEAST BLOCK additional workouts ──────────────────────────────────────
    if (code === "L7") return { name:"Lucky 7", tag:"L7", tagColor:T.lb,
      weekLabel:"Week "+wk+" — Lucky 7",
      exercises:[
        exo("EZ Push-Up",true,"combo 1 — flow into Clean then Squat, 7 reps each",s(3,7,0),"A"),
        exo("Clean",false,"combo 1 — 7 reps each",s(3,7,0),"A"),
        exo("Squat",false,"combo 1 — 7 reps each",s(3,7,0),"A"),
        exo("Deadlift",false,"combo 2 — flow into Bent Over Row, 7 reps each",s(3,7,0),"B"),
        exo("Bent Over Row",false,"combo 2 — 7 reps each",s(3,7,0),"B"),
        exo("Skull Crusher",false,"combo 3 — Press then Crunch, 7 reps each",s(3,7,0),"C"),
        exo("Press",false,"combo 3 — 7 reps each",s(3,7,0),"C"),
        exo("Crunch",false,"combo 3 — 7 reps each",s(3,7,0),"C"),
        exo("Bicep Curl",false,"combo 4 — Military Press then EZ Squat, 7 reps each",s(3,7,0),"D"),
        exo("Military Press",false,"combo 4 — 7 reps each",s(3,7,0),"D"),
        exo("EZ Squat",false,"combo 4 — 7 reps each",s(3,7,0),"D"),
        exo("Delt Raise",false,"combo 5 — Reverse Lunge, 7 reps each",s(3,7,0),"E"),
        exo("Reverse Lunge",false,"combo 5 — 7 reps each",s(3,7,0),"E"),
        exo("Lat Oblique Twist R",false,"combo 6 — then L side, 7 reps each",s(3,7,0),"F"),
        exo("Lat Oblique Twist L",false,"combo 6 — 7 reps each",s(3,7,0),"F"),
        exo("Upright Row",false,"combo 7 — Calf Raise, 7 reps each",s(3,7,0),"G"),
        exo("Calf Raise",false,"combo 7 — 7 reps each",s(3,7,0),"G"),
      ]};

    if (code === "TCT") return { name:"Tempo: Chest & Tris", tag:"TCT", tagColor:T.or,
      weekLabel:"Week "+wk+" — Tempo: Chest & Tris",
      exercises:[
        exo("Chest Press",true,"tempo — 3×8, 4 sec down each rep",pyr3(0)),
        exo("Figure 4 Crunch",false,"3×15 — core finisher",s(3,15,0)),
        exo("Incline Press",false,"tempo — 3×8, 4 sec down",pyr3(0)),
        exo("Cricket Crunch",false,"3×15 — core finisher",s(3,15,0)),
        exo("Incline Fly",false,"tempo — 3×8, controlled stretch",pyr3(0)),
        exo("Tempo Plank",false,"3×30s hold",s(3,"30s",0)),
        exo("Skull Crusher",false,"tempo — 3×8, 4 sec down",pyr3(0)),
        exo("EZ Bar Crunch",false,"3×15 — core finisher",s(3,15,0)),
        exo("Tricep Kickback",false,"tempo super set — 3 rounds",pyr3(0),"A"),
        exo("Dips",false,"tempo super set — 3 rounds",pyr3(0),"A"),
        exo("Plank Twist-Twist",false,"finisher — 3×15",s(3,15,0)),
      ]};

    if (code === "TBB") return { name:"Tempo: Back & Bis", tag:"TBB", tagColor:T.ac,
      weekLabel:"Week "+wk+" — Tempo: Back & Bis",
      exercises:[
        exo("Pull-Over",true,"tempo — 3×8, 4 sec down each rep",pyr3(0)),
        exo("Wide Plank In & Out",false,"3×15 — core finisher",s(3,15,0)),
        exo("Pull-Up",false,"tempo — 3 sets max, slow descent",pyr3(0)),
        exo("Hanging Circle",false,"3×10 — active hang",s(3,10,0)),
        exo("Reverse Bent-Over Row",false,"tempo — 3×8, pause at top",pyr3(0)),
        exo("Lat Oblique Twist",false,"3×15 — core finisher",s(3,15,0)),
        exo("Preacher Curl",false,"tempo — 3×8, 4 sec down",pyr3(0)),
        exo("Hanging Curl",false,"3×10 — hang & curl",s(3,10,0)),
        exo("All-Angle Bicep",false,"tempo — 3×8, full arc",pyr3(0)),
        exo("Speed Mountain Climber",false,"3×30s — conditioning finisher",s(3,"30s",0)),
      ]};

    if (code === "BT") return { name:"Beast: Total Body", tag:"BT", tagColor:T.gr,
      weekLabel:"Week "+wk+" — Beast: Total Body",
      exercises:[
        exo("Pull-Up",true,"circuit 1 — 2 rounds A→B→C→D, 15 reps each",s(2,15,0),"A"),
        exo("Push-Up",false,"circuit 1",s(2,15,0),"A"),
        exo("Squat",false,"circuit 1",s(2,15,0),"A"),
        exo("Crunch",false,"circuit 1",s(2,15,0),"A"),
        exo("Incline Press",false,"circuit 2 — 2 rounds A→B→C→D",s(2,15,0),"B"),
        exo("Bent-Over Row",false,"circuit 2",s(2,15,0),"B"),
        exo("Reverse Alternating Lunge",false,"circuit 2",s(2,15,0),"B"),
        exo("Plank Twist-Twist",false,"circuit 2",s(2,15,0),"B"),
        exo("1,1,2 Military Press",false,"circuit 3 — 2 rounds A→B→C→D→E",s(2,15,0),"C"),
        exo("Post Delt Raise R",false,"circuit 3",s(2,15,0),"C"),
        exo("Post Delt Raise L",false,"circuit 3",s(2,15,0),"C"),
        exo("Stiff Leg Deadlift",false,"circuit 3",s(2,15,0),"C"),
        exo("Russian Twist",false,"circuit 3",s(2,15,0),"C"),
        exo("Bicep Curl Up-Hammer Down",false,"circuit 4 — 2 rounds A→B→C→D→E→F",s(2,15,0),"D"),
        exo("Tricep Extension-Kickback R",false,"circuit 4",s(2,15,0),"D"),
        exo("Tricep Extension-Kickback L",false,"circuit 4",s(2,15,0),"D"),
        exo("Calf Raise",false,"circuit 4",s(2,15,0),"D"),
        exo("Side Forearm Plank R",false,"circuit 4 — 30s hold",s(2,"30s",0),"D"),
        exo("Side Forearm Plank L",false,"circuit 4 — 30s hold",s(2,"30s",0),"D"),
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
const getLibraryWorkouts = (pid, mx) => {
  const useMx = (mx && Object.values(mx).some(v => v > 0)) ? mx : { squat:185, bench:135, deadlift:225, ohp:95 };
  const workouts = [];
  if (pid === "ironblocks") {
    const codes = [
      {code:"CT",wk:1,dow:1},{code:"L",wk:1,dow:2},{code:"BB",wk:1,dow:3},
      {code:"S",wk:1,dow:4},{code:"CA",wk:1,dow:5},
      {code:"BCH",wk:4,dow:1},{code:"BL",wk:4,dow:2},{code:"BBA",wk:4,dow:3},
      {code:"BAR",wk:4,dow:4},{code:"BSH",wk:4,dow:5},
    ];
    codes.forEach(({wk,dow}) => {
      const wo = buildWorkout(pid, useMx, wk, dow, 0);
      if (wo) workouts.push(wo);
    });
  } else {
    // Try dow 1-6, sc 0-5 to collect unique workout names
    const seen = new Set();
    for (let sc = 0; sc < 6; sc++) {
      for (let dow = 0; dow <= 6; dow++) {
        const wo = buildWorkout(pid, useMx, 1, dow, sc);
        if (wo && !seen.has(wo.name)) {
          seen.add(wo.name);
          workouts.push(wo);
        }
      }
    }
  }
  return workouts;
};

// ─── LIFT ENTRY MODAL ─────────────────────────────────────────────────────────
// Shows before launching any weighted library workout when maxes aren't set.
// Detects which lifts are needed from the program, shows only those fields.
const LIFT_NAMES = { squat:"Back Squat", bench:"Bench Press", deadlift:"Deadlift", ohp:"Overhead Press" };
const LIFT_HINTS = { squat:"e.g. 225", bench:"e.g. 185", deadlift:"e.g. 315", ohp:"e.g. 135" };

const LiftEntryModal = ({ pid, onConfirm, onSkip }) => {
  const prog = PROG[pid];
  const lifts = prog?.lifts || ["squat","bench","deadlift","ohp"];
  const [mx, setMx] = useState({});
  const setM = (k, v) => setMx(m => ({ ...m, [k]: v }));
  const anyEntered = lifts.some(k => mx[k] && Number(mx[k]) > 0);

  return (
    <>
      <div onClick={onSkip}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:300 }} />
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:440, background:T.su, borderRadius:"22px 22px 0 0",
        zIndex:301, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:40, height:4, borderRadius:2, background:T.bo }} />
        </div>
        <div style={{ padding:"12px 24px 48px" }}>
          <h3 style={{ fontFamily:T.fn, fontWeight:800, fontSize:20, color:T.tx, margin:"0 0 6px" }}>
            Enter Your Lifts
          </h3>
          <p style={{ color:T.mu, fontSize:13, fontFamily:T.fn, lineHeight:1.6, margin:"0 0 20px" }}>
            Weights are calculated from your 1-rep max. Enter what you can — skip any you don't know.
          </p>
          {lifts.map(k => (
            <NumInput key={k} label={LIFT_NAMES[k] + " 1RM"} value={mx[k] || ""}
              onChange={v => setM(k, v)} hint={LIFT_HINTS[k]} />
          ))}
          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <button onClick={onSkip}
              style={{ flex:1, padding:14, borderRadius:12, background:T.hi,
                border:"1px solid "+T.bo, fontFamily:T.fn, fontWeight:700,
                fontSize:14, color:T.mu, cursor:"pointer" }}>
              Use Defaults
            </button>
            <button onClick={() => onConfirm(Object.fromEntries(lifts.map(k => [k, Number(mx[k]) || 0])))}
              style={{ flex:2, padding:14, borderRadius:12, background:T.ac,
                border:"none", fontFamily:T.fn, fontWeight:700,
                fontSize:14, color:"#fff", cursor:"pointer" }}>
              {anyEntered ? "Start Workout" : "Start with Defaults"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const WorkoutLibrary = ({ onDoWorkout, onBack, existMx }) => {
  const [openPid, setOpenPid] = useState(null);
  const [search, setSearch] = useState("");
  const [pendingLaunch, setPendingLaunch] = useState(null); // {pid, day, color}
  const mx = existMx && Object.values(existMx).some(v => v > 0) ? existMx : {};

  // Needs-lift check: program has barbell lifts AND user hasn't entered maxes
  const needsLifts = (pid) => {
    const prog = PROG[pid];
    if (!prog || !prog.lifts || prog.lifts.length === 0) return false;
    return !existMx || !Object.values(existMx).some(v => v > 0);
  };

  const launch = (pid, wo, color, userMx) => {
    const usedMx = userMx && Object.values(userMx).some(v => v > 0) ? userMx : mx;
    // Rebuild workout with user's actual maxes
    const rebuiltWo = usedMx && Object.values(usedMx).some(v => v > 0)
      ? (getLibraryWorkouts(pid, usedMx).find(w => w.name === wo.name) || wo)
      : wo;
    onDoWorkout({
      id: "lib_"+pid+"_"+Date.now(),
      date: new Date(),
      dow: new Date().getDay(),
      dayLabel: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()],
      dayFull: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()],
      weekNum: 1,
      isRest: false,
      workout: rebuiltWo,
    }, color);
  };

  const filtered = Object.values(PROG).filter(p =>
    search === "" || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", paddingBottom:40 }}>
      {pendingLaunch && (
        <LiftEntryModal
          pid={pendingLaunch.pid}
          onConfirm={userMx => { launch(pendingLaunch.pid, pendingLaunch.wo, pendingLaunch.color, userMx); setPendingLaunch(null); }}
          onSkip={() => { launch(pendingLaunch.pid, pendingLaunch.wo, pendingLaunch.color, {}); setPendingLaunch(null); }}
        />
      )}
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
          const workouts = isOpen ? getLibraryWorkouts(p.id, mx) : [];
          return (
            <div key={p.id} style={{ background:T.su, border:"1px solid "+(isOpen ? p.color+"50" : T.bo),
              borderRadius:14, overflow:"hidden" }}>
              {/* Program header row */}
              <div onClick={() => setOpenPid(isOpen ? null : p.id)}
                style={{ padding:"16px 18px", cursor:"pointer", display:"flex",
                  justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ flex:1, paddingRight:12 }}>
                  <div style={{ fontFamily:T.fn, fontWeight:800, fontSize:16, color:T.tx }}>{p.name}</div>
                  <div style={{ color:T.mu, fontSize:11, fontFamily:T.fn, marginTop:2 }}>
                    {p.coach} · {p.freq} · {p.equip}
                  </div>
                  {isOpen && (
                    <div style={{ color:"#A8A6BE", fontSize:12, fontFamily:T.fn, marginTop:8, lineHeight:1.6 }}>
                      {p.desc}
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
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
                        <button onClick={() => {
                            if (needsLifts(p.id)) {
                              setPendingLaunch({ pid:p.id, wo, color:p.color });
                            } else {
                              launch(p.id, wo, p.color, mx);
                            }
                          }}
                          style={{ background:p.color+"18", border:"1px solid "+p.color+"40",
                            borderRadius:8, padding:"7px 14px", cursor:"pointer",
                            fontFamily:T.fn, fontWeight:700, fontSize:12, color:p.color,
                            flexShrink:0, marginLeft:12 }}>
                          Do It
                        </button>
                      </div>
                      {/* Main exercises with photos and muscle descriptions */}
                      <div style={{ display:"flex", flexDirection:"column", gap:14, paddingLeft:0, marginTop:10 }}>
                        {(wo.exercises||[]).filter(e=>e.isMain).slice(0,3).map((ex,j) => {
                          const info = exInfo(ex.name);
                          return (
                            <div key={j}>
                              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                                <div style={{ width:6, height:6, borderRadius:"50%", background:p.color, flexShrink:0 }} />
                                <span style={{ fontFamily:T.fn, fontWeight:700, fontSize:12, color:T.tx }}>{ex.name}</span>
                                <span style={{ fontFamily:T.fn, fontSize:11, color:T.mu }}>· {info.m}</span>
                              </div>
                              
                            </div>
                          );
                        })}
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

// ─── SMART RECOMMENDATION ENGINE ─────────────────────────────────────────────
// Maps exercise names to muscle groups for recovery tracking
const MUSCLE_MAP = {
  chest:    ["bench","incline","chest press","push-up","pushup","dip","fly","close grip press","decline"],
  tris:     ["tricep","skull","pushdown","kickback","close grip","dips","tris"],
  back:     ["deadlift","row","pull-up","pullup","chin-up","chinup","pull-over","pullover","lat","rdl","romanian","stiff leg","reverse fly","reverse bent"],
  bis:      ["curl","bicep","hammer curl","preacher"],
  legs:     ["squat","lunge","leg press","leg curl","hip thrust","calf","split squat","bulgarian","sumo","front to back","step-up"],
  shoulders:["shoulder press","overhead press","ohp","lateral raise","front raise","upright row","shrug","rear delt","arnold press","military"],
  core:     ["plank","crunch","sit-up","situp","mountain climber","russian twist","ab","ins and out","v-up","toes-to-bar","hanging circle"],
  fullbody: ["burpee","thruster","clean","snatch","circuit","total body","lucky 7","beast"],
};

// Recovery hours before a group is considered "fresh"
const RECOVERY_HRS = { chest:48, tris:48, back:48, bis:48, legs:72, shoulders:48, core:24, fullbody:72 };

// Friendly display names and colors for each group
const GROUP_META = {
  chest:    { label:"Chest",     color:T.or },
  tris:     { label:"Triceps",   color:T.or },
  back:     { label:"Back",      color:T.ac },
  bis:      { label:"Biceps",    color:T.ac },
  legs:     { label:"Legs",      color:T.gr },
  shoulders:{ label:"Shoulders", color:T.pu },
  core:     { label:"Core",      color:T.tl },
  fullbody: { label:"Full Body", color:T.yw },
};

// Merged display groups — chest+tris, back+bis show together
const DISPLAY_GROUPS = [
  { key:"push",  label:"Chest & Tris",  groups:["chest","tris"],   color:T.or },
  { key:"pull",  label:"Back & Bis",    groups:["back","bis"],     color:T.ac },
  { key:"legs",  label:"Legs",          groups:["legs"],           color:T.gr },
  { key:"sh",    label:"Shoulders",     groups:["shoulders"],      color:T.pu },
  { key:"core",  label:"Core",          groups:["core"],           color:T.tl },
  { key:"fb",    label:"Full Body",     groups:["fullbody"],       color:T.yw },
];

const getRecoveryStatus = (logs, cal) => {
  // Build a map of {muscleGroup: lastTrainedDate}
  const lastTrained = {};
  const now = Date.now();

  // Collect all completed workout days sorted newest first
  const completed = (cal || [])
    .filter(d => logs[d.id] && d.workout && d.workout.exercises)
    .sort((a, b) => b.date - a.date);

  // Also check lib_ workouts stored in logs by scanning log keys
  // Logs keyed by day id — completed cal days give us exercise data
  completed.forEach(day => {
    const logEntry = logs[day.id];
    const logDate = logEntry?.date ? new Date(logEntry.date).getTime() : day.date?.getTime();
    if (!logDate) return;

    const exercises = day.workout.exercises || [];
    exercises.forEach(ex => {
      const name = (ex.name || "").toLowerCase();
      Object.entries(MUSCLE_MAP).forEach(([group, keywords]) => {
        if (keywords.some(k => name.includes(k))) {
          if (!lastTrained[group] || logDate > lastTrained[group]) {
            lastTrained[group] = logDate;
          }
        }
      });
    });
  });

  // Calculate hours since last trained for each display group
  return DISPLAY_GROUPS.map(dg => {
    const hoursArr = dg.groups.map(g => {
      if (!lastTrained[g]) return null; // never trained
      return (now - lastTrained[g]) / 3_600_000;
    });
    const minHours = hoursArr.every(h => h === null) ? null : Math.min(...hoursArr.filter(h => h !== null));
    const recoveryNeeded = Math.max(...dg.groups.map(g => RECOVERY_HRS[g]));
    const pct = minHours === null ? 100 : Math.min(100, (minHours / recoveryNeeded) * 100);
    const status = minHours === null ? "fresh" : minHours >= recoveryNeeded ? "fresh" : minHours >= recoveryNeeded * 0.5 ? "partial" : "sore";
    return { ...dg, hoursAgo: minHours, pct, status };
  });
};

// Pick 2-3 library workouts that target the freshest muscle groups
const getRecommendations = (recoveryStatus, existMx) => {
  const mx = existMx && Object.values(existMx).some(v => v > 0) ? existMx : { squat:185, bench:135, deadlift:225, ohp:95 };

  // Sort by freshest first
  const fresh = recoveryStatus
    .filter(g => g.status !== "sore")
    .sort((a, b) => (b.pct) - (a.pct));

  const recs = [];
  const seen = new Set();

  // For each fresh group, find a matching workout from all programs
  fresh.forEach(group => {
    if (recs.length >= 3) return;

    // Search all programs for workouts targeting this group
    Object.keys(PROG).forEach(pid => {
      if (recs.length >= 3) return;
      const workouts = getLibraryWorkouts(pid);
      workouts.forEach(wo => {
        if (recs.length >= 3 || seen.has(wo.name)) return;
        // Check if this workout targets the fresh group
        const exNames = (wo.exercises || []).filter(e => e.isMain).map(e => (e.name||"").toLowerCase()).join(" ");
        const matches = group.groups.some(g =>
          MUSCLE_MAP[g].some(k => exNames.includes(k))
        );
        if (matches) {
          seen.add(wo.name);
          recs.push({ wo, pid, color: PROG[pid].color, groupLabel: group.label, pcolor: group.color });
        }
      });
    });
  });

  // If we have fewer than 2, fill with any library workout not seen
  if (recs.length < 2) {
    Object.keys(PROG).some(pid => {
      const workouts = getLibraryWorkouts(pid);
      workouts.some(wo => {
        if (recs.length >= 2 || seen.has(wo.name)) return false;
        seen.add(wo.name);
        recs.push({ wo, pid, color: PROG[pid].color, groupLabel: "Full Body", pcolor: T.yw });
        return false;
      });
      return recs.length >= 2;
    });
  }

  return recs;
};

const SmartRecommendation = ({ logs, cal, existMx, onStart }) => {
  const recovery = getRecoveryStatus(logs, cal);
  const recs = getRecommendations(recovery, existMx);
  const [pendingRec, setPendingRec] = useState(null);

  const needsLifts = (pid) => {
    const prog = PROG[pid];
    if (!prog || !prog.lifts || prog.lifts.length === 0) return false;
    return !existMx || !Object.values(existMx).some(v => v > 0);
  };

  const launchRec = (rec, userMx) => {
    const mx = userMx && Object.values(userMx).some(v => v > 0) ? userMx : existMx;
    const wo = (mx && Object.values(mx).some(v => v > 0))
      ? (getLibraryWorkouts(rec.pid, mx).find(w => w.name === rec.wo.name) || rec.wo)
      : rec.wo;
    onStart({
      id: "rec_"+rec.pid+"_"+Date.now(),
      date: new Date(),
      dow: new Date().getDay(),
      dayLabel: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()],
      dayFull: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()],
      weekNum: 1,
      isRest: false,
      workout: wo,
    }, rec.color);
  };

  const statusColor = s => s === "fresh" ? T.gr : s === "partial" ? T.yw : T.rd;
  const statusLabel = (s, h) => {
    if (s === "fresh" && h === null) return "Never trained";
    if (s === "fresh") return `${Math.round(h)}h ago — ready`;
    if (s === "partial") return `${Math.round(h)}h ago — almost`;
    return `${Math.round(h)}h ago — rest`;
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {pendingRec && (
        <LiftEntryModal
          pid={pendingRec.pid}
          onConfirm={userMx => { launchRec(pendingRec, userMx); setPendingRec(null); }}
          onSkip={() => { launchRec(pendingRec, {}); setPendingRec(null); }}
        />
      )}
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:T.ac }} />
        <span style={{ color:T.mu, fontSize:10, fontWeight:700, letterSpacing:1.5, fontFamily:T.fn }}>WHAT SHOULD I DO TODAY?</span>
      </div>

      {/* Recovery grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:18 }}>
        {recovery.map(g => (
          <div key={g.key} style={{ background:T.su, border:"1px solid "+T.bo, borderRadius:10, padding:"10px 10px 8px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
              <span style={{ fontFamily:T.fn, fontWeight:700, fontSize:11, color:T.tx }}>{g.label}</span>
              <div style={{ width:7, height:7, borderRadius:"50%", background:statusColor(g.status), flexShrink:0 }} />
            </div>
            {/* Recovery bar */}
            <div style={{ height:3, background:T.bo, borderRadius:2, marginBottom:5, overflow:"hidden" }}>
              <div style={{ height:"100%", width:g.pct+"%", background:statusColor(g.status),
                borderRadius:2, transition:"width 0.6s" }} />
            </div>
            <div style={{ fontFamily:T.fn, fontSize:9, color:T.mu, lineHeight:1.3 }}>
              {statusLabel(g.status, g.hoursAgo)}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <>
          <div style={{ color:T.mu, fontSize:10, fontWeight:700, letterSpacing:1.5, fontFamily:T.fn, marginBottom:10 }}>
            RECOMMENDED FOR YOU
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recs.map((rec, i) => (
              <div key={i} style={{ background:T.su, border:"1px solid "+rec.color+"40",
                borderRadius:12, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:rec.pcolor, flexShrink:0 }} />
                    <span style={{ fontFamily:T.fn, fontWeight:700, fontSize:14, color:T.tx }}>{rec.wo.name}</span>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ fontFamily:T.fn, fontSize:11, color:T.mu }}>{PROG[rec.pid]?.name}</span>
                    <span style={{ color:T.di, fontSize:11 }}>·</span>
                    <span style={{ fontFamily:T.fn, fontSize:11, color:rec.pcolor, fontWeight:700 }}>{rec.groupLabel}</span>
                  </div>
                </div>
                <button onClick={() => {
                    if (needsLifts(rec.pid)) {
                      setPendingRec(rec);
                    } else {
                      launchRec(rec, {});
                    }
                  }}
                  style={{ background:rec.color+"20", border:"1px solid "+rec.color+"50",
                    borderRadius:8, padding:"8px 16px", cursor:"pointer",
                    fontFamily:T.fn, fontWeight:700, fontSize:12, color:rec.color,
                    flexShrink:0, marginLeft:12 }}>
                  Do It
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── TODAY SCREEN ─────────────────────────────────────────────────────────────
const Today = ({ cal, pname, pcolor, logs, onStart, existMx }) => {
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

        <SmartRecommendation logs={logs} cal={cal} existMx={existMx} onStart={(day, color) => onStart(day)} />

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
  useWakeLock(true); // keep screen on for entire workout
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
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 8 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10, flex:1, cursor:"pointer" }} onClick={() => setDrawer(ex)}>
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
// ─── WAKE LOCK ────────────────────────────────────────────────────────────────
// Prevents screen from sleeping during workouts and timers.
// Automatically released when component unmounts or workout ends.
const useWakeLock = (active) => {
  const lockRef = useRef(null);
  useEffect(() => {
    if (!navigator.wakeLock) return; // not supported — fail silently
    if (active) {
      navigator.wakeLock.request("screen")
        .then(lock => { lockRef.current = lock; })
        .catch(() => {}); // denied — fail silently
    } else {
      if (lockRef.current) { lockRef.current.release().catch(() => {}); lockRef.current = null; }
    }
    return () => {
      if (lockRef.current) { lockRef.current.release().catch(() => {}); lockRef.current = null; }
    };
  }, [active]);
};

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
  useWakeLock(running); // keep screen on while timer is running

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
  if (focus === "Warm-up / Mobility") return [...byPat("core"), ...byPat("full")]; // fallback if needed
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
  if (structure.fmt === "AMRAP")   return `The ${WOD_NOUN[Math.floor(Math.random()*WOD_NOUN.length)]}`;
  if (structure.fmt === "EMOM")    return `The ${WOD_ADJ[Math.floor(Math.random()*WOD_ADJ.length)]} ${WOD_NOUN[Math.floor(Math.random()*WOD_NOUN.length)]}`;
  const adj  = WOD_ADJ[Math.floor(Math.random() * WOD_ADJ.length)];
  const noun = WOD_NOUN[Math.floor(Math.random() * WOD_NOUN.length)];
  return `The ${adj} ${noun}`;
};

// ─── CURATED WOD DATABASE ─────────────────────────────────────────────────────
// 80 real benchmark workouts. Filtered by equipment and time, randomly selected.
const CURATED_WODS = [
  { name:"Cindy", format:"AMRAP", displayFormat:"AMRAP", timeCap:20,
    workout:"20-Minute AMRAP\n5 Pull-Ups\n10 Push-Ups\n15 Air Squats",
    howItWorks:"Complete as many rounds as possible in 20 minutes.",
    goal:"Classic gymnastic benchmark — score is total rounds + reps",
    score:"Count total rounds completed + extra reps",
    tip:"Elite athletes hit 30+ rounds. 20 rounds is excellent. Go unbroken as long as possible.",
    rx:{label:"Rx",standards:["Pull-Ups: strict hang to chin over bar","Push-Ups: chest to deck","Air Squats: below parallel"]},
    scaled:{label:"Scaled",standards:["Pull-Ups: ring rows or jumping pull-ups","Push-Ups: knee push-ups","Air Squats: to box"]},
    exercises:["Pull-Ups","Push-Ups","Air Squats"], eq:["Pull-up bar"], minTime:18, maxTime:22 },

  { name:"Chelsea", format:"EMOM", displayFormat:"Alternating EMOM", timeCap:30,
    workout:"Every Minute On The Minute for 30 Minutes\n5 Pull-Ups\n10 Push-Ups\n15 Air Squats",
    howItWorks:"Complete all reps within each minute, rest the remainder. Same movements as Cindy but EMOM format.",
    goal:"Gymnastic capacity and pacing under fatigue",
    score:"Complete all 30 rounds = Rx",
    tip:"If you can't finish in the minute, rest the next minute and continue.",
    rx:{label:"Rx",standards:["All reps completed each minute for 30 minutes"]},
    scaled:{label:"Scaled",standards:["Reduce to 3 pull-ups / 7 push-ups / 10 squats"]},
    exercises:["Pull-Ups","Push-Ups","Air Squats"], eq:["Pull-up bar"], minTime:28, maxTime:32 },

  { name:"Mary", format:"AMRAP", displayFormat:"AMRAP", timeCap:20,
    workout:"20-Minute AMRAP\n5 Handstand Push-Ups\n10 Pistol Squats (alternating)\n15 Pull-Ups",
    howItWorks:"Complete as many rounds as possible in 20 minutes.",
    goal:"Advanced benchmark — upper body pressing + single-leg strength",
    score:"Count total rounds + extra reps",
    tip:"Mary is the advanced version of Cindy. Break handstand push-ups early to preserve shoulders.",
    rx:{label:"Rx",standards:["HSPU: nose and toes to wall, lockout","Pistols: full depth single leg","Pull-Ups: full hang"]},
    scaled:{label:"Scaled",standards:["HSPU: pike push-ups","Pistols: assisted or box step-up","Pull-Ups: ring rows"]},
    exercises:["Handstand Push-Ups","Air Squats","Pull-Ups"], eq:["Pull-up bar"], minTime:18, maxTime:22 },

  { name:"Fran", format:"AMRAP", displayFormat:"21-15-9 For Time", timeCap:10,
    workout:"21-15-9 For Time\nThrusters (95/65 lbs)\nPull-Ups",
    howItWorks:"21 thrusters then 21 pull-ups. 15 thrusters then 15 pull-ups. 9 thrusters then 9 pull-ups. For time.",
    goal:"Classic speed and intensity benchmark",
    score:"Time to complete all reps",
    tip:"Sub-3 minutes is elite. Sub-5 is excellent. Unbroken on the 9s.",
    rx:{label:"Rx",standards:["Thrusters: 95 lbs men / 65 lbs women","Pull-Ups: chin over bar"]},
    scaled:{label:"Scaled",standards:["Thrusters: 45-65 lbs or DBs","Pull-Ups: jumping pull-ups or ring rows"]},
    exercises:["DB Thrusters","Pull-Ups"], eq:["Pull-up bar","Dumbbells"], minTime:5, maxTime:12 },

  { name:"Annie", format:"AMRAP", displayFormat:"50-40-30-20-10 For Time", timeCap:15,
    workout:"50-40-30-20-10 For Time\nDouble-Unders\nSit-Ups",
    howItWorks:"50 double-unders then 50 sit-ups, descend to 10. For time.",
    goal:"Jump rope conditioning + core",
    score:"Total time",
    tip:"Sub-10 minutes is excellent. Keep the rope moving and breathe.",
    rx:{label:"Rx",standards:["Double-Unders: rope passes twice per jump","Sit-Ups: AbMat, shoulders to mat"]},
    scaled:{label:"Scaled",standards:["3x single-unders","Sit-Ups: feet anchored"]},
    exercises:["Double-Unders","Sit-Ups"], eq:[], minTime:10, maxTime:20 },

  { name:"Barbara", format:"AMRAP", displayFormat:"5 Rounds For Time", timeCap:35,
    workout:"5 Rounds For Time\n20 Pull-Ups\n30 Push-Ups\n40 Sit-Ups\n50 Air Squats\nRest 3 minutes between rounds",
    howItWorks:"Complete all reps, rest exactly 3 minutes between rounds.",
    goal:"High-volume gymnastics benchmark",
    score:"Total time including rest",
    tip:"Pace the first round — you have four more to go. Don't go unbroken on pull-ups.",
    rx:{label:"Rx",standards:["Pull-Ups: chin over bar","All other movements: full ROM"]},
    scaled:{label:"Scaled",standards:["Pull-Ups: ring rows","Push-Ups: knee push-ups"]},
    exercises:["Pull-Ups","Push-Ups","Sit-Ups","Air Squats"], eq:["Pull-up bar"], minTime:30, maxTime:50 },

  { name:"Angie", format:"AMRAP", displayFormat:"For Time", timeCap:30,
    workout:"For Time\n100 Pull-Ups\n100 Push-Ups\n100 Sit-Ups\n100 Air Squats\nComplete all of one before moving to the next.",
    howItWorks:"100 reps of each in order. Don't move to the next until all 100 are done.",
    goal:"Volume gymnastics — mental and physical endurance",
    score:"Total time",
    tip:"Sets of 10 pull-ups with short rest beats going to failure. Break everything early.",
    rx:{label:"Rx",standards:["100 reps of each","Pull-Ups: chin clears bar"]},
    scaled:{label:"Scaled",standards:["50 reps of each","Ring rows for pull-ups"]},
    exercises:["Pull-Ups","Push-Ups","Sit-Ups","Air Squats"], eq:["Pull-up bar"], minTime:20, maxTime:45 },

  { name:"JT", format:"AMRAP", displayFormat:"21-15-9 For Time", timeCap:20,
    workout:"21-15-9 For Time\nHandstand Push-Ups\nRing Dips\nPush-Ups",
    howItWorks:"21 of each, then 15, then 9. Pure pressing.",
    goal:"Upper body pressing volume benchmark",
    score:"Total time",
    tip:"Your triceps will give out early. Break from rep 1.",
    rx:{label:"Rx",standards:["HSPU: nose to floor","Ring Dips: locked out at top","Push-Ups: chest to deck"]},
    scaled:{label:"Scaled",standards:["Pike push-ups","Box dips","Knee push-ups"]},
    exercises:["Handstand Push-Ups","Dips","Push-Ups"], eq:[], minTime:12, maxTime:30 },

  { name:"Fight Gone Bad", format:"AMRAP", displayFormat:"3 Rounds For Max Reps", timeCap:20,
    workout:"3 Rounds — 1 Minute at Each Station\nWall Balls\nSumo DL High Pull\nBox Jumps\nPush Press\nRest 1 Minute between rounds",
    howItWorks:"1 minute at each station for max reps. 1 minute rest between rounds.",
    goal:"Classic benchmark — max total reps",
    score:"Total reps across all stations and rounds",
    tip:"Push hardest on wall balls and box jumps where you can accumulate reps fastest.",
    rx:{label:"Rx",standards:["Wall Balls: 20 lbs to 10 ft","SDHP: 75 lbs","Box Jumps: 20 in"]},
    scaled:{label:"Scaled",standards:["Wall Balls: 10-14 lbs","KB swings instead of SDHP","Step-ups"]},
    exercises:["Wall Balls","KB Sumo DL High Pull","Box Jumps","DB Shoulder Press"], eq:["Kettlebells","Wall Ball","Box"], minTime:18, maxTime:25 },

  { name:"DT", format:"AMRAP", displayFormat:"5 Rounds For Time", timeCap:20,
    workout:"5 Rounds For Time\n12 Deadlifts (155/105 lbs)\n9 Hang Power Cleans (155/105 lbs)\n6 Push Jerks (155/105 lbs)",
    howItWorks:"Same barbell the whole time. Never put it down within a round.",
    goal:"Barbell cycling benchmark",
    score:"Total time",
    tip:"Touch and go deadlifts. The bar should never leave your hands within a round.",
    rx:{label:"Rx",standards:["All movements: 155 lbs men / 105 lbs women"]},
    scaled:{label:"Scaled",standards:["95 lbs / 65 lbs or dumbbell equivalent"]},
    exercises:["Romanian DL","DB Hang Power Clean","DB Shoulder Press"], eq:["Dumbbells"], minTime:12, maxTime:25 },

  { name:"Tabata This", format:"AMRAP", displayFormat:"Tabata Protocol", timeCap:16,
    workout:"Tabata (8 rounds: 20s work / 10s rest) of each — 1 min rest between movements:\nPull-Ups\nPush-Ups\nSit-Ups\nAir Squats",
    howItWorks:"8 intervals of each movement. Score is the lowest rep round of each movement summed.",
    goal:"Classic tabata benchmark — max intensity",
    score:"Sum of lowest rep round across all four movements",
    tip:"Go max effort every interval. The score is your worst round, so consistency matters.",
    rx:{label:"Rx",standards:["Max reps each 20s interval","Full ROM every rep"]},
    scaled:{label:"Scaled",standards:["Ring rows for pull-ups","Knee push-ups"]},
    exercises:["Pull-Ups","Push-Ups","Sit-Ups","Air Squats"], eq:["Pull-up bar"], minTime:14, maxTime:20 },

  { name:"Heavy Karen", format:"AMRAP", displayFormat:"For Time", timeCap:15,
    workout:"For Time\n150 Wall Balls (20/14 lbs to 10 ft target)",
    howItWorks:"150 wall balls. Don't put the ball down if you can help it.",
    goal:"Leg endurance and mental toughness",
    score:"Total time",
    tip:"Sets of 25 unbroken. Sub-7 minutes is excellent.",
    rx:{label:"Rx",standards:["20 lbs men / 14 lbs women","10 ft target every rep"]},
    scaled:{label:"Scaled",standards:["Lighter ball or 9 ft target","Air squats if no ball"]},
    exercises:["Wall Balls","Air Squats"], eq:["Wall Ball"], minTime:8, maxTime:20 },

  { name:"The Engine", format:"EMOM", displayFormat:"Alternating EMOM", timeCap:15,
    workout:"15-Minute EMOM (5 rounds of 3 movements):\nMinute 1: 15 KB Swings\nMinute 2: 12 Push-Ups\nMinute 3: 9 KB Goblet Squats",
    howItWorks:"Rotate through all three movements for 5 complete rounds.",
    goal:"Conditioning triplet — full body",
    score:"Rounds completed without breaking",
    tip:"Pick a KB weight you can do 15 unbroken when fresh. You'll earn it by round 4.",
    rx:{label:"Rx",standards:["KB Swings: American overhead","Push-Ups: chest to deck","Goblet Squat: below parallel"]},
    scaled:{label:"Scaled",standards:["Russian swing to eye level","Knee push-ups","Box squat"]},
    exercises:["KB Swings","Push-Ups","KB Goblet Squat"], eq:["Kettlebells"], minTime:12, maxTime:20 },

  { name:"The Russian", format:"AMRAP", displayFormat:"AMRAP", timeCap:15,
    workout:"15-Minute AMRAP\n10 KB Swings\n10 KB Goblet Squats\n10 KB Clean & Press (5 each side)",
    howItWorks:"One kettlebell. Three movements. As many rounds as possible.",
    goal:"Full-body KB conditioning",
    score:"Total rounds + reps",
    tip:"Use a KB you can swing 20+ unbroken when fresh. It gets heavy fast.",
    rx:{label:"Rx",standards:["KB Swings: American overhead","All movements: full ROM"]},
    scaled:{label:"Scaled",standards:["Russian swing to eye level","Lighter KB throughout"]},
    exercises:["KB Swings","KB Goblet Squat","KB Thrusters"], eq:["Kettlebells"], minTime:12, maxTime:20 },

  { name:"Kettlebell Karen", format:"AMRAP", displayFormat:"For Time", timeCap:15,
    workout:"For Time\n150 KB Swings (53/35 lbs)",
    howItWorks:"150 KB swings. American or Russian. Go.",
    goal:"KB endurance test",
    score:"Total time",
    tip:"Sets of 25-30 with 10-15 seconds rest. Don't go to failure on early sets.",
    rx:{label:"Rx",standards:["53 lbs men / 35 lbs women","American swing overhead"]},
    scaled:{label:"Scaled",standards:["Lighter KB","Russian swing to eye level is fine"]},
    exercises:["KB Swings"], eq:["Kettlebells"], minTime:8, maxTime:20 },

  { name:"Holbrook", format:"AMRAP", displayFormat:"AMRAP", timeCap:20,
    workout:"20-Minute AMRAP\n10 DB Snatches (right arm)\n10 DB Snatches (left arm)\n10 Burpee Box Jumps",
    howItWorks:"10 snatches each arm, then 10 burpee box jumps. Repeat for 20 minutes.",
    goal:"Single-arm power + conditioning",
    score:"Total rounds + reps",
    tip:"Keep snatches fluid and efficient. Breathe during box jumps.",
    rx:{label:"Rx",standards:["DB Snatch: 50 lbs men / 35 lbs women","Box: 24/20 in"]},
    scaled:{label:"Scaled",standards:["Lighter DB","Step-up instead of jump"]},
    exercises:["DB Snatch","Burpees","Box Jumps"], eq:["Dumbbells","Box"], minTime:15, maxTime:25 },

  { name:"Grace", format:"AMRAP", displayFormat:"For Time", timeCap:10,
    workout:"For Time\n30 Clean & Jerks (135/95 lbs)",
    howItWorks:"30 reps of clean & jerk. Go as fast as possible.",
    goal:"Pure barbell cycling speed",
    score:"Total time",
    tip:"Sub-2 minutes is elite. Singles are fine — just keep moving.",
    rx:{label:"Rx",standards:["Clean & Jerk: 135 lbs men / 95 lbs women","Full squat clean + jerk"]},
    scaled:{label:"Scaled",standards:["DB Hang Power Clean + Press: lighter weight","30 reps total"]},
    exercises:["DB Hang Power Clean","DB Shoulder Press"], eq:["Dumbbells"], minTime:5, maxTime:12 },

  { name:"Isabel", format:"AMRAP", displayFormat:"For Time", timeCap:10,
    workout:"For Time\n30 Snatches (135/95 lbs)",
    howItWorks:"30 reps of snatch. For time. Power snatch is fine.",
    goal:"Barbell cycling — snatch version of Grace",
    score:"Total time",
    tip:"Reset each rep if needed. Sub-2 minutes is elite.",
    rx:{label:"Rx",standards:["Snatch: 135 lbs men / 95 lbs women"]},
    scaled:{label:"Scaled",standards:["DB Snatch: 50 lbs men / 35 lbs women, alternating arms"]},
    exercises:["DB Snatch"], eq:["Dumbbells"], minTime:5, maxTime:12 },

  { name:"Randy", format:"AMRAP", displayFormat:"For Time", timeCap:12,
    workout:"For Time\n75 Power Snatches (75/55 lbs)",
    howItWorks:"75 snatches. Go.",
    goal:"Barbell cycling endurance",
    score:"Total time",
    tip:"Singles are completely fine. Sub-7 minutes is excellent.",
    rx:{label:"Rx",standards:["Power Snatch: 75 lbs men / 55 lbs women"]},
    scaled:{label:"Scaled",standards:["DB Snatch: 35 lbs alternating arms"]},
    exercises:["DB Snatch"], eq:["Dumbbells"], minTime:5, maxTime:15 },

  { name:"Nasty Girls", format:"AMRAP", displayFormat:"3 Rounds For Time", timeCap:12,
    workout:"3 Rounds For Time\n50 Air Squats\n7 Muscle-Ups\n10 Hang Power Cleans (135/95 lbs)",
    howItWorks:"3 rounds. For time.",
    goal:"Gymnastics + barbell — classic benchmark",
    score:"Total time",
    tip:"Sub-7 is elite. Break muscle-ups from the start.",
    rx:{label:"Rx",standards:["Muscle-Ups: strict","Cleans: 135/95 lbs"]},
    scaled:{label:"Scaled",standards:["Air squats","Pull-up + dip instead of muscle-up","DB cleans"]},
    exercises:["Air Squats","Pull-Ups","DB Hang Power Clean"], eq:["Pull-up bar","Dumbbells"], minTime:8, maxTime:18 },

  { name:"Jackie", format:"AMRAP", displayFormat:"For Time", timeCap:15,
    workout:"For Time\n1000m Row (sub: 800m Run)\n50 Thrusters (45 lbs)\n30 Pull-Ups",
    howItWorks:"Complete in order. For time.",
    goal:"Monostructural + thruster + gymnastics chipper",
    score:"Total time",
    tip:"Sub-7 minutes is elite. Go hard on the thrusters — only 30 pull-ups left.",
    rx:{label:"Rx",standards:["Row: 1000m or run 800m","Thrusters: 45 lbs barbell","Pull-Ups: unassisted"]},
    scaled:{label:"Scaled",standards:["Run 400m","DB thrusters lighter","Jumping pull-ups"]},
    exercises:["DB Thrusters","Pull-Ups"], eq:["Pull-up bar","Dumbbells"], minTime:8, maxTime:20 },

  { name:"Michael", format:"AMRAP", displayFormat:"3 Rounds For Time", timeCap:30,
    workout:"3 Rounds For Time\n800m Run\n50 Back Extensions (or Good Mornings)\n50 Sit-Ups",
    howItWorks:"3 rounds. For time.",
    goal:"Posterior chain + core endurance",
    score:"Total time",
    tip:"Pace the runs. Break back extensions into manageable sets.",
    rx:{label:"Rx",standards:["Run: 800m","Back extensions: full ROM"]},
    scaled:{label:"Scaled",standards:["400m run","Good mornings or RDL","Sit-Ups: feet anchored"]},
    exercises:["Sprint (100m)","Romanian DL","Sit-Ups"], eq:[], minTime:20, maxTime:40 },

  { name:"Kelly", format:"AMRAP", displayFormat:"5 Rounds For Time", timeCap:35,
    workout:"5 Rounds For Time\n400m Run\n30 Box Jumps (24/20 in)\n30 Wall Balls (20/14 lbs)",
    howItWorks:"5 full rounds. For time.",
    goal:"Mono + power endurance",
    score:"Total time",
    tip:"Pace the run. Unbroken box jumps early. Break wall balls into 3 sets of 10.",
    rx:{label:"Rx",standards:["Run: 400m","Box: 24 in men / 20 in women","Wall Balls: 20/14 lbs"]},
    scaled:{label:"Scaled",standards:["200m run","Box step-ups","Lighter wall ball or air squats"]},
    exercises:["Sprint (100m)","Box Jumps","Wall Balls"], eq:["Box","Wall Ball"], minTime:25, maxTime:50 },

  { name:"Elizabeth", format:"AMRAP", displayFormat:"21-15-9 For Time", timeCap:15,
    workout:"21-15-9 For Time\nSquat Cleans (135/95 lbs)\nRing Dips",
    howItWorks:"21-15-9 For time.",
    goal:"Lower body power + pressing benchmark",
    score:"Total time",
    tip:"Break ring dips into small sets early. Don't go to failure.",
    rx:{label:"Rx",standards:["Squat Cleans: 135/95 lbs","Ring Dips: lockout at top"]},
    scaled:{label:"Scaled",standards:["DB Hang Power Clean","Box dips or push-ups"]},
    exercises:["DB Hang Power Clean","Dips"], eq:["Dumbbells"], minTime:10, maxTime:20 },

  { name:"Murph", format:"AMRAP", displayFormat:"For Time", timeCap:60,
    workout:"For Time (with 20 lb vest if available)\n1 Mile Run\n100 Pull-Ups\n200 Push-Ups\n300 Air Squats\n1 Mile Run\n*Partition the pull-ups, push-ups, and squats as needed",
    howItWorks:"Classic partition: 20 rounds of Cindy (5 pull-ups / 10 push-ups / 15 squats) between the two runs.",
    goal:"Memorial benchmark — total body endurance",
    score:"Total time",
    tip:"20 rounds of Cindy between the runs is the standard partition. Walk the second mile if you have to.",
    rx:{label:"Rx",standards:["20 lb vest","Pull-Ups: chin over bar","1 mile runs"]},
    scaled:{label:"Scaled",standards:["No vest","Ring rows","Knee push-ups"]},
    exercises:["Pull-Ups","Push-Ups","Air Squats"], eq:["Pull-up bar"], minTime:45, maxTime:70 },

  { name:"The Iron Mile", format:"EMOM", displayFormat:"Alternating EMOM", timeCap:20,
    workout:"20-Minute Alternating EMOM\nOdd minutes: 10 DB Thrusters\nEven minutes: 10 Pull-Ups",
    howItWorks:"Alternate between thrusters and pull-ups every minute for 20 minutes.",
    goal:"Upper body pressing and pulling capacity",
    score:"Rounds completed without breaking",
    tip:"Drop to 7 reps if you can't finish in the minute. Keep moving.",
    rx:{label:"Rx",standards:["Thrusters: full squat depth, lock out overhead","Pull-Ups: chin over bar"]},
    scaled:{label:"Scaled",standards:["Lighter DBs","Ring rows"]},
    exercises:["DB Thrusters","Pull-Ups"], eq:["Pull-up bar","Dumbbells"], minTime:18, maxTime:25 },

  { name:"Filthy Fifty", format:"AMRAP", displayFormat:"Chipper For Time", timeCap:45,
    workout:"For Time — Chipper\n50 Box Jumps\n50 Jumping Pull-Ups\n50 KB Swings\n50 Walking Lunges\n50 Knees-to-Elbows\n50 Push Press\n50 Back Extensions\n50 Wall Balls\n50 Burpees\n50 Double-Unders",
    howItWorks:"50 reps of each movement in order. For time.",
    goal:"Epic chipper benchmark",
    score:"Total time",
    tip:"Pace the first three movements. Most athletes blow up on the burpees.",
    rx:{label:"Rx",standards:["All movements at standard weight","50 reps of each"]},
    scaled:{label:"Scaled",standards:["35 reps of each","Reduce weights"]},
    exercises:["Box Jumps","Pull-Ups","KB Swings","Walking Lunges","Burpees"], eq:["Pull-up bar","Kettlebells","Box"], minTime:35, maxTime:65 },

  { name:"Air Force WOD", format:"AMRAP", displayFormat:"For Time", timeCap:20,
    workout:"For Time — 4 Burpees at the start of every minute:\n20 Thrusters\n20 Sumo DL High Pull\n20 Push Jerks\n20 Overhead Squats\n20 Front Squats",
    howItWorks:"Work through 5 movements of 20 reps each. Do 4 burpees at the top of every minute starting at 0:00.",
    goal:"Conditioning + mental toughness",
    score:"Total time",
    tip:"The burpees accumulate fast. Don't fall behind on the minutes.",
    rx:{label:"Rx",standards:["95 lbs / 65 lbs barbell throughout"]},
    scaled:{label:"Scaled",standards:["Light DB version","2 burpees per minute"]},
    exercises:["DB Thrusters","KB Sumo DL High Pull","Burpees"], eq:["Dumbbells","Kettlebells"], minTime:15, maxTime:30 },

  // ── BARBELL CHALLENGES ────────────────────────────────────────────────────
  { name:"135 Bench Press AMRAP", format:"AMRAP", displayFormat:"Max Reps In Time", timeCap:10,
    workout:"10-Minute AMRAP\nBench Press — 135 lbs\n\nHow many reps can you do in 10 minutes?\nRack the bar to rest. Clock doesn't stop.",
    howItWorks:"Load 135 lbs. Start the clock. Do as many reps as possible in 10 minutes, resting the bar on the rack when needed. Pick up where you left off every time you re-grip.",
    goal:"Max bench press reps in 10 minutes — a pure test of upper body endurance and mental toughness",
    score:"Total reps completed",
    tip:"Don't go to failure on your first set. Sets of 10-15 with 15-20 second rests will beat grinding singles every time.",
    rx:{label:"Rx",standards:["135 lbs barbell","Full lockout each rep","Touch chest each rep"]},
    scaled:{label:"Scaled",standards:["Use a weight you can rep 20+ times fresh","95 lbs or 115 lbs are common sub-135 targets"]},
    exercises:["Bench Press"], eq:["Barbell"], minTime:8, maxTime:12 },

  { name:"100 Rep Bench Press", format:"AMRAP", displayFormat:"For Time", timeCap:20,
    workout:"For Time\n100 Reps — Bench Press\n\nUse a weight you can rep 15-20 times fresh.\nBreak it however you need. Clock doesn't stop.",
    howItWorks:"Load the bar and complete 100 total reps as fast as possible. Rest between sets as needed — the clock keeps running.",
    goal:"A classic hypertrophy and mental toughness challenge — 100 reps straight is rarer than it sounds",
    score:"Total time to complete 100 reps",
    tip:"Suggested opening sets: 20, 15, 15, 12, 10, then singles if needed. The last 20 reps are where most people fall apart.",
    rx:{label:"Rx",standards:["Weight you can do 15-20 reps fresh","Full ROM — touch chest, full lockout"]},
    scaled:{label:"Scaled",standards:["Reduce to 50 reps","Drop weight if needed mid-set"]},
    exercises:["Bench Press"], eq:["Barbell"], minTime:10, maxTime:25 },

  { name:"10 Minute Deadlift AMRAP", format:"AMRAP", displayFormat:"Max Reps In Time", timeCap:10,
    workout:"10-Minute AMRAP\nDeadlift — Pick your weight\n\nHow many reps can you pull in 10 minutes?\nSuggested: 225 lbs men / 135 lbs women\nSet the bar down to rest. Clock doesn't stop.",
    howItWorks:"Load the bar and pull as many deadlifts as possible in 10 minutes. The bar resets on the floor each rep. Rest as needed.",
    goal:"Deadlift endurance — one of the most viral barbell challenges on social media",
    score:"Total reps completed",
    tip:"Sets of 5-8 with 20-30 second rests will beat grinding. Keep your back flat — fatigue makes people sloppy fast.",
    rx:{label:"Rx",standards:["225 lbs men / 135 lbs women","Full lockout at top","Controlled descent"]},
    scaled:{label:"Scaled",standards:["Use 60-70% of your 1RM","Prioritize form over reps"]},
    exercises:["Deadlift"], eq:["Barbell"], minTime:8, maxTime:12 },

  { name:"10 Minute Overhead Press AMRAP", format:"AMRAP", displayFormat:"Max Reps In Time", timeCap:10,
    workout:"10-Minute AMRAP\nOverhead Press — Pick your weight\n\nSuggested: 95 lbs men / 65 lbs women\nRack the bar to rest. Clock doesn't stop.",
    howItWorks:"Strict press only — no leg drive. Max reps in 10 minutes. Rack the bar to rest when needed.",
    goal:"Strict pressing endurance — underrated test of shoulder and tricep capacity",
    score:"Total reps completed",
    tip:"Strict press fatigues faster than you expect. Start with sets of 8-10, rest 20 seconds, repeat. No push press.",
    rx:{label:"Rx",standards:["Strict press — no leg drive","95 lbs men / 65 lbs women","Full lockout overhead"]},
    scaled:{label:"Scaled",standards:["Use 50-60% of your strict press 1RM","Seated DB press if needed"]},
    exercises:["Overhead Press"], eq:["Barbell"], minTime:8, maxTime:12 },

  { name:"20 Rep Squat", format:"AMRAP", displayFormat:"For Time", timeCap:20,
    workout:"1 Set of 20 Reps — Back Squat\n\nUse your 10-rep max weight.\nBreath between reps at the top.\nDo not re-rack until all 20 are done.",
    howItWorks:"Load your 10RM on the bar. Complete 20 consecutive reps without re-racking. You breathe at the top — not on the rack.",
    goal:"One of the most legendary barbell challenges ever written. Called the breathing squat — it will change you.",
    score:"Complete all 20 reps without re-racking = success",
    tip:"Reps 1-10 feel fine. Reps 11-15 get hard. Reps 16-20 are a negotiation with yourself. Take 3-5 deep breaths at the top between reps.",
    rx:{label:"Rx",standards:["Your 10RM weight on the bar","No re-racking","20 consecutive reps"]},
    scaled:{label:"Scaled",standards:["Use your 8RM weight","Re-rack once if you must — then finish"]},
    exercises:["Squat"], eq:["Barbell"], minTime:10, maxTime:25 },

  { name:"The Barbell Complex", format:"AMRAP", displayFormat:"For Time", timeCap:20,
    workout:"5 Rounds For Time — Never drop the bar within a round:\n6 Deadlifts\n6 Hang Power Cleans\n6 Front Squats\n6 Overhead Press\n6 Back Squats\n\nRest as needed between rounds.",
    howItWorks:"Complete all 30 reps of one round without putting the bar down. Rest between rounds. Bar stays loaded — one weight for everything.",
    goal:"Full-body barbell conditioning — builds grip, lung capacity, and total-body strength simultaneously",
    score:"Total time for 5 rounds",
    tip:"The weight is limited by your weakest lift — usually the overhead press. Start light. 65-75 lbs is harder than it looks for 5 rounds.",
    rx:{label:"Rx",standards:["One weight for all movements","Bar never touches floor mid-round","Full ROM every rep"]},
    scaled:{label:"Scaled",standards:["3 rounds","Reduce to 4 reps per movement","Lighter bar"]},
    exercises:["Deadlift","Barbell Row","Squat","Overhead Press"], eq:["Barbell"], minTime:12, maxTime:30 },

  { name:"100 Rep Deadlift", format:"AMRAP", displayFormat:"For Time", timeCap:20,
    workout:"For Time\n100 Reps — Deadlift\n\nSuggested: 135 lbs men / 95 lbs women\nBreak it however you need.",
    howItWorks:"100 deadlifts as fast as possible. Set the bar down to rest. Clock keeps running.",
    goal:"Posterior chain endurance — grip, hamstrings, lower back all tested",
    score:"Total time to complete 100 reps",
    tip:"Sets of 10 with 15-second rests early. The grip usually fails before the legs. Use mixed grip if needed.",
    rx:{label:"Rx",standards:["135 lbs men / 95 lbs women","Touch and go or deadstop — your choice","Full lockout each rep"]},
    scaled:{label:"Scaled",standards:["50 reps","Use 60% of bodyweight on the bar"]},
    exercises:["Deadlift"], eq:["Barbell"], minTime:10, maxTime:25 },

  { name:"Squat Every Minute", format:"EMOM", displayFormat:"EMOM", timeCap:20,
    workout:"20-Minute EMOM\nBack Squat — 5 reps every minute\n\nUse 70-75% of your 1RM.\nComplete 5 reps, rest the remainder of the minute.",
    howItWorks:"Every minute on the minute, do 5 back squats. Rest the remainder. 20 rounds = 100 total reps.",
    goal:"Volume squatting for strength and hypertrophy — 100 heavy reps in 20 minutes",
    score:"All 20 rounds completed = success",
    tip:"If 70% feels easy through round 10, it will not feel easy in round 18. Trust the percentage.",
    rx:{label:"Rx",standards:["70-75% of 1RM","5 reps every minute","Full depth — below parallel"]},
    scaled:{label:"Scaled",standards:["60% of 1RM","4 reps per minute","Box squat to control depth"]},
    exercises:["Squat"], eq:["Barbell"], minTime:18, maxTime:22 },

  { name:"Bench Every Minute", format:"EMOM", displayFormat:"EMOM", timeCap:20,
    workout:"20-Minute EMOM\nBench Press — 5 reps every minute\n\nUse 70% of your 1RM.\nComplete 5 reps, rest the remainder.",
    howItWorks:"Every minute on the minute, bench press 5 reps. 20 sets = 100 total reps of heavy bench.",
    goal:"High-volume bench press for chest strength and size — 100 reps at 70% is genuinely hard",
    score:"All 20 rounds completed without missing reps = success",
    tip:"Have a spotter present. By round 15 the bar will feel much heavier than it did in round 1.",
    rx:{label:"Rx",standards:["70% of 1RM","5 reps per minute","Spotter present"]},
    scaled:{label:"Scaled",standards:["60% of 1RM","4 reps per minute"]},
    exercises:["Bench Press"], eq:["Barbell"], minTime:18, maxTime:22 },

  { name:"The Big Three", format:"AMRAP", displayFormat:"For Time", timeCap:30,
    workout:"For Time:\n10 Deadlifts (bodyweight on bar)\n10 Bench Press (bodyweight on bar)\n10 Back Squats (bodyweight on bar)\n\nRepeat — 10 rounds total.\n\nExample: 185 lb person loads 185 lbs.",
    howItWorks:"Load bodyweight on the bar for all three lifts. 10 reps each, 10 rounds. For time.",
    goal:"Classic strength challenge — bodyweight on the bar for all three lifts is a real benchmark",
    score:"Total time for 10 rounds",
    tip:"Bodyweight bench for 10 reps is the great equalizer. Most people underestimate it.",
    rx:{label:"Rx",standards:["Bodyweight on bar for all three lifts","10 reps each movement","10 rounds"]},
    scaled:{label:"Scaled",standards:["75% bodyweight on bar","5 rounds","Rest as needed"]},
    exercises:["Deadlift","Bench Press","Squat"], eq:["Barbell"], minTime:20, maxTime:45 },

  { name:"Powerlifting Total", format:"AMRAP", displayFormat:"For Time", timeCap:45,
    workout:"Work to a 1-Rep Max in order:\n1. Back Squat\n2. Bench Press\n3. Deadlift\n\nTake 3-5 attempts per lift.\nYour total = squat + bench + deadlift.",
    howItWorks:"Classic powerlifting total. Work up to a max single on each lift in order. 3 attempts recommended — opener at 90%, second at 97%, third is your max.",
    goal:"Establish your true one-rep maxes on the three competition lifts — the foundation of all barbell programming",
    score:"Total lbs lifted (squat + bench + deadlift)",
    tip:"Opener should feel like a guaranteed triple. Second should be a tough single. Third is your max attempt. Don't bomb your opener.",
    rx:{label:"Rx",standards:["True 1RM attempt each lift","3 attempts per movement","Competition order: squat → bench → deadlift"]},
    scaled:{label:"Scaled",standards:["Work to a 3RM instead of 1RM","Rest 5+ minutes between max attempts"]},
    exercises:["Squat","Bench Press","Deadlift"], eq:["Barbell"], minTime:30, maxTime:60 },

  { name:"OHP Every Minute", format:"EMOM", displayFormat:"EMOM", timeCap:15,
    workout:"15-Minute EMOM\nOverhead Press — 5 reps every minute\n\nUse 65-70% of your 1RM.\nStrict press only — no leg drive.",
    howItWorks:"Every minute on the minute, strict press 5 reps. 15 rounds = 75 total overhead reps.",
    goal:"Overhead strength volume — the most undertrained lift in most programs",
    score:"All 15 rounds completed = success",
    tip:"The press is brutally honest. If you miss reps, the weight is too heavy. Drop 10 lbs and start again.",
    rx:{label:"Rx",standards:["65-70% of strict press 1RM","Strict — no leg drive","5 reps per minute"]},
    scaled:{label:"Scaled",standards:["60% of 1RM","3 reps per minute","Seated DB press as sub"]},
    exercises:["Overhead Press"], eq:["Barbell"], minTime:13, maxTime:18 },

  // ── TRACK & RUNNING WORKOUTS ──────────────────────────────────────────────
  { name:"Classic 400s", format:"AMRAP", displayFormat:"Interval For Time", timeCap:30,
    workout:"8 x 400m\nRest equal time between reps\n\nRun each 400m hard. Rest the same amount of time it took to run it.\nExample: 2:00 per 400m = 2:00 rest.",
    howItWorks:"8 x 400m with equal work:rest ratio. The goal is consistent splits — every rep within 5 seconds of each other.",
    goal:"The most proven speed and aerobic capacity workout in track history — used at every level from high school to Olympic athletes",
    score:"Average 400m split time",
    tip:"Go out controlled on rep 1. Most people run rep 1 too fast and fall apart by rep 5. Consistent effort beats a heroic opener.",
    rx:{label:"Rx",standards:["8 reps of 400m","Equal work:rest ratio","Splits within 5 seconds of each other"]},
    scaled:{label:"Scaled",standards:["4-6 reps","200m if 400m is too hard","2:1 rest ratio"]},
    exercises:["Sprint (100m)"], eq:[], minTime:25, maxTime:45 },

  { name:"Mile Repeats", format:"AMRAP", displayFormat:"Interval For Time", timeCap:45,
    workout:"4 x 1 Mile\n90 seconds rest between miles\n\nTarget: 10-15 seconds faster than your easy run pace.",
    howItWorks:"4 miles at comfortably hard pace with 90 seconds rest between each. The cornerstone of distance running fitness.",
    goal:"Build lactate threshold and aerobic base — the workout that separates casual runners from competitive ones",
    score:"Average mile split time",
    tip:"If you can hold a full conversation, too slow. If you can't say three words, too fast. Aim for controlled discomfort.",
    rx:{label:"Rx",standards:["4 x 1 mile","90 second rest","10-15s faster than easy run pace"]},
    scaled:{label:"Scaled",standards:["2-3 miles","2-3 minute rest","Run/walk the miles"]},
    exercises:["Sprint (100m)"], eq:[], minTime:35, maxTime:60 },

  { name:"Track Pyramid", format:"AMRAP", displayFormat:"Track Pyramid", timeCap:30,
    workout:"200m → 400m → 800m → 1200m → 800m → 400m → 200m\n\n90 seconds rest between each rep.",
    howItWorks:"Start short, build to the longest rep, then come back down. Total about 4 miles including rest.",
    goal:"Classic track workout — builds speed and endurance simultaneously, distances change so it never gets monotonous",
    score:"Total time including rest",
    tip:"The 1200m is where most people fall apart. Save something going into it. Remember — reps get shorter after the peak.",
    rx:{label:"Rx",standards:["All 7 reps","90 second rest","Faster on the way back down"]},
    scaled:{label:"Scaled",standards:["Drop the 1200m","Walk the rest periods"]},
    exercises:["Sprint (100m)"], eq:[], minTime:25, maxTime:45 },

  { name:"Fartlek 20", format:"AMRAP", displayFormat:"Fartlek Run", timeCap:20,
    workout:"20-Minute Fartlek Run:\n5 min easy warm-up\nThen alternate every minute:\nOdd minutes: Hard effort (8/10)\nEven minutes: Easy effort (4/10)\nLast 2 min easy cool-down",
    howItWorks:"Fartlek means 'speed play' in Swedish. Alternate between hard and easy effort every minute. No stopping — easy minutes are your recovery.",
    goal:"Build aerobic capacity and speed without rigid intervals — one of the most popular running workouts worldwide",
    score:"Total distance covered",
    tip:"On hard minutes push until breathing is labored. On easy minutes actually recover. The temptation is to run easy minutes too fast.",
    rx:{label:"Rx",standards:["20 continuous minutes","True contrast between hard and easy efforts"]},
    scaled:{label:"Scaled",standards:["10-15 minutes","30s hard / 90s easy ratio"]},
    exercises:["Sprint (100m)"], eq:[], minTime:18, maxTime:25 },

  { name:"Cooper 12-Minute Run", format:"AMRAP", displayFormat:"For Distance", timeCap:12,
    workout:"Run as far as possible in 12 minutes.\n\nDeveloped by Dr. Kenneth Cooper for the US Air Force in 1968.\nStill used by militaries and sports teams worldwide.",
    howItWorks:"Start the clock. Run 12 minutes. See how far you get. One of the most widely used fitness tests ever created.",
    goal:"Measure your VO2 max and aerobic base — the definitive 12-minute running benchmark",
    score:"Total distance in 12 minutes",
    tip:"Elite men cover 3000m+. Elite women 2700m+. Most recreational runners hit 2000-2500m. Pick a sustainable pace — don't sprint the first 400m.",
    rx:{label:"Rx",standards:["12 minutes continuous","Max distance — no walking"]},
    scaled:{label:"Scaled",standards:["Run/walk is fine","Track your honest distance"]},
    exercises:["Sprint (100m)"], eq:[], minTime:10, maxTime:14 },

  { name:"30-20-10 Sprints", format:"AMRAP", displayFormat:"Interval Run", timeCap:20,
    workout:"5 Rounds:\n30 sec easy jog → 20 sec moderate → 10 sec all-out sprint\nRest 2 minutes between rounds\n\nNo rest within the 60-second round.",
    howItWorks:"Within each round: 30s easy into 20s moderate into 10s sprint continuously. 2 full minutes rest between rounds.",
    goal:"Danish research showed this protocol improved 5K time 4% and VO2 max significantly in 7 weeks — highly time-efficient",
    score:"Rounds completed",
    tip:"The 10-second sprint must be genuinely all-out. If round 8 feels like round 1, you went too easy.",
    rx:{label:"Rx",standards:["5 rounds","True max effort on 10s sprint","Full 2 min rest between rounds"]},
    scaled:{label:"Scaled",standards:["3 rounds","Walk the 30s easy portion"]},
    exercises:["Sprint (100m)"], eq:[], minTime:18, maxTime:25 },

  { name:"800m Descending Ladder", format:"AMRAP", displayFormat:"Track Ladder", timeCap:30,
    workout:"800m → 600m → 400m → 200m\n\n2 minutes rest between each.\nRun each rep faster than the last.",
    howItWorks:"Descending distances with 2 minute rest. Each rep should be faster — the 200m is an all-out sprint.",
    goal:"Speed development — the descending ladder forces progressive acceleration as fatigue builds",
    score:"Time for each rep — goal is to get faster every rep",
    tip:"If your 200m isn't faster per 200m than your 800m pace, you went out too hard. Start controlled.",
    rx:{label:"Rx",standards:["Negative split — each rep faster","2 min rest between reps"]},
    scaled:{label:"Scaled",standards:["400m / 300m / 200m / 100m","3 min rest between reps"]},
    exercises:["Sprint (100m)"], eq:[], minTime:20, maxTime:35 },

  { name:"Tempo Run", format:"AMRAP", displayFormat:"Steady State Run", timeCap:30,
    workout:"5 min easy warm-up\n20 min tempo pace (comfortably hard — 7/10 effort)\n5 min easy cool-down\n\nTotal: 30 minutes",
    howItWorks:"Tempo pace is the fastest pace you can hold while still feeling in control. Should feel 'comfortably hard' — short sentences only.",
    goal:"The single most effective workout for improving race pace and lactate threshold — every serious runner does these weekly",
    score:"Total distance at tempo pace",
    tip:"If you can have a normal conversation, go faster. If you can't say 4 words, slow down. That middle ground is the training zone.",
    rx:{label:"Rx",standards:["20 continuous minutes at tempo","No walking during tempo portion"]},
    scaled:{label:"Scaled",standards:["10-15 min tempo","2 x 8 min with 2 min rest"]},
    exercises:["Sprint (100m)"], eq:[], minTime:28, maxTime:35 },

  { name:"Sprint Tabata", format:"AMRAP", displayFormat:"Tabata Sprints", timeCap:16,
    workout:"8 Rounds:\n20 seconds all-out sprint\n10 seconds walk/complete rest\n\n4 minutes of total work. Leave nothing behind.",
    howItWorks:"Tabata protocol applied to sprinting. 20s max effort, 10s complete rest, 8 rounds. Simple, brutal, proven.",
    goal:"The original Tabata research showed massive VO2 max improvement in 6 weeks — equally effective running",
    score:"Distance covered during work intervals or just completion",
    tip:"All-out means all-out. By round 5 you should be seriously hurting. If round 8 feels like round 1, you went too easy.",
    rx:{label:"Rx",standards:["Max effort each 20s interval","Complete stop or slow walk during 10s rest"]},
    scaled:{label:"Scaled",standards:["4-6 rounds","30s rest instead of 10s"]},
    exercises:["Sprint (100m)"], eq:[], minTime:14, maxTime:18 },

  { name:"5K Time Trial", format:"AMRAP", displayFormat:"For Time", timeCap:45,
    workout:"Run 5 kilometers (3.1 miles) as fast as possible.\n\n5K = 12.5 laps on a standard 400m track.\n\nRun this every 4-6 weeks to track your progress.",
    howItWorks:"A timed 5K. No intervals, no structure — cover 3.1 miles as fast as you can. One of the most common fitness benchmarks in the world.",
    goal:"The universal running benchmark — used by beginners and Olympians alike to track fitness",
    score:"Total time to complete 5K",
    tip:"Most people go out too fast. Pick a pace you can hold through mile 3 — not just mile 1. Even splits beat a fast start and a death march.",
    rx:{label:"Rx",standards:["5K / 3.1 miles","Full effort — not a training run"]},
    scaled:{label:"Scaled",standards:["1 mile or 2K time trial","Run/walk and track your time"]},
    exercises:["Sprint (100m)"], eq:[], minTime:20, maxTime:60 },

  // ── WARM-UP / MOBILITY / STRETCHING ───────────────────────────────────────
  { name:"10-Minute Full Body Warm-Up", format:"AMRAP", displayFormat:"Movement Prep", timeCap:10, category:"mobility",
    workout:"2 minutes — Easy jog in place or jumping jacks\n\n30 seconds each, 2 rounds:\n• Leg swings (forward/back)\n• Arm circles (big, both directions)\n• Hip circles\n• World's Greatest Stretch (each side)\n• Inch worm with push-up\n• Squat to stand\n• Lateral lunges",
    howItWorks:"Move continuously through all movements. This is prep, not exercise — keep intensity low and focus on feel.",
    goal:"Prime every major joint and muscle for training — reduces injury risk and improves workout performance",
    score:"Completion — all movements done with control",
    tip:"The World's Greatest Stretch is called that for a reason — don't skip it. One rep each side takes 20 seconds and opens your hips, thoracic spine, and hamstrings simultaneously.",
    rx:{label:"Rx",standards:["Control every movement","Feel the stretch — don't rush","Dynamic, not static"]},
    scaled:{label:"Scaled",standards:["Do what feels good","Skip anything painful"]},
    exercises:["Lunges","Air Squats"], eq:[], minTime:8, maxTime:15 },

  { name:"Limber 11", format:"AMRAP", displayFormat:"Mobility Routine", timeCap:15, category:"mobility",
    workout:"Joe DeFranco's Limber 11 — do each for 10 reps or 30 seconds:\n1. IT Band Foam Roll\n2. Adductor Foam Roll\n3. SMR Glutes\n4. Bent-Knee Iron Cross\n5. Roll-Overs into V-Sits\n6. Rocking Frog Stretch\n7. Fire Hydrant Circles (10 each direction)\n8. Mountain Climbers (slow)\n9. Cossack Squat\n10. Seated Piriformis Stretch\n11. Rear Foot Elevated Hip Flexor Stretch",
    howItWorks:"Work through all 11 movements in order. Popularized by strength coach Joe DeFranco — one of the most shared mobility routines on the internet.",
    goal:"Restore hip mobility, open the thoracic spine, and fix the pattern restrictions that sitting creates — do this daily",
    score:"Completion",
    tip:"The Cossack squat will expose your weakest side immediately. Go slow, hold the bottom, and breathe. Most people are dramatically tighter on one side.",
    rx:{label:"Rx",standards:["All 11 movements","Slow and controlled","Breathe into the stretch"]},
    scaled:{label:"Scaled",standards:["Skip any painful movements","Use a wall or chair for balance"]},
    exercises:["Lunges","Mountain Climbers"], eq:[], minTime:12, maxTime:20 },

  { name:"Yoga Flow — Sun Salutation", format:"AMRAP", displayFormat:"Yoga Flow", timeCap:15, category:"mobility",
    workout:"5 Rounds of Sun Salutation A:\nMountain Pose → Forward Fold → Half Lift → Plank → Chaturanga → Upward Dog → Downward Dog (5 breaths) → Forward Fold → Mountain Pose\n\nThen 5 Rounds of Sun Salutation B:\nAdd Chair Pose and Warrior 1 each side",
    howItWorks:"Classic yoga sequence used by millions worldwide. Move with your breath — inhale to lengthen, exhale to fold.",
    goal:"Full-body mobility, posterior chain opening, and breath control — the foundation of yoga practice",
    score:"Completion with controlled breathing",
    tip:"The transition from plank to chaturanga (low push-up) is where most beginners collapse. Keep elbows in, lower slowly. Drop your knees if needed.",
    rx:{label:"Rx",standards:["All transitions linked to breath","Downward dog held for 5 breaths"]},
    scaled:{label:"Scaled",standards:["Knees down in chaturanga","Hold each pose longer — no rush"]},
    exercises:["Push-Ups","Plank Hold"], eq:[], minTime:12, maxTime:20 },

  { name:"Hip Flexor & Hamstring Reset", format:"AMRAP", displayFormat:"Mobility Routine", timeCap:10, category:"mobility",
    workout:"Hold each 60 seconds per side:\n1. Kneeling hip flexor stretch (90-90)\n2. Pigeon pose\n3. Standing hamstring stretch (bent over)\n4. Supine figure-4 glute stretch\n5. Seated forward fold\n\nRepeat the full sequence twice.",
    howItWorks:"The 5 stretches that address the tightest areas in most gym athletes — hips and hamstrings shortened by sitting and heavy squatting.",
    goal:"Restore hip mobility and hamstring length — the two most common restrictions that limit squat depth and cause lower back pain",
    score:"Completion — all stretches held full duration",
    tip:"60 seconds feels like forever. Stay in it. Research shows stretches held under 30 seconds provide minimal lasting benefit.",
    rx:{label:"Rx",standards:["60 seconds per position per side","2 full rounds"]},
    scaled:{label:"Scaled",standards:["30 seconds per position","Skip any painful positions"]},
    exercises:["Plank Hold"], eq:[], minTime:8, maxTime:15 },

  { name:"Upper Body Activation", format:"AMRAP", displayFormat:"Movement Prep", timeCap:10, category:"mobility",
    workout:"2 rounds of 10 reps each:\n• Band pull-aparts (or arms in doorway)\n• Wall slides\n• Shoulder circles (big)\n• Thoracic rotations (seated)\n• Cat-cow (10 breaths)\n• Prone Y-T-W raises\n• Neck half-circles (slow)\n\nFinish: 30 seconds dead hang from pull-up bar",
    howItWorks:"Activates the rotator cuff, opens the thoracic spine, and primes the scapular stabilizers before any pressing or pulling session.",
    goal:"Prep the shoulder complex for pressing and pulling — skipping this before bench or overhead press is how shoulders get hurt",
    score:"Completion",
    tip:"Wall slides look easy and are humbling. Keep your lower back flat against the wall and arms in contact the entire movement. Most people can't do it.",
    rx:{label:"Rx",standards:["Full range on every movement","30-second dead hang at end"]},
    scaled:{label:"Scaled",standards:["Skip the hang if shoulder issues","Reduce range on any painful movement"]},
    exercises:["Pull-Ups"], eq:["Pull-up bar"], minTime:8, maxTime:14 },

  { name:"Squat Mobility Routine", format:"AMRAP", displayFormat:"Mobility Routine", timeCap:10, category:"mobility",
    workout:"2 rounds of 45 seconds each:\n• Ankle circles (each direction)\n• Ankle rocks (seated)\n• Goblet squat hold with elbows on knees (no weight)\n• Hip airplanes\n• Deep squat breathing (breathe in the bottom)\n• Cossack squats (slow, each side)\n• Hip 90-90 stretch\n\nFinish: 10 slow bodyweight squats focusing on depth",
    howItWorks:"Addresses every restriction that limits squat depth — ankles, hips, and thoracic spine. Do this before any squat session.",
    goal:"Unlock your squat pattern — most depth limitations come from ankles or hips, not flexibility",
    score:"Completion",
    tip:"The deep squat hold is diagnostic. If you can't hold the bottom with a flat back and heels down, your ankles need work. Elevate heels with plates temporarily while you fix it.",
    rx:{label:"Rx",standards:["Hold each position fully","Deep squat hold heels flat on floor"]},
    scaled:{label:"Scaled",standards:["Heels elevated if needed","Hold a rack or door for balance"]},
    exercises:["Air Squats"], eq:[], minTime:8, maxTime:14 },

  { name:"Full Body Stretch — Post Workout", format:"AMRAP", displayFormat:"Cool-Down Stretch", timeCap:15, category:"mobility",
    workout:"Hold each stretch 45-60 seconds:\n1. Standing quad stretch\n2. Standing calf stretch\n3. Seated hamstring stretch\n4. Pigeon pose (each side)\n5. Doorway chest stretch\n6. Cross-body shoulder stretch\n7. Tricep overhead stretch\n8. Child's pose\n9. Supine twist (each side)\n10. Savasana — lie still for 2 minutes",
    howItWorks:"A complete cool-down sequence targeting every major muscle used in a typical training session. Rated the most shared post-workout routine on fitness apps.",
    goal:"Accelerate recovery, reduce next-day soreness, and restore resting muscle length after training",
    score:"Completion — especially the 2-minute Savasana most people skip",
    tip:"Savasana at the end isn't optional. Two minutes of complete stillness after training significantly improves parasympathetic recovery. Put the phone down.",
    rx:{label:"Rx",standards:["45-60 seconds per stretch","2 full minutes of stillness at end"]},
    scaled:{label:"Scaled",standards:["30 seconds per stretch","Skip any painful positions"]},
    exercises:["Plank Hold","Sit-Ups"], eq:[], minTime:12, maxTime:20 },

  { name:"Morning Mobility Routine", format:"AMRAP", displayFormat:"Morning Routine", timeCap:10, category:"mobility",
    workout:"Do each for 45 seconds — no equipment needed:\n• Neck rolls (slow)\n• Thoracic extension over bed or floor\n• Cat-cow\n• Hip circles (standing)\n• Leg swings\n• Inchworm\n• Downward dog to upward dog\n• Deep squat hold\n• Arm circles\n• World's Greatest Stretch each side",
    howItWorks:"A 10-minute wake-up routine that undoes the stiffness from sleep and gets every joint moving. Popular on YouTube with millions of views.",
    goal:"Start the day with full range of motion restored — people who do morning mobility consistently report less chronic stiffness and better performance",
    score:"Completion — ideally done before coffee",
    tip:"Thoracic extension over a foam roller or the edge of your bed sounds weird and feels incredible. The thoracic spine is the most restricted area for most desk workers.",
    rx:{label:"Rx",standards:["All movements done before any caffeine","Focus on feel, not reps"]},
    scaled:{label:"Scaled",standards:["5 movements is enough to start","Add more over time"]},
    exercises:["Mountain Climbers","Plank Hold"], eq:[], minTime:8, maxTime:14 },

  { name:"Foam Roll & Release", format:"AMRAP", displayFormat:"Recovery Session", timeCap:15, category:"mobility",
    workout:"Spend 90 seconds on each area — pause on tender spots:\n1. IT band (each side)\n2. Quads (each side)\n3. Hamstrings (each side)\n4. Glutes / piriformis\n5. Upper back / thoracic spine\n6. Lats (each side)\n7. Calves (each side)\n\nFollow with 5 minutes of light stretching on the tightest areas.",
    howItWorks:"Self-myofascial release — a method used by physical therapists, athletes, and trainers worldwide. Breaks up adhesions and improves blood flow to recovering muscle.",
    goal:"Active recovery — reduces DOMS, restores range of motion, and accelerates the repair process between sessions",
    score:"Completion — all areas addressed",
    tip:"When you find a tender spot, pause there and breathe for 20-30 seconds instead of rolling through it. The pause is where the release happens.",
    rx:{label:"Rx",standards:["90 seconds per area","Pause on tender spots","Foam roller needed"]},
    scaled:{label:"Scaled",standards:["A lacrosse ball works for glutes and IT band","Even without a roller, the stretches work"]},
    exercises:["Plank Hold"], eq:[], minTime:12, maxTime:20 },

  { name:"The 5-Minute Warm-Up", format:"AMRAP", displayFormat:"Quick Warm-Up", timeCap:5, category:"mobility",
    workout:"30 seconds each, no rest:\n1. Jumping jacks\n2. Arm circles (forward)\n3. Arm circles (backward)\n4. Hip circles\n5. Leg swings (forward/back, each leg)\n6. High knees\n7. Butt kicks\n8. Inchworm\n9. World's Greatest Stretch (one side each)\n10. Squat to stand",
    howItWorks:"The absolute minimum effective warm-up for any training session. 5 minutes, zero equipment, full body preparation.",
    goal:"Raise core temperature and prime every major joint pattern before training — non-negotiable even on the busiest days",
    score:"Completion",
    tip:"This is the floor, not the ceiling. If you have more time, use it. But 5 minutes of this is infinitely better than zero.",
    rx:{label:"Rx",standards:["Move continuously","Every movement done"]},
    scaled:{label:"Scaled",standards:["Any movement counts","Do what you can in 5 minutes"]},
    exercises:["Air Squats","Mountain Climbers"], eq:[], minTime:4, maxTime:8 },
];

// Pick a curated WOD matching the user's equipment and time
const pickCuratedWod = (form) => {
  const t = Number(form.time);
  const eq = form.equipment || ["None"];
  const hasPullBar  = eq.includes("Pull-up bar") || eq.includes("Full Gym");
  const hasKB       = eq.includes("Kettlebells")  || eq.includes("Full Gym");
  const hasDB       = eq.includes("Dumbbells")    || eq.includes("Full Gym") || eq.includes("Barbell");
  const hasBarbell  = eq.includes("Barbell")      || eq.includes("Full Gym");
  const hasBox      = eq.includes("Box")          || eq.includes("Full Gym");
  const hasWallBall = eq.includes("Wall Ball")    || eq.includes("Full Gym");

  const matches = CURATED_WODS.filter(w => {
    if (t < w.minTime || t > w.maxTime) return false;
    if (w.eq.includes("Pull-up bar") && !hasPullBar) return false;
    if (w.eq.includes("Kettlebells") && !hasKB)      return false;
    if (w.eq.includes("Dumbbells")   && !hasDB)      return false;
    if (w.eq.includes("Barbell")     && !hasBarbell) return false;
    if (w.eq.includes("Box")         && !hasBox)     return false;
    if (w.eq.includes("Wall Ball")   && !hasWallBall) return false;
    return true;
  });

  if (!matches.length) return null;
  return matches[Math.floor(Math.random() * matches.length)];
};

// ─── CHALLENGE GENERATOR ─────────────────────────────────────────────────────
const buildChallenge = (form) => {
  // Mobility/warm-up focus — always pull from dedicated pool, ignore time window
  if (form.focus === "Warm-up / Mobility") {
    const mobilityWods = CURATED_WODS.filter(w => w.category === "mobility");
    if (mobilityWods.length) return mobilityWods[Math.floor(Math.random() * mobilityWods.length)];
  }

  // Always try curated database first — quality guaranteed
  // Only skip curated if user specified a specific exercise preference
  const hasPrimaryEx = form.exercise && form.exercise.trim().length > 0;
  if (!hasPrimaryEx) {
    // First pass: strict equipment + time match
    const curated = pickCuratedWod(form);
    if (curated) return curated;
    // Second pass: relax time window by ±5 minutes
    const relaxed = pickCuratedWod({ ...form, time: String(Number(form.time) + 5) })
      || pickCuratedWod({ ...form, time: String(Math.max(5, Number(form.time) - 5)) });
    if (relaxed) return relaxed;
    // Third pass: bodyweight only (always available)
    const bw = CURATED_WODS.filter(w => w.eq.length === 0);
    if (bw.length) return bw[Math.floor(Math.random() * bw.length)];
  }
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
  useWakeLock(timerOn); // keep screen on while challenge timer is running
  const [done,     setDone]     = useState(false);
  const [reps,     setReps]     = useState(0);
  const [exReps,   setExReps]   = useState({}); // {exName: count} for multi-exercise tracking
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
  const exLines = result.workout.split("\n").filter(l => {
    const t = l.trim();
    if (!t) return false;                          // blank
    if (t.startsWith("—") || t === "—") return false; // dividers
    if (/^(for time|amrap|emom|tabata|rounds|block|min|time cap|repeat|target|rest|complete all)/i.test(t)) return false; // headers
    if (/^\d+[\-–]\d+\s+min/i.test(t)) return false; // "10-min AMRAP:" style
    if (t.endsWith(":") && !t.match(/^\d/)) return false; // "For Time:" labels
    if (/^(round|minute|interval|cycle|then|beat)/i.test(t)) return false; // round labels
    return true;
  }).slice(0, 5);
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
    setReps(0); setExReps({}); setSetLog([]); setRounds(0);
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

        {/* Rep counter — per exercise when multiple exist, single counter otherwise */}
        {showRepCounter && !restOn && !done && (
          <Card style={{ padding:"16px 20px", marginBottom:14 }}>
            <div style={{ color:T.mu, fontSize:10, fontWeight:700, letterSpacing:1.2, fontFamily:T.fn, marginBottom:12 }}>
              {isMaxReps ? `SET ${setLog.length + 1} OF ${totalSets} — REP COUNT` : "REP COUNT"}
            </div>
            {exLines.length > 1 ? (
              // Multi-exercise: show a counter per exercise
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {exLines.map((ex, xi) => {
                  const key = xi + "_" + ex.slice(0, 20);
                  const val = exReps[key] || 0;
                  const exName = ex.replace(/^\d+\s+/, "").trim();
                  return (
                    <div key={xi} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ flex:1, fontFamily:T.fn, fontSize:12, color:T.mu, overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{exName}</div>
                      <button onClick={() => setExReps(r => ({ ...r, [key]: Math.max(0, (r[key]||0)-1) }))}
                        style={{ width:36, height:36, borderRadius:10, background:T.hi, border:"1px solid "+T.bo,
                          fontSize:20, color:T.mu, cursor:"pointer", fontWeight:700, display:"flex",
                          alignItems:"center", justifyContent:"center", flexShrink:0 }}>−</button>
                      <div style={{ fontFamily:T.mo, fontSize:22, fontWeight:700, color, width:40, textAlign:"center" }}>{val}</div>
                      <button onClick={() => setExReps(r => ({ ...r, [key]: (r[key]||0)+1 }))}
                        style={{ width:36, height:36, borderRadius:10, background:color+"20", border:"1px solid "+color+"50",
                          fontSize:20, color, cursor:"pointer", fontWeight:700, display:"flex",
                          alignItems:"center", justifyContent:"center", flexShrink:0 }}>+</button>
                    </div>
                  );
                })}
                <div style={{ borderTop:"1px solid "+T.bo, paddingTop:10, display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:T.mu, fontSize:11, fontFamily:T.fn }}>Total reps this round</span>
                  <span style={{ color, fontFamily:T.mo, fontWeight:700, fontSize:14 }}>
                    {Object.values(exReps).reduce((a,b) => a+b, 0)}
                  </span>
                </div>
              </div>
            ) : (
              // Single exercise: big counter
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
            )}
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
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);
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
      const entry = { ...r, form: { ...form }, ts: Date.now(), id: Date.now() };
      setHistory(h => [entry, ...h.filter(x => x.name !== r.name)].slice(0, 10));
    }, 900);
  };

  const refine = async () => {
    if (!refineText.trim() || !result) return;
    setRefining(true);

    try {
      if (!GROQ_API_KEY) throw new Error("no key");

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1200,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content: `You are an expert CrossFit and strength coach editing a generated workout. 
The user will give you the current workout details and a refinement request.
Return ONLY a valid JSON object — no markdown, no code fences, no explanation.
Keep the same format, time cap, and structure. Only change what the user asks for.
Required fields:
{
  "name": string,
  "workout": string,
  "exercises": string[],
  "howItWorks": string,
  "goal": string,
  "score": string,
  "tip": string,
  "rx": {"label": "Rx", "standards": string[]},
  "scaled": {"label": "Scaled", "standards": string[]},
  "timeCap": string,
  "displayFormat": string,
  "format": string
}`
            },
            {
              role: "user",
              content: `Current workout:\n${JSON.stringify(result, null, 2)}\n\nRefinement request: ${refineText}`
            }
          ]
        })
      });

      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      const updated = JSON.parse(clean);
      const newResult = { ...result, ...updated };
      setResult(newResult);
      setRefineText("");
      const entry = { ...newResult, form: { ...form }, ts: Date.now(), id: Date.now() };
      setHistory(h => [entry, ...h.filter(x => x.name !== newResult.name)].slice(0, 10));

    } catch (e) {
      // Groq unavailable or no key — use exclusion-based local logic
      const req = refineText.toLowerCase();

      // Extract what the user wants to AVOID
      // Handles: "swap X", "no X", "remove X", "swap out X", "replace X", "without X", "instead of X"
      const avoidTerms = [];
      const avoidPatterns = [
        /(?:swap out?|replace|change|remove|drop|no|without|instead of|hate|don't want|dont want)\s+(?:the\s+)?([a-z][a-z\s\-]*?)(?:\s+(?:for|with|to|and)|$)/gi,
        /([a-z][a-z\s\-]+?)\s+(?:is too hard|are too hard|hurt|hurts|kills)/gi,
      ];
      for (const pat of avoidPatterns) {
        let m;
        while ((m = pat.exec(req)) !== null) {
          avoidTerms.push(m[1].trim());
        }
      }

      // Extract what the user wants to ADD / swap IN
      const wantTerms = [];
      const wantPatterns = [
        /(?:swap.*?for|replace.*?with|change.*?to|add|include|use|want)\s+(?:some\s+)?([a-z][a-z\s\-]+?)(?:\s+instead|\s+instead of|$)/gi,
      ];
      for (const pat of wantPatterns) {
        let m;
        while ((m = pat.exec(req)) !== null) {
          wantTerms.push(m[1].trim());
        }
      }

      // Build filtered curated pool — exclude current workout and any WOD containing avoided exercises
      const currentName = result?.name || "";
      const filtered = CURATED_WODS.filter(w => {
        if (w.name === currentName) return false; // always give something new
        // Check equipment constraints
        const eq = form.equipment || ["None"];
        const hasPullBar = eq.includes("Pull-up bar") || eq.includes("Full Gym");
        const hasKB      = eq.includes("Kettlebells")  || eq.includes("Full Gym");
        const hasDB      = eq.includes("Dumbbells")    || eq.includes("Full Gym") || eq.includes("Barbell");
        const hasBox     = eq.includes("Box")          || eq.includes("Full Gym");
        const hasWallBall= eq.includes("Wall Ball")    || eq.includes("Full Gym");
        if (w.eq.includes("Pull-up bar") && !hasPullBar) return false;
        if (w.eq.includes("Kettlebells") && !hasKB)      return false;
        if (w.eq.includes("Dumbbells")   && !hasDB)      return false;
        if (w.eq.includes("Box")         && !hasBox)     return false;
        if (w.eq.includes("Wall Ball")   && !hasWallBall) return false;
        // Filter out WODs containing exercises the user wants to avoid
        if (avoidTerms.length > 0) {
          const exText = (w.workout + " " + w.exercises.join(" ")).toLowerCase();
          const avoided = avoidTerms.some(term =>
            term.length >= 3 && exText.includes(term.split(" ")[0])
          );
          if (avoided) return false;
        }
        return true;
      });

      let newResult;
      if (filtered.length > 0) {
        newResult = filtered[Math.floor(Math.random() * filtered.length)];
      } else {
        // Nothing matched — pick anything different from current
        const different = CURATED_WODS.filter(w => w.name !== currentName && w.eq.length === 0);
        newResult = different.length > 0
          ? different[Math.floor(Math.random() * different.length)]
          : buildChallenge(form);
      }

      setResult(newResult);
      setRefineText("");
      const entry = { ...newResult, form: { ...form }, ts: Date.now(), id: Date.now() };
      setHistory(h => [entry, ...h.filter(x => x.name !== newResult.name)].slice(0, 10));
    }

    setRefining(false);
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
            <OptRow label="TIME AVAILABLE" field="time" options={["5","10","15","20","30","45","60"]} />
            <OptRow label="EXERCISES" field="exerciseCount" options={["1","2","3"]} />
            <OptRow label="BODY PART FOCUS" field="focus" options={["Upper body","Lower body","Core","Full body","Warm-up / Mobility"]} />
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: T.mu, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, fontFamily: T.fn, marginBottom: 8 }}>
                EQUIPMENT <span style={{ color: T.di, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select all that apply)</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["None","Pull-up bar","Dumbbells","Kettlebells","Barbell","Box","Wall Ball"].map(o => {
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
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              <Btn ch="&#8635; New" onClick={() => setResult(null)} ghost
                style={{ flex:1, padding:14, borderRadius:12 }} />
              <Btn ch="Regenerate" onClick={generate} color={fmtColor}
                style={{ flex:1, padding:14, borderRadius:12 }} />
            </div>

            {/* Refinement panel */}
            <Card style={{ padding:"16px 18px" }}>
              <div style={{ color:T.di, fontSize:9, fontWeight:700, letterSpacing:1.5, fontFamily:T.fn, marginBottom:8 }}>TWEAK THIS WORKOUT</div>
              <div style={{ color:T.mu, fontSize:12, fontFamily:T.fn, marginBottom:10, lineHeight:1.5 }}>
                Don't like something? Tell me what to change.
              </div>
              <textarea
                value={refineText}
                onChange={e => setRefineText(e.target.value)}
                placeholder={`e.g. "swap push-ups for squats" or "make it shorter" or "replace pull-ups with ring rows"`}
                style={{ width:"100%", background:T.hi, border:"1px solid "+T.bo, borderRadius:10,
                  padding:"11px 13px", fontFamily:T.fn, fontSize:13, color:T.tx, resize:"none",
                  outline:"none", minHeight:70, lineHeight:1.6, marginBottom:10 }}
              />
              <Btn
                ch={refining ? "Updating..." : "Apply Changes"}
                onClick={refine}
                color={fmtColor}
                disabled={!refineText.trim() || refining}
                style={{ width:"100%", padding:13, borderRadius:10, fontSize:13 }}
              />
            </Card>
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
  home: (_active, _color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3l9 9" stroke="#6A6880" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke="#6A6880" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v11h14V10" stroke="#6A6880" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const Nav = ({ tab, setTab, hasProg, onHome }) => {
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
      {/* Home button — always visible, takes user back to welcome screen */}
      <div onClick={onHome}
        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4,
          cursor:"pointer", padding:"7px 12px", borderRadius:10 }}>
        {NAV_ICONS.home(false, T.mu)}
        <span style={{ fontFamily:T.fn, fontSize:9, fontWeight:700,
          color:T.mu, letterSpacing:0.5 }}>HOME</span>
      </div>
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
      <div style={{ minHeight:"100vh", padding:"52px 20px 90px" }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:T.fn, fontWeight:800, fontSize:26, color:T.tx, margin:"0 0 4px" }}>Today</h1>
          <p style={{ color:T.mu, fontSize:13, margin:0, fontFamily:T.fn }}>Based on your recent training.</p>
        </div>
        <SmartRecommendation logs={logs} cal={[]} existMx={mx} onStart={(day, c) => { setWday(day); setWcolor(c); }} />
        <div style={{ marginTop:16 }}>
          <Btn ch="Pick a Program" onClick={() => setSc("welcome")} color={T.ac}
            style={{ width:"100%", padding:13, borderRadius:12, fontSize:14 }} />
        </div>
      </div>
    );
    if (tab === "today")  return <Today     cal={cal} pname={pname} pcolor={pcolor} logs={logs} onStart={d => setWday(d)} existMx={mx} />;
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
      }} hasProg={!!ap} onHome={() => setSc("welcome")} />
    </div>
  );
}
