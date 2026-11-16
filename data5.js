/* v5: missed/sick days, home versions, flex meals + free days. */
(function () {
  const P = window.PLAN;
  P.MISSED = {
    rules: [
      'Missed a gym session? If Friday is still free and you feel fresh, do it then. Otherwise skip it: never do two sessions in one day to catch up.',
      'Missed a swim? Just carry on. Add an easy 20-minute walk if you like, but don\'t make up the pool time on a rest day.',
      'Sick above the neck (blocked nose, mild sore throat): an easy swim or the home version is fine if you feel up to it.',
      'Sick below the neck (fever, chest, stomach, body aches): no training. Rest, eat at maintenance, drink plenty, and come back with a lighter day.',
      'Back after 3+ days off: do your first session at about 70% of your usual weights, then carry on as normal.',
      'Travelling or no gym: use the 25-minute home version of that day\'s session.',
      'Sick and travel days don\'t break your streak. Tap the button on Today so the plan knows.'
    ]
  };
  // 25-minute home / hotel versions (no equipment)
  P.HOME = {
    A: { rx: '3 rounds · 40 s on / 20 s off, then 2 rounds of core', items: [['High knees or jumping jacks', '40 s', 'bike'], ['Push-ups', '40 s', 'pushup'], ['Reverse lunges', '40 s', 'walklunge'], ['Plank shoulder taps', '40 s', 'planktap'], ['Squat jumps', '40 s', 'jumpsquat'], ['Mountain climbers', '40 s', 'mtnclimber'], ['Hollow hold', '30 s', 'hollow'], ['Flutter kicks', '30 s', 'flutter'], ['Dead bug', '10 / side', 'deadbug']] },
    B: { rx: '3 rounds, then 8 min of mobility', items: [['Single-leg glute bridge', '3 × 12 / leg', 'hipthrust'], ['Bulgarian split squat (back foot on a chair)', '3 × 10 / leg', 'bss'], ['Towel or sock leg curl on a smooth floor', '3 × 8', 'nordic'], ['Side-lying leg raise', '2 × 15 / side', 'bandwalk'], ['Side plank', '2 × 30 s / side', 'copenhagen'], ['Couch stretch, 90/90, ankle stretch', '60 s each', 'couch']] },
    C: { rx: 'Jumps first with full rest, then strength', items: [['Pogo hops', '2 × 20', 'pogo'], ['Squat jumps', '4 × 5', 'jumpsquat'], ['Broad jumps (if there\'s space)', '3 × 4', 'broadjump'], ['Skater hops', '3 × 5 / side', 'latbound'], ['Single-leg RDL (bodyweight, slow)', '3 × 10 / leg', 'slrdl'], ['Step-ups on a sturdy chair', '3 × 10 / leg', 'stepup'], ['Side plank', '2 × 30 s / side', 'pallof']] },
    D: { rx: 'Fast work first, then strength, then shoulder care', items: [['Fast push-ups', '3 × 6', 'plyopush'], ['Pike push-ups', '3 × 8', 'landmine'], ['Inverted row under a sturdy table (or towel door row)', '3 × 10', 'row1'], ['Superman pull (lying, pull elbows to ribs)', '3 × 12', 'pulldownSA'], ['Prone Y-T-W on the floor', '2 × 8 each', 'ytw'], ['Plank to downward dog', '2 × 10', 'rollout'], ['Hollow hold', '3 × 30 s', 'hollow']] }
  };
  P.FLEX = {
    flexKcal: { a: 1000, b: 700 },
    freeKcal: { a: 3700, b: 2800 },
    flexRules: [
      'One flex meal a week: eat what you like (koshari, feteer, a restaurant meal, dessert).',
      'Keep it to one meal and roughly {a} kcal for {A} or {b} kcal for {B}: the weekly deficit still holds.',
      'Start with the protein part of the meal and stop when you\'re full, not stuffed.',
      'Next meal, straight back to the plan. No skipping meals to "make up" for it.'
    ],
    freeRules: [
      'Planned every other Saturday (weeks 2, 4, 6, 8 and 10), after the swim and the gym, so the extra food goes into recovery. Move it to another day in the same 2 weeks, or skip it.',
      'Eat what you enjoy, up to about maintenance + 500 kcal. The other 6 days that week are set a little lower so the week still adds up.',
      'Still hit your protein, drink plenty of water, and keep it to one day.',
      'Expect the scale to jump 0.5–1.5 kg the next morning. That\'s water and food, not fat; it\'s gone within 2–3 days.'
    ]
  };
})();
