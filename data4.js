/* v4: bloodwork + health checks, badges. */
(function () {
  const P = window.PLAN;
  P.HEALTH = {
    rounds: [
      { id: 'base', label: 'Baseline', when: 'Thu 26 or Fri 27 Nov 2026, before week 1' },
      { id: 'recheck', label: 'Re-check', when: 'Sat 6 Feb 2027 (week 10), before Ramadan' }
    ],
    prep: [
      'Morning, ideally 8–10 am, after 10–12 hours without food. Water is fine and helps.',
      'No hard training for 24–48 hours before. Exercise temporarily raises liver enzymes, CK and creatinine.',
      'Stop the B-complex 2–3 days before: most contain biotin, which can distort thyroid and some other results.',
      'Tell the doctor you take creatine: it raises blood creatinine a little without meaning kidney trouble.',
      'Do the re-check the same way, ideally at the same lab, so the numbers compare.'
    ],
    tests: [
      { id: 'cbc', n: 'Complete blood count (CBC)', who: 'both', why: 'Baseline for anaemia, infection and overall health.' },
      { id: 'ferritin', n: 'Ferritin + iron panel (iron, TIBC, transferrin saturation)', who: 'both', why: 'Iron stores. Heavy training and dieting both drain iron; especially important for Yousr. Ask the doctor what range they want for an endurance athlete.', key: 'b' },
      { id: 'crp', n: 'hs-CRP', who: 'both', why: 'Inflammation. Also needed to read ferritin correctly, since inflammation pushes ferritin up.' },
      { id: 'vitd', n: 'Vitamin D (25-OH)', who: 'both', why: 'Sets the right D3 dose for both of you.' },
      { id: 'b12', n: 'Vitamin B12 + folate', who: 'both', why: 'Energy and red blood cells. Anyone taking a B-complex will read high; that\'s expected.' },
      { id: 'a1c', n: 'HbA1c + fasting glucose', who: 'both', why: 'Blood-sugar baseline. Weight loss and training should improve it.' },
      { id: 'lipids', n: 'Lipid profile (cholesterol, LDL, HDL, triglycerides)', who: 'both', why: 'Heart-health baseline. Usually improves with fat loss.' },
      { id: 'thyroid', n: 'TSH + free T4', who: 'both', why: 'Thyroid drives metabolism, energy and how easily weight comes off.' },
      { id: 'kidney', n: 'Kidney: creatinine, eGFR, urea', who: 'both', why: 'Baseline before a high-protein diet and creatine. Mention creatine to the doctor.' },
      { id: 'liver', n: 'Liver: ALT, AST, GGT', who: 'both', why: 'Baseline. Supplements and hard training can nudge these.' },
      { id: 'lytes', n: 'Electrolytes + magnesium (Na, K, Ca, Mg)', who: 'both', why: 'You sweat a lot across 8 sessions a week; checks the magnesium supplement too.' },
      { id: 'urine', n: 'Urinalysis', who: 'both', why: 'Cheap, simple baseline.' },
      { id: 'zinc', n: 'Zinc + copper', who: 'a', why: 'Daily zinc can lower copper over time. Worth checking at both rounds.' },
      { id: 'testo', n: 'Total testosterone + SHBG (8–10 am)', who: 'a', why: 'Optional. Useful if energy, recovery or mood drop while dieting.', optional: true },
      { id: 'uric', n: 'Uric acid', who: 'a', why: 'Optional. A high-protein diet can raise it in some people.', optional: true },
      { id: 'omega', n: 'Omega-3 index', who: 'both', why: 'Optional. Shows whether the omega-3 dose is doing anything.', optional: true },
      { id: 'insulin', n: 'Fasting insulin (HOMA-IR)', who: 'both', why: 'Optional. More sensitive than glucose alone.', optional: true }
    ],
    other: [
      { n: 'Blood pressure + resting heart rate', why: 'At home, seated, first thing in the morning, once a month. Resting heart rate drifting up for days is an early sign of overtraining or illness.' },
      { n: 'Doctor check / ECG', why: 'Before starting if either of you has a family history of heart disease or sudden death, or ever gets chest pain, fainting or palpitations during exercise.' },
      { n: 'Shoulder and movement screen with a sports physio', why: 'One session at the start. Swimmers\' shoulders take the most load, and catching an imbalance early is cheaper than an injury.' },
      { n: 'Cycle changes (women)', why: 'If a period becomes irregular or stops during the diet, tell a doctor. With this much training it can be a sign of not eating enough (low energy availability), and the fix is more food, not more discipline.' }
    ],
    labs: 'Large lab chains in Cairo offer these panels and home sample collection; ask for a "sports" or "full check-up" package and add the extra tests.'
  };

  P.BADGES = [
    { id: 'first-weigh', n: 'First weigh-in', d: 'Log your first morning weight' },
    { id: 'streak7', n: '7-day streak', d: 'Check in 7 days in a row' },
    { id: 'streak21', n: '21-day streak', d: 'Check in 21 days in a row' },
    { id: 'perfect', n: 'Perfect week', d: 'All 4 gym sessions and 4 swims in one week' },
    { id: 'kg1', n: 'First kilo', d: 'Lose 1 kg (7-day average)' },
    { id: 'kg3', n: 'Three down', d: 'Lose 3 kg (7-day average)' },
    { id: 'halfway', n: 'Halfway there', d: 'Reach 50% of your target' },
    { id: 'target', n: 'Target reached', d: 'Hit your goal weight' },
    { id: 'km10', n: '10 km swum', d: 'Log 10 km in the pool' },
    { id: 'km50', n: '50 km swum', d: 'Log 50 km in the pool' },
    { id: 'pr1', n: 'New best', d: 'Beat your best load on a key lift' },
    { id: 'pr10', n: 'Ten bests', d: 'Set 10 personal bests' },
    { id: 'tests', n: 'Tested', d: 'Log a full round of benchmark tests' },
    { id: 'blood', n: 'Health baseline', d: 'Log baseline bloodwork' }
  ];
  const SX = {
    A: { short: 'Circuit + Core', purpose: 'Builds your engine. A fast full-body circuit and core work raise your heart rate high, burn a lot of calories and train you to hold a tight streamline when you\'re tired, without loading your legs or shoulders before Tuesday\'s swim.', aims: ['Hold the same pace every round: the last round should look like the first.', 'Core holds with your lower back flat on the floor the whole time.', 'Finisher: every 30-second sprint within about 15% of your first one.'] },
    B: { short: 'Glutes + Mobility', purpose: 'Shapes and strengthens your glutes and hamstrings for a stronger, more durable kick, then restores the hip, ankle and shoulder range that swimming needs.', aims: ['Stop each set 1–2 reps short of failure: you swim on Wednesday.', 'Add weight on hip thrusts and RDLs once you hit every rep.', 'Mobility: a clear stretch, never pain. Breathe out into each position.'] },
    C: { short: 'Lower Power', purpose: 'Turns leg strength into speed off the wall and the block. Jumps come first while you\'re fresh, then heavy lower-body lifts paired with jumps to teach the muscles to fire fast.', aims: ['Every jump at full effort with soft, quiet landings. Stop the set if your height drops.', 'Heavy lift: the last rep is hard but clean, with no grinding.', 'Rest fully between plyo sets (60–90 s): this is quality, not cardio.'] },
    D: { short: 'Upper Strength', purpose: 'Builds the pulling and pushing strength behind a stronger catch and pull, explosive power through the core, and the shoulder care that protects you through heavy swim volume.', aims: ['Throws and plyo push-ups fast and crisp, not tired.', 'Add weight on pull-ups and bench once you hit every rep.', 'Never skip the shoulder-care block at the end.'] }
  };
  Object.keys(SX).forEach((k) => Object.assign(P.SESSIONS[k], SX[k]));
  // No whey by default: keep it only as an alternative
  P.MEALS.s_milk = { cat: 'protein', n: 'Milk, dates + boiled eggs', ar: 'لبن وبلح وبيض',
    a: [['low-fat milk', 400, 'ml', '1⅔ cups'], ['boiled eggs', 100, 'g', '2 large'], ['dates', 30, 'g', '3']], ak: [410, 27],
    b: [['low-fat milk', 250, 'ml', '1 cup'], ['boiled egg', 50, 'g', '1 large'], ['dates', 20, 'g', '2']], bk: [250, 15] };
  P.MEALS.s_whey.n = 'Whey shake (optional)';
  P.MEALS.s_whey.altOnly = true;
  [P.DAYS, P.RDAYS].forEach((map) => Object.values(map).forEach((D) => D.items.forEach((it) => { if (it[4] === 's_whey') { it[4] = 's_milk'; if (it[3]) it[3] = it[3].replace('shake', 'snack').replace('Shake between pool and gym', 'Snack between pool and gym'); } })));
  const pud = P.RECIPES.find((r) => r.id === 'pudding');
  pud.ing = pud.ing.map((x) => (x[0].startsWith('vanilla whey') ? ['Greek yogurt, stirred in after cooking', '200 g'] : x));
  pud.steps = pud.steps.map((x) => x.replace('whisk in whey, honey and rose water', 'stir in the Greek yogurt, honey and rose water'));
  pud.macros = 'Per cup ≈ 190 kcal · 12 g protein';
  pud.tip = 'Let it cool before adding the yogurt, or it can split.';
  P.GROCERIES.forEach((g) => { g.items = g.items.filter((x) => !x.startsWith('Whey')); });
  P.GROCERIES[0].items.push('Extra eggs + milk for post-gym snacks');
  P.SWAPS.protein.rows = P.SWAPS.protein.rows.map((r) => (r.startsWith('1 scoop whey') ? '300 g Greek yogurt or 4 boiled eggs' : r));
  // Trimmed set
  const keepB = ['streak7', 'streak21', 'perfect', 'kg1', 'halfway', 'target', 'km50', 'pr1'];
  P.BADGES = P.BADGES.filter((b) => keepB.includes(b.id));
  P.HEALTH.tests = P.HEALTH.tests.filter((t) => !t.optional);
  P.BENCH.tests = P.BENCH.tests.filter((t) => ['broad', 'pullups', 't100', 't400'].includes(t.id));
  P.BENCH.tests.find((t) => t.id === 'broad').when = 'Thursday\'s Lower Power session, after the warm-up';
  P.BENCH.tests.find((t) => t.id === 'pullups').when = 'Saturday\'s Upper Strength session, after the warm-up';
  P.BENCH.tests.find((t) => t.id === 't400').how = 'All-out, even pacing, after 5–8 min easy following the 100.';
  P.BENCH.tests.find((t) => t.id === 't100').how = 'Push start, all-out.';
  P.WEIGH.inbody = P.WEIGH.inbody.filter((x) => x.date !== '2027-02-19');
  P.WEIGH.inbody.find((x) => x.date === '2027-02-05').label = 'Final';
})();
