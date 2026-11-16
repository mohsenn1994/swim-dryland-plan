/* Additions: meals with gram + household units, Ramadan, supplements, units, tests, weigh-ins. */
(function () {
  const P = window.PLAN;
  // item: [food, amount, unit ('g' | 'ml'), household]
  P.MEALS = {
    b_ful: { cat: 'breakfast', n: 'Ful + eggs', ar: 'فول وبيض',
      a: [['ful medames, cooked', 170, 'g', '1 cup'], ['olive oil', 5, 'ml', '1 tsp'], ['whole eggs', 150, 'g', '3 large'], ['egg whites', 66, 'g', '2 whites'], ['baladi bread', 100, 'g', '1 loaf'], ['tomato + cucumber', 200, 'g', '1 + 1 medium']], ak: [760, 50],
      b: [['ful medames, cooked', 130, 'g', '¾ cup'], ['whole eggs', 100, 'g', '2 large'], ['egg white', 33, 'g', '1 white'], ['baladi bread', 50, 'g', '½ loaf'], ['salad veg', 150, 'g', '1 bowl'], ['orange', 150, 'g', '1 medium']], bk: [520, 33] },
    b_areesh: { cat: 'breakfast', n: 'Eggs + areesh cheese', ar: 'بيض وجبنة قريش',
      a: [['whole eggs', 150, 'g', '3 large'], ['egg whites', 66, 'g', '2 whites'], ['oil for the pan', 5, 'ml', '1 tsp'], ['areesh cheese', 150, 'g', '⅔ cup'], ['baladi bread', 100, 'g', '1 loaf'], ['cucumber, tomato, rocca', 200, 'g', '1 plate']], ak: [700, 56],
      b: [['whole eggs', 100, 'g', '2 large'], ['egg white', 33, 'g', '1 white'], ['areesh cheese', 120, 'g', '½ cup'], ['baladi bread', 50, 'g', '½ loaf'], ['veg', 150, 'g', '1 bowl'], ['guava', 100, 'g', '1 medium']], bk: [500, 38] },
    b_shak: { cat: 'breakfast', n: 'Shakshuka', ar: 'شكشوكة',
      a: [['whole eggs', 150, 'g', '3 large'], ['egg whites', 100, 'g', '3 whites'], ['tomato-pepper sauce', 200, 'g', '1 cup'], ['light white cheese', 40, 'g', '2 tbsp crumbled'], ['baladi bread', 100, 'g', '1 loaf']], ak: [720, 52],
      b: [['whole eggs', 100, 'g', '2 large'], ['egg whites', 66, 'g', '2 whites'], ['tomato-pepper sauce', 150, 'g', '¾ cup'], ['light white cheese', 30, 'g', '1½ tbsp'], ['baladi bread', 50, 'g', '½ loaf'], ['orange', 150, 'g', '1 medium']], bk: [490, 36] },
    b_oats: { cat: 'breakfast', n: 'Greek yogurt oat bowl', ar: 'زبادي بالشوفان',
      a: [['Greek yogurt (0–2%)', 300, 'g', '1¼ cups'], ['oats, dry', 60, 'g', '⅔ cup'], ['banana', 120, 'g', '1 medium'], ['dates', 20, 'g', '2'], ['nuts', 15, 'g', '~10 almonds']], ak: [730, 45],
      b: [['Greek yogurt (0–2%)', 200, 'g', '¾ cup'], ['oats, dry', 40, 'g', '½ cup'], ['banana', 60, 'g', '½'], ['date', 10, 'g', '1'], ['nuts', 10, 'g', '~7 almonds']], bk: [480, 30] },

    l_chicken: { cat: 'lunch', n: 'Grilled chicken, rice + salad', ar: 'فراخ مشوية ورز',
      a: [['chicken breast, cooked (≈290 g raw)', 220, 'g', '1 large breast'], ['white rice, cooked (≈100 g dry)', 300, 'g', '1½ cups'], ['green salad', 250, 'g', '1 big bowl'], ['tahina', 15, 'g', '1 tbsp']], ak: [880, 76],
      b: [['chicken breast, cooked (≈200 g raw)', 150, 'g', '1 medium breast'], ['white rice, cooked (≈70 g dry)', 200, 'g', '1 cup'], ['green salad', 200, 'g', '1 bowl'], ['tahina', 15, 'g', '1 tbsp']], bk: [610, 52] },
    l_fish: { cat: 'lunch', n: 'Grilled fish + sayadeya rice', ar: 'سمك مشوي ورز صيادية',
      a: [['bolti / sea bass, cooked fillet (≈450 g whole fish)', 280, 'g', '2 fillets'], ['sayadeya rice, cooked', 300, 'g', '1½ cups'], ['tahina salad', 100, 'g', '½ cup']], ak: [860, 66],
      b: [['fish fillet, cooked (≈320 g whole fish)', 200, 'g', '1½ fillets'], ['sayadeya rice, cooked', 200, 'g', '1 cup'], ['tahina salad', 100, 'g', '½ cup']], bk: [600, 46] },
    l_molokhia: { cat: 'lunch', n: 'Molokhia, chicken + rice', ar: 'ملوخية بالفراخ',
      a: [['molokhia (made with 5 g ghee)', 300, 'ml', '1 big bowl'], ['skinless chicken, cooked', 220, 'g', '1 large breast or 2 thighs'], ['white rice, cooked', 200, 'g', '1 cup']], ak: [820, 72],
      b: [['molokhia', 250, 'ml', '1 bowl'], ['skinless chicken, cooked', 150, 'g', '1 medium breast'], ['white rice, cooked', 150, 'g', '¾ cup']], bk: [580, 50] },
    l_kofta: { cat: 'lunch', n: 'Kofta, baladi + tahina salad', ar: 'كفتة مشوية',
      a: [['lean kofta, grilled (≤10% fat; ≈260 g raw)', 200, 'g', '5 pieces'], ['baladi bread', 100, 'g', '1 loaf'], ['grilled veg', 200, 'g', '1 plate'], ['tahina salad', 100, 'g', '½ cup']], ak: [860, 56],
      b: [['lean kofta, grilled', 140, 'g', '3–4 pieces'], ['baladi bread', 50, 'g', '½ loaf'], ['grilled veg', 150, 'g', '¾ plate'], ['salad', 150, 'g', '1 bowl']], bk: [580, 40] },
    l_bamya: { cat: 'lunch', n: 'Bamya or fasolia with beef + rice', ar: 'بامية / فاصوليا باللحمة',
      a: [['lean beef, cooked', 180, 'g', '~6 cubes'], ['bamya / fasolia stew', 250, 'g', '1¼ cups'], ['white rice, cooked', 200, 'g', '1 cup']], ak: [820, 58],
      b: [['lean beef, cooked', 130, 'g', '~4 cubes'], ['bamya / fasolia stew', 200, 'g', '1 cup'], ['white rice, cooked', 150, 'g', '¾ cup']], bk: [580, 42] },

    d_shawarma: { cat: 'dinner', n: 'Homemade chicken shawarma plate', ar: 'شاورما فراخ بيتي',
      a: [['chicken, yogurt-spice marinade, cooked', 200, 'g', '1 heaped plate'], ['baladi bread', 50, 'g', '½ loaf'], ['salad + pickles', 200, 'g', '1 bowl'], ['tahina', 15, 'g', '1 tbsp']], ak: [600, 62],
      b: [['chicken, cooked', 150, 'g', '1 plate'], ['baladi bread', 50, 'g', '½ loaf'], ['salad + pickles', 150, 'g', '1 bowl'], ['tahina', 15, 'g', '1 tbsp']], bk: [450, 46] },
    d_tuna: { cat: 'dinner', n: 'Tuna salad + baladi', ar: 'سلطة تونة',
      a: [['tuna in water, drained', 240, 'g', '2 cans'], ['boiled eggs', 100, 'g', '2 large'], ['big salad', 300, 'g', '1 large bowl'], ['olive oil + lemon', 5, 'ml', '1 tsp'], ['baladi bread', 100, 'g', '1 loaf']], ak: [620, 70],
      b: [['tuna in water, drained', 120, 'g', '1 can'], ['boiled egg', 50, 'g', '1 large'], ['big salad', 250, 'g', '1 bowl'], ['baladi bread', 50, 'g', '½ loaf']], bk: [400, 40] },
    d_kebda: { cat: 'dinner', n: 'Alexandrian liver (max once a week)', ar: 'كبدة إسكندراني',
      a: [['beef liver, cooked (≈220 g raw)', 180, 'g', '1 plate'], ['peppers, garlic, onion', 100, 'g', '1 pepper + ½ onion'], ['baladi bread', 50, 'g', '½ loaf'], ['salad', 200, 'g', '1 bowl']], ak: [560, 50],
      b: [['beef liver, cooked', 130, 'g', '¾ plate'], ['peppers + onion', 80, 'g', '½ pepper'], ['baladi bread', 50, 'g', '½ loaf'], ['salad', 150, 'g', '1 bowl']], bk: [420, 38] },
    d_omelette: { cat: 'dinner', n: 'Veg omelette + areesh', ar: 'أومليت خضار وقريش',
      a: [['whole eggs', 150, 'g', '3 large'], ['egg whites', 100, 'g', '3 whites'], ['peppers, onion, tomato', 150, 'g', '1 cup chopped'], ['areesh cheese', 100, 'g', 'scant ½ cup'], ['baladi bread', 50, 'g', '½ loaf']], ak: [560, 52],
      b: [['whole eggs', 100, 'g', '2 large'], ['egg whites', 66, 'g', '2 whites'], ['veg', 120, 'g', '¾ cup chopped'], ['areesh cheese', 80, 'g', '⅓ cup'], ['baladi bread', 50, 'g', '½ loaf']], bk: [420, 38] },
    d_lentil: { cat: 'dinner', n: 'Lentil soup + grilled chicken', ar: 'شوربة عدس وفراخ',
      a: [['lentil soup', 450, 'ml', '1½ bowls'], ['grilled chicken, cooked', 150, 'g', '1 medium breast']], ak: [620, 62],
      b: [['lentil soup', 300, 'ml', '1 bowl'], ['grilled chicken, cooked', 110, 'g', '1 small breast']], bk: [420, 42] },

    p_banana: { cat: 'pre', n: 'Banana + dates', ar: 'موز وبلح', a: [['banana', 120, 'g', '1 medium'], ['dates', 30, 'g', '3']], ak: [240, 3], b: [['banana', 120, 'g', '1 medium'], ['date', 10, 'g', '1']], bk: [140, 2] },
    p_toast: { cat: 'pre', n: 'Toast + honey + egg', ar: 'توست بالعسل', a: [['toast', 50, 'g', '2 slices'], ['honey', 7, 'g', '1 tsp'], ['boiled egg', 50, 'g', '1 large']], ak: [260, 12], b: [['toast', 25, 'g', '1 slice'], ['honey', 7, 'g', '1 tsp'], ['boiled egg', 50, 'g', '1 large']], bk: [170, 9] },
    p_zabadi: { cat: 'pre', n: 'Zabadi + dates', ar: 'زبادي وبلح', a: [['plain zabadi', 170, 'g', '1 cup'], ['dates', 30, 'g', '3']], ak: [230, 9], b: [['plain zabadi', 170, 'g', '1 cup'], ['date', 10, 'g', '1']], bk: [150, 8] },
    p_tiny: { cat: 'early', n: 'Banana or dates + water', ar: 'موزة أو بلحتين', a: [['banana (or 2–3 dates, 25 g)', 120, 'g', '1 medium'], ['water', 300, 'ml', '1 large glass']], ak: [110, 1], b: [['banana (or 2 dates, 20 g)', 90, 'g', '¾ banana'], ['water', 300, 'ml', '1 large glass']], bk: [90, 1] },

    s_whey: { cat: 'protein', n: 'Whey shake', ar: 'بروتين شيك', a: [['whey protein', 45, 'g', '1½ scoops'], ['low-fat milk', 250, 'ml', '1 cup']], ak: [330, 46], b: [['whey protein', 30, 'g', '1 scoop'], ['low-fat milk', 200, 'ml', '¾ cup']], bk: [220, 31] },
    s_greek: { cat: 'protein', n: 'Greek yogurt + fruit', ar: 'زبادي يوناني وفاكهة', a: [['Greek yogurt (0–2%)', 250, 'g', '1 cup'], ['orange or guava', 150, 'g', '1 medium']], ak: [270, 26], b: [['Greek yogurt (0–2%)', 170, 'g', '⅔ cup'], ['orange', 75, 'g', '½ medium']], bk: [170, 18] },
    s_termis: { cat: 'protein', n: 'Termis + areesh', ar: 'ترمس وجبنة قريش', a: [['termis (lupini), soaked', 160, 'g', '1 cup'], ['areesh cheese', 100, 'g', 'scant ½ cup'], ['cucumber', 150, 'g', '1 large']], ak: [240, 32], b: [['termis (lupini), soaked', 80, 'g', '½ cup'], ['areesh cheese', 80, 'g', '⅓ cup'], ['cucumber', 150, 'g', '1 large']], bk: [150, 22] },
    s_eggs: { cat: 'protein', n: 'Boiled eggs + veg', ar: 'بيض مسلوق وخضار', a: [['boiled eggs', 150, 'g', '3 large'], ['cucumber, carrots', 150, 'g', '1 + 1']], ak: [240, 19], b: [['boiled eggs', 100, 'g', '2 large'], ['veg sticks', 150, 'g', '1 cup']], bk: [160, 13] },

    r_iftar: { cat: 'iftar', n: 'Break the fast: water, dates + soup', ar: 'فطار: مية وبلح وشوربة',
      a: [['water', 500, 'ml', '2 glasses'], ['dates', 30, 'g', '3'], ['lentil soup', 250, 'ml', '1 bowl']], ak: [280, 12],
      b: [['water', 500, 'ml', '2 glasses'], ['dates', 20, 'g', '2'], ['lentil soup', 250, 'ml', '1 bowl']], bk: [240, 11] },
    r_qatayef: { cat: 'treat', n: 'Ramadan sweet (planned, not daily)', ar: 'حلويات رمضان',
      a: [['baked qatayef with nuts or konafa', 80, 'g', '2 qatayef or a 5 cm square']], ak: [300, 5],
      b: [['baked qatayef or konafa', 50, 'g', '1 qatayef or a small square']], bk: [190, 3] }
  };
  P.CATS.iftar = 'Break the fast';
  P.CATS.treat = 'Ramadan sweet';
  P.CATS.suhoor = 'Suhoor';

  P.RAMADAN = {
    start: '2027-02-08', // expected first fast; confirmed by moon sighting
    fajr: '~5:10 am', maghrib: '~5:40 pm',
    rules: [
      'Training volume drops to deload level (about 60–70%). Keep top sets at an effort where you could do 3 more reps.',
      'Lift or do plyos about 2 hours after iftar, never fasted. Swims while fasting (Sat, Tue) are easy technique or aerobic sets only.',
      'Calorie targets stay the same. Split protein across iftar, the post-training snack and suhoor.',
      'Drink 2.5–3.5 L between iftar and suhoor: a glass every hour you\'re awake, not all at once.',
      'Suhoor: slow carbs + protein (ful, eggs, oats, Greek yogurt), little salt, as late as you can manage.',
      'Pool times often change in Ramadan. If they do, keep the rule: hard work after iftar, easy work while fasting.'
    ]
  };
  // Ramadan day plans keyed by getDay()
  P.RDAYS = {
    6: { name: 'Saturday (Ramadan)', type: 'train', swim: '1:00 pm (fasting: easy)', gym: 'D', items: [['03:45', 'meal', 'breakfast', 'Suhoor'], ['13:00', 'swim', 'Swim, fasting: easy technique and aerobic only'], ['17:40', 'meal', 'iftar'], ['18:15', 'meal', 'lunch', 'Iftar main meal'], ['20:00', 'gym', 'D'], ['21:15', 'meal', 'protein', 'Post-gym shake', 's_whey'], ['23:00', 'meal', 'protein', 'Late snack', 's_greek']] },
    0: { name: 'Sunday (Ramadan)', type: 'train', swim: '7:00 pm', items: [['03:45', 'meal', 'breakfast', 'Suhoor'], ['17:40', 'meal', 'iftar', 'Light iftar: swim in 80 min'], ['19:00', 'swim', 'Swim'], ['20:45', 'meal', 'lunch', 'Main meal after the swim'], ['23:00', 'meal', 'protein', 'Late snack', 's_termis']] },
    1: { name: 'Monday (Ramadan)', type: 'train', gym: 'A', items: [['03:45', 'meal', 'breakfast', 'Suhoor'], ['17:40', 'meal', 'iftar'], ['18:15', 'meal', 'lunch', 'Iftar main meal'], ['20:00', 'gym', 'A'], ['21:15', 'meal', 'protein', 'Post-gym shake', 's_whey'], ['23:00', 'meal', 'dinner', 'Light dinner']] },
    2: { name: 'Tuesday (Ramadan)', type: 'train', swim: '7:00 am (fasting: easy)', gym: 'B', items: [['03:45', 'meal', 'breakfast', 'Suhoor'], ['07:00', 'swim', 'Swim, fasting: easy aerobic, skip the hard set'], ['17:40', 'meal', 'iftar'], ['18:15', 'meal', 'lunch', 'Iftar main meal'], ['20:00', 'gym', 'B'], ['21:15', 'meal', 'protein', 'Post-gym shake', 's_whey'], ['23:00', 'meal', 'dinner', 'Light dinner']] },
    3: { name: 'Wednesday (Ramadan)', type: 'train', swim: '7:00 pm', items: [['03:45', 'meal', 'breakfast', 'Suhoor'], ['17:40', 'meal', 'iftar', 'Light iftar: swim in 80 min'], ['19:00', 'swim', 'Swim'], ['20:45', 'meal', 'lunch', 'Main meal after the swim'], ['23:00', 'meal', 'protein', 'Late snack', 's_termis']] },
    4: { name: 'Thursday (Ramadan)', type: 'train', gym: 'C', items: [['03:45', 'meal', 'breakfast', 'Suhoor'], ['17:40', 'meal', 'iftar'], ['18:15', 'meal', 'lunch', 'Iftar main meal'], ['20:00', 'gym', 'C'], ['21:15', 'meal', 'protein', 'Post-gym shake', 's_whey'], ['23:00', 'meal', 'dinner', 'Light dinner']] },
    5: { name: 'Friday (Ramadan)', type: 'rest', items: [['03:45', 'meal', 'breakfast', 'Suhoor'], ['17:40', 'meal', 'iftar'], ['18:15', 'meal', 'lunch', 'Iftar main meal: halve the rice'], ['21:30', 'meal', 'treat', 'If you want a sweet, have it here'], ['23:00', 'meal', 'protein', 'Late snack', 's_greek'], ['—', 'rest', 'Full rest: an evening walk after taraweeh counts']] }
  };

  // Key lifts tracked per session, with load increments (kg)
  P.KEYLIFTS = {
    A: [['kbswing', 4]],
    B: [['hipthrust', 5], ['rdl', 5], ['bss', 2]],
    C: [['trapbar', 5], ['slrdl', 2], ['stepup', 2]],
    D: [['pullup', 2.5], ['bench', 2.5], ['row1', 2], ['landmine', 2.5]]
  };

  // Default supplement stacks. when: breakfast | lunch | dinner | postgym | bed | any
  P.SUPPS = {
    a: [
      { name: 'Creatine monohydrate', dose: '5 g', when: 'breakfast', note: 'Every day, including rest days. Timing doesn\'t matter; consistency does. Expect +0.5–1 kg of water weight in the first 2–3 weeks.' },
      { name: 'Omega-3', dose: '1–2 g EPA + DHA combined', when: 'lunch', note: 'Read the label: count EPA + DHA, not total fish oil. Take with a meal that has fat.' },
      { name: 'B-complex', dose: '1 capsule', when: 'breakfast', note: 'Morning only (it can disturb sleep). It turns urine bright yellow, so don\'t judge hydration by colour for a few hours after.' },
      { name: 'Vitamin D3 + K2', dose: 'As labelled (often 1,000–2,000 IU D3 + 100–200 mcg K2)', when: 'lunch', note: 'Fat-soluble: take with your biggest meal. Ideally dose from a blood test.' },
      { name: 'Magnesium glycinate', dose: '200–400 mg elemental', when: 'bed', note: '30–60 min before bed. Supports sleep and recovery. Keep it a few hours apart from zinc.' },
      { name: 'Zinc', dose: '15–25 mg', when: 'dinner', note: 'With food to avoid nausea. Stay under 40 mg/day total; long-term high zinc lowers copper, so pick one with copper or take breaks.' },
      { name: 'L-carnitine L-tartrate (considering)', dose: '1–2 g', when: 'postgym', note: 'Optional. Fat-loss evidence is weak; there is some evidence for less soreness and better recovery. It only builds up in muscle when taken with carbs, daily, for about 12 weeks.', optional: true }
    ],
    b: []
  };
  P.WHEN = { breakfast: 'With breakfast / suhoor', lunch: 'With lunch / iftar meal', postgym: 'After training', dinner: 'With dinner', bed: 'Before bed', any: 'Any time' };

  P.BENCH = {
    rounds: [{ id: 'w1', label: 'Week 1', when: 'Sat 28 Nov – Fri 4 Dec' }, { id: 'w6', label: 'Week 6', when: 'Sat 2 – Fri 8 Jan' }, { id: 'w12', label: 'Week 12', when: 'Sat 13 – Fri 19 Feb' }],
    tests: [
      { id: 'broad', n: 'Broad jump', unit: 'cm', better: 'up', when: 'Thursday (C), after the warm-up', how: 'Best of 3, measured from the toe line to the back of the rear heel.' },
      { id: 'plank', n: 'Forearm plank hold', unit: 's', better: 'up', when: 'Thursday (C), end of session', how: 'Max time with a straight line from head to heels. Stop when hips sag.' },
      { id: 'pullups', n: 'Max strict pull-ups', unit: 'reps', better: 'up', when: 'Saturday (D), after the warm-up', how: 'Dead hang to chin over bar. If you can\'t do one yet, test the flexed-arm hang in seconds and write that in the note.' },
      { id: 'pushups', n: 'Push-ups in 60 s', unit: 'reps', better: 'up', when: 'Saturday (D), after pull-ups (rest 3 min)', how: 'Chest to fist height, full lockout.' },
      { id: 't100', n: '100 m freestyle', unit: 'time', better: 'down', when: 'Sunday or Wednesday swim, after warm-up', how: 'Push start, all-out. Rest 5 min before the 200.' },
      { id: 't200', n: '200 m freestyle', unit: 'time', better: 'down', when: 'Same swim, after the 100', how: 'All-out, push start. Used for your CSS pace.' },
      { id: 't400', n: '400 m freestyle', unit: 'time', better: 'down', when: 'Same swim, after 5–8 min easy', how: 'All-out, even pacing. CSS = (400 time − 200 time) ÷ 2 per 100 m.' }
    ],
    ramadanNote: 'If you\'re fasting in week 12, do the swim tests at an evening swim after iftar, or move them to week 10.'
  };

  P.WEIGH = {
    daily: ['Every morning, straight after the bathroom and before food, water or coffee.', 'Same scale on a hard floor, minimal clothing.', 'Log it on the Body tab. Only the 7-day average counts; daily numbers swing 1–2 kg with water and salt.'],
    weekly: ['Friday morning (rest day) is the "official" reading: same conditions every week.', 'Waist every other Friday (weeks 2, 4, 6, 8, 10, 12): tape level with the navel, relaxed, after breathing out.', 'Photos on the Fridays of weeks 1, 4, 8 and 12: same spot, light and time.'],
    inbody: [
      { date: '2026-11-27', label: 'Baseline', note: 'Friday before week 1' },
      { date: '2027-01-08', label: 'Mid-point', note: 'Friday of week 6' },
      { date: '2027-02-05', label: 'Final (pre-Ramadan)', note: 'Friday of week 10, the last reading with normal hydration' },
      { date: '2027-02-19', label: 'Optional end check', note: 'Friday of week 12. If you\'re fasting, hydration will skew it: compare with care' }
    ],
    inbodyRules: ['Morning, after the bathroom, nothing to eat or drink for 3+ hours (overnight is best).', 'No training, swimming, sauna or hot shower before the test. Thursday morning training is fine; Friday is rest.', 'No caffeine or alcohol the evening before, and avoid a very salty dinner.', 'Same machine, same time of day, metal off, feet and hands clean and dry.', 'For Yousr: readings are most comparable at the same point in her monthly cycle; the days just before a period can add water weight.', 'Focus on fat mass and skeletal muscle mass trends, not body-fat % from a single test.']
  };

  P.UNITS = {
    hand: [['Palm (thickness + size of your palm)', '≈ 100–120 g cooked meat or fish, ~25–30 g protein'], ['Fist', '≈ 1 cup: cooked rice, pasta, veg or fruit'], ['Cupped hand', '≈ 30 g: nuts, oats, dates'], ['Thumb', '≈ 1 tbsp: tahina, oil, ghee']],
    measures: [['1 cup', '240 ml · cooked rice ≈ 200 g · cooked ful ≈ 170 g · dry oats ≈ 90 g · Greek yogurt ≈ 245 g'], ['1 tbsp', '15 ml · oil ≈ 14 g · tahina ≈ 15 g · honey ≈ 21 g'], ['1 tsp', '5 ml · oil ≈ 4.5 g · honey ≈ 7 g · salt ≈ 6 g'], ['1 scoop whey', '≈ 30 g (check your tub)'], ['1 large egg', '≈ 50 g without shell; 1 white ≈ 33 g'], ['1 baladi loaf', '≈ 100 g (bakery loaves vary 80–130 g: weigh one)'], ['1 medium banana / orange', '≈ 120 g / 150 g peeled'], ['1 date', '≈ 8–10 g']],
    cooked: [['Rice', 'dry × 2.5–3 = cooked (100 g dry ≈ 280 g cooked)'], ['Pasta', 'dry × 2.2 = cooked'], ['Chicken breast', 'raw × 0.75 = cooked'], ['Lean beef / kofta', 'raw × 0.75 = cooked'], ['Fish fillet', 'raw × 0.8 = cooked'], ['Whole fish', '≈ 60% is edible fillet'], ['Lentils / ful (dry)', 'dry × 2.5 = cooked']],
    per100: [
      ['Chicken breast, cooked', 165, 31, 0, 4], ['Lean beef / kofta (10%), cooked', 217, 26, 0, 12], ['White fish, cooked', 120, 24, 0, 2], ['Tuna in water, drained', 116, 26, 0, 1], ['Beef liver, cooked', 175, 27, 5, 5],
      ['Whole egg (≈2 eggs)', 143, 13, 1, 10], ['Egg whites', 52, 11, 1, 0], ['Areesh cheese', 100, 13, 4, 4], ['Greek yogurt 0–2%', 70, 10, 4, 2], ['Low-fat milk 1.5% (per 100 ml)', 46, 3.4, 5, 1.5],
      ['White rice, cooked', 130, 2.7, 28, 0.3], ['Baladi bread', 250, 9, 50, 1.5], ['Ful medames, cooked', 110, 7.6, 19, 0.5], ['Lentils, cooked', 116, 9, 20, 0.4], ['Oats, dry', 380, 13, 66, 7], ['Potato, boiled', 87, 2, 20, 0.1], ['Termis (lupini), soaked', 119, 16, 10, 3],
      ['Banana', 89, 1.1, 23, 0.3], ['Dates', 280, 2.5, 75, 0.4], ['Orange', 47, 0.9, 12, 0.1], ['Tahina', 595, 17, 21, 54], ['Olive oil', 884, 0, 0, 100], ['Whey protein (typical)', 400, 78, 8, 6]
    ]
  };
})();
