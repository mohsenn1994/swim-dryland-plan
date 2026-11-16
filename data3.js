/* Additions v3: muscle targets, tagged alternatives, recipes, Yousr's stack, swim practice parts. */
(function () {
  const P = window.PLAN;

  P.MUSCLES = {
    chest: 'Chest', frontdelt: 'Front shoulders', sidedelt: 'Side shoulders', reardelt: 'Rear shoulders', rotcuff: 'Rotator cuff', triceps: 'Triceps', biceps: 'Biceps', forearms: 'Forearms / grip',
    lats: 'Lats', upperback: 'Upper back (traps, rhomboids)', abs: 'Abs', obliques: 'Obliques', lowerback: 'Lower back', hipflex: 'Hip flexors',
    glutes: 'Glutes', gluteMed: 'Side glutes (glute med)', quads: 'Quads', hams: 'Hamstrings', adductors: 'Inner thighs (adductors)', calves: 'Calves', shins: 'Shins / ankles'
  };

  // id: [primary[], secondary[], aim, alternatives [[name, tag]]]
  const D = {
    kbswing: [['glutes', 'hams'], ['lowerback', 'abs', 'forearms'], 'Power: fast hip extension', [['Dumbbell swing', 'Same pattern'], ['Cable pull-through', 'Easier'], ['Banded hip hinge', 'No equipment'], ['Kettlebell high pull', 'Harder']]],
    pushup: [['chest', 'triceps'], ['frontdelt', 'abs'], 'Upper-body strength endurance', [['Incline push-up (hands on bench)', 'Easier'], ['Knee push-up', 'Easier'], ['Dumbbell floor press', 'Joint-friendly'], ['Feet-elevated push-up', 'Harder']]],
    walklunge: [['quads', 'glutes'], ['hams', 'adductors', 'calves'], 'Single-leg strength and endurance', [['Reverse lunge in place', 'Joint-friendly'], ['Split squat', 'Easier'], ['Step-ups', 'Same pattern'], ['Goblet walking lunge', 'Harder']]],
    renegade: [['lats', 'upperback', 'abs'], ['chest', 'triceps', 'obliques'], 'Anti-rotation core while pulling', [['Plank + single-arm band row', 'No equipment'], ['Bent-over dumbbell row', 'Easier'], ['Plank shoulder taps', 'Easier'], ['Renegade row + push-up', 'Harder']]],
    bike: [['quads', 'glutes'], ['hams', 'calves'], 'Conditioning: raises heart rate fast', [['SkiErg', 'Machine'], ['Rowing machine', 'Machine'], ['High knees', 'No equipment'], ['Jump rope', 'No equipment']]],
    mtnclimber: [['abs', 'hipflex'], ['frontdelt', 'quads'], 'Core endurance and conditioning', [['Slow cross-body climbers', 'Easier'], ['High knees', 'No equipment'], ['Plank jacks', 'Same pattern'], ['Slider mountain climbers', 'Harder']]],
    hollow: [['abs'], ['hipflex'], 'Core stiffness in streamline', [['Tuck hollow (knees bent)', 'Easier'], ['Dead bug hold', 'Easier'], ['Hollow rocks', 'Harder'], ['Hollow hold with plate', 'Harder']]],
    flutter: [['hipflex', 'abs'], ['quads'], 'Kick endurance from the hip', [['Scissor kicks', 'Same pattern'], ['Hollow hold', 'Easier'], ['Prone flutter on a bench', 'Swim-specific'], ['Ankle-weight flutter', 'Harder']]],
    deadbug: [['abs'], ['obliques', 'hipflex'], 'Core control with moving limbs', [['Bird dog', 'Easier'], ['Heel taps', 'Easier'], ['Banded dead bug', 'Harder'], ['Hollow hold', 'Harder']]],
    planktap: [['abs', 'obliques'], ['frontdelt'], 'Anti-rotation core', [['Forearm plank', 'Easier'], ['Bear crawl hold', 'Same pattern'], ['Renegade row', 'Harder'], ['Plank on knees with taps', 'Easier']]],
    bikeint: [['quads', 'glutes'], ['hams', 'calves'], 'VO2 max intervals', [['Rower 30/30', 'Machine'], ['SkiErg 30/30', 'Machine'], ['Hill or stair sprints', 'No equipment'], ['Burpees 20/40', 'No equipment']]],
    hipthrust: [['glutes'], ['hams', 'adductors'], 'Glute strength and shape', [['Smith machine hip thrust', 'Machine'], ['Dumbbell glute bridge (floor)', 'Easier'], ['Single-leg hip thrust', 'No equipment'], ['Hip thrust machine', 'Machine']]],
    rdl: [['hams', 'glutes'], ['lowerback', 'upperback', 'forearms'], 'Posterior-chain strength', [['Dumbbell RDL', 'Same pattern'], ['Cable pull-through', 'Joint-friendly'], ['Good morning', 'Harder'], ['45° back extension', 'Machine']]],
    bss: [['quads', 'glutes'], ['adductors', 'hams'], 'Single-leg strength, glute bias', [['Split squat (both feet down)', 'Easier'], ['Reverse lunge', 'Joint-friendly'], ['Single-leg leg press', 'Machine'], ['Smith machine split squat', 'Machine']]],
    nordic: [['hams'], ['glutes', 'calves'], 'Eccentric hamstring strength (injury-proofing)', [['Slider or towel leg curl', 'No equipment'], ['Swiss-ball leg curl', 'Easier'], ['Lying leg curl machine', 'Machine'], ['Band-assisted Nordic', 'Easier']]],
    kickback: [['glutes'], ['hams'], 'Glute isolation', [['Band kickback', 'No equipment'], ['Donkey kick on all fours', 'Easier'], ['Glute kickback machine', 'Machine'], ['Reverse hyper', 'Harder']]],
    bandwalk: [['gluteMed'], ['glutes'], 'Hip stability, knees tracking out', [['Hip abduction machine', 'Machine'], ['Side-lying clamshell', 'Easier'], ['Side-lying leg raise', 'No equipment'], ['Monster walk (diagonal)', 'Harder']]],
    copenhagen: [['adductors'], ['obliques', 'abs'], 'Inner-thigh strength (protects breaststroke knees)', [['Short-lever Copenhagen (knee on bench)', 'Easier'], ['Adductor machine', 'Machine'], ['Side plank', 'Easier'], ['Ball squeeze bridge', 'No equipment']]],
    couch: [['hipflex', 'quads'], [], 'Hip-flexor and quad length', [['Half-kneeling hip flexor stretch', 'Easier'], ['Standing quad stretch', 'Easier'], ['Low lunge', 'Same pattern']]],
    hip9090: [['glutes', 'gluteMed'], ['adductors', 'hipflex'], 'Hip rotation mobility', [['Pigeon stretch', 'Same pattern'], ['Figure-4 stretch on your back', 'Easier'], ['Seated butterfly', 'Easier']]],
    tspine: [['upperback', 'obliques'], [], 'Upper-back rotation', [['Open book (side-lying)', 'Easier'], ['Foam roller extensions', 'Same pattern'], ['Thread the needle', 'Same pattern']]],
    ankle: [['shins'], ['calves'], 'Pointed-toe ankle range for the kick', [['Seated toe-point stretch', 'Easier'], ['Ankle circles', 'Easier'], ['Pointed-toe calf raises', 'Same pattern']]],
    doorway: [['chest', 'frontdelt'], [], 'Chest and front-shoulder length', [['Floor pec stretch (lying)', 'Easier'], ['Band pec stretch', 'Same pattern'], ['Foam roller chest opener', 'Easier']]],
    sleeper: [['rotcuff', 'reardelt'], [], 'Shoulder internal-rotation range', [['Cross-body shoulder stretch', 'Easier'], ['Band internal rotation', 'Same pattern'], ['Doorway rear-shoulder stretch', 'Easier']]],
    pogo: [['calves'], ['shins', 'quads'], 'Reactive ankle stiffness', [['Jump rope (fast)', 'Same pattern'], ['Calf raises', 'Joint-friendly'], ['Single-leg pogo', 'Harder']]],
    boxjump: [['quads', 'glutes'], ['calves', 'hams'], 'Explosive vertical power', [['Squat jump', 'No equipment'], ['Step-up jump', 'Easier'], ['Tuck jump', 'Harder'], ['Seated box jump', 'Harder']]],
    broadjump: [['glutes', 'quads'], ['hams', 'calves'], 'Horizontal power (like the dive start)', [['Standing long jump to a line', 'Same pattern'], ['Kettlebell swing', 'Joint-friendly'], ['Squat jump', 'Easier'], ['Consecutive broad jumps', 'Harder']]],
    latbound: [['gluteMed', 'glutes'], ['quads', 'adductors', 'calves'], 'Lateral power and landing control', [['Skater hops (smaller)', 'Easier'], ['Lateral line hops', 'Easier'], ['Banded lateral walk', 'Joint-friendly'], ['Lateral box bound', 'Harder']]],
    streamjump: [['quads', 'glutes'], ['calves', 'abs', 'frontdelt'], 'Vertical power while holding streamline', [['Squat jump (arms free)', 'Easier'], ['Box jump', 'Same pattern'], ['Light-dumbbell jump squat', 'Harder']]],
    trapbar: [['glutes', 'quads', 'hams'], ['lowerback', 'upperback', 'forearms'], 'Maximum lower-body strength', [['Barbell back squat', 'Same pattern'], ['Goblet squat (heavy DB)', 'Easier'], ['Leg press', 'Machine'], ['Sumo deadlift', 'Same pattern']]],
    jumpsquat: [['quads', 'glutes'], ['calves'], 'Power right after heavy work (contrast)', [['Box jump', 'Same pattern'], ['Kettlebell swing', 'Joint-friendly'], ['Broad jump', 'Same pattern']]],
    slrdl: [['hams', 'glutes'], ['gluteMed', 'lowerback'], 'Single-leg hinge and balance', [['Kickstand RDL (back toe down)', 'Easier'], ['Cable single-leg RDL', 'Machine'], ['Romanian deadlift', 'Easier'], ['B-stance hip thrust', 'Joint-friendly']]],
    stepup: [['quads', 'glutes'], ['hams', 'calves'], 'Single-leg strength', [['Reverse lunge', 'Same pattern'], ['Bulgarian split squat', 'Harder'], ['Single-leg leg press', 'Machine'], ['Bodyweight step-up', 'Easier']]],
    pallof: [['obliques', 'abs'], [], 'Anti-rotation core', [['Half-kneeling Pallof press', 'Easier'], ['Side plank', 'No equipment'], ['Suitcase carry', 'Same pattern'], ['Pallof press with overhead reach', 'Harder']]],
    kneeraise: [['abs', 'hipflex'], ['forearms', 'lats'], 'Lower-ab strength and grip', [['Captain\'s chair knee raise', 'Machine'], ['Reverse crunch (floor)', 'Easier'], ['Lying leg raise', 'No equipment'], ['Hanging straight-leg raise', 'Harder']]],
    slam: [['lats', 'abs'], ['triceps', 'frontdelt', 'upperback'], 'Upper-body power (same path as the underwater pull)', [['Rope slams', 'Same pattern'], ['Fast cable straight-arm pulldown', 'Machine'], ['Band overhead slam', 'No equipment']]],
    rotthrow: [['obliques'], ['abs', 'glutes', 'frontdelt'], 'Rotational power', [['Fast cable woodchop', 'Machine'], ['Landmine rotation', 'Same pattern'], ['Band rotation', 'No equipment']]],
    plyopush: [['chest', 'triceps'], ['frontdelt', 'abs'], 'Upper-body explosiveness', [['Incline plyo push-up', 'Easier'], ['Med ball chest pass', 'Joint-friendly'], ['Fast push-up (no lift-off)', 'Easier'], ['Clap push-up', 'Harder']]],
    pullup: [['lats', 'biceps'], ['upperback', 'forearms', 'abs'], 'Pulling strength for the catch and pull', [['Band-assisted pull-up', 'Easier'], ['Lat pulldown', 'Machine'], ['Inverted row', 'Easier'], ['Weighted pull-up', 'Harder']]],
    bench: [['chest', 'triceps'], ['frontdelt'], 'Pushing strength', [['Dumbbell bench press', 'Joint-friendly'], ['Weighted push-up', 'No equipment'], ['Machine chest press', 'Machine'], ['Floor press', 'Joint-friendly']]],
    row1: [['lats', 'upperback'], ['biceps', 'reardelt', 'forearms'], 'Pulling strength, one side at a time', [['Seated cable row', 'Machine'], ['Chest-supported row', 'Joint-friendly'], ['Inverted row', 'No equipment'], ['Meadows row', 'Harder']]],
    pulldownSA: [['lats'], ['triceps', 'abs'], 'Lat strength through the catch-to-finish path', [['Band straight-arm pulldown', 'No equipment'], ['Dumbbell pullover', 'Same pattern'], ['Light med ball slam', 'Same pattern']]],
    landmine: [['frontdelt', 'chest'], ['triceps', 'abs', 'obliques'], 'Shoulder-friendly pressing', [['Half-kneeling single-arm DB press', 'Same pattern'], ['Arnold press (light)', 'Harder'], ['Push press', 'Harder'], ['Machine shoulder press', 'Machine']]],
    extrot: [['rotcuff'], ['reardelt'], 'Shoulder health for high swim volume', [['Side-lying DB external rotation', 'Same pattern'], ['Cable external rotation', 'Machine'], ['Band pull-apart', 'Easier']]],
    facepull: [['reardelt', 'upperback'], ['rotcuff'], 'Posture and shoulder health', [['Band face pull', 'No equipment'], ['Reverse fly', 'Same pattern'], ['Band pull-apart', 'Easier']]],
    ytw: [['upperback', 'reardelt'], ['rotcuff'], 'Shoulder-blade control', [['Prone Y-T-W on incline bench', 'Joint-friendly'], ['Band Y-T-W', 'No equipment'], ['Reverse fly', 'Same pattern']]],
    rollout: [['abs'], ['lats', 'obliques', 'hipflex'], 'Anti-extension core (no back arch)', [['Stability-ball rollout', 'Easier'], ['Plank walkouts', 'No equipment'], ['Long-lever plank', 'Easier'], ['Standing rollout', 'Harder']]],
    legswing: [['hipflex', 'hams'], [], 'Dynamic hip warm-up', [['Walking knee hugs', 'Same pattern']]],
    worlds: [['hipflex', 'hams'], ['upperback', 'glutes'], 'Full-body mobility warm-up', [['Spiderman lunge', 'Same pattern']]],
    pullapart: [['upperback', 'reardelt'], ['rotcuff'], 'Shoulder activation', [['Face pull', 'Same pattern']]],
    squatbw: [['quads', 'glutes'], [], 'Warm-up', [['Goblet squat (light)', 'Harder']]],
    rower: [['lats', 'quads', 'glutes'], ['hams', 'upperback', 'biceps'], 'Warm-up and conditioning', [['Bike', 'Machine'], ['SkiErg', 'Machine']]]
  };
  Object.keys(D).forEach((id) => { const ex = P.EX[id]; if (!ex) return; const [pri, sec, aim, alts] = D[id]; ex.pri = pri; ex.sec = sec; ex.aim = aim; ex.alts = alts; ex.alt = alts.map((a) => a[0]); });

  P.SUPPS.b = [
    { name: 'Creatine monohydrate', dose: '3–5 g', when: 'breakfast', note: 'Every day. Helps strength and power for women as much as men. May add ~0.5 kg of water weight early on; that\'s not fat.' },
    { name: 'Omega-3', dose: '1 g EPA + DHA combined', when: 'lunch', note: 'With a meal that has fat. Count EPA + DHA on the label, not total fish oil.' },
    { name: 'Vitamin D3 (+ K2)', dose: '1,000–2,000 IU D3', when: 'lunch', note: 'With the biggest meal. Ideally dose from a blood test.' },
    { name: 'Magnesium glycinate', dose: '200–300 mg elemental', when: 'bed', note: '30–60 min before bed, for sleep and recovery.' },
    { name: 'Iron (only if tested low)', dose: 'As prescribed', when: 'any', note: 'Female swimmers often run low on iron. Ask for a ferritin test first; don\'t take it blind. Take with vitamin C, away from tea, coffee, dairy and zinc.', optional: true }
  ];

  P.SWIM = {
    parts: ['Warm-up', 'Drill', 'Kick', 'Pull', 'Pre-set', 'Main set', 'Sprint', 'Cool-down'],
    strokes: ['Free', 'Back', 'Breast', 'Fly', 'IM', 'Choice', 'Kick', 'Pull', 'Drill'],
    template: [['Warm-up', 1, 400, 'Choice', '', 'Easy'], ['Drill', 4, 50, 'Free', ':15 rest', ''], ['Kick', 4, 50, 'Kick', '1:10', ''], ['Main set', 8, 100, 'Free', '1:45', ''], ['Cool-down', 1, 200, 'Choice', '', 'Easy']]
  };

  // Recipes: batch amounts cover both of you unless noted
  P.RECIPES = [
    { id: 'ful', n: 'Light ful medames', ar: 'فول مدمس خفيف', meals: ['b_ful'], time: '15 min', yields: '≈ 900 g: 3 breakfasts for both of you', split: 'Per breakfast: Ahmed 170 g (1 cup), Yousr 130 g (¾ cup)',
      ing: [['ful medames, canned', '3 cans (≈ 1.2 kg with liquid)'], ['water', '120 ml (½ cup)'], ['garlic', '2 cloves, crushed'], ['ground cumin', '1 tsp'], ['lemon juice', '1 lemon'], ['olive oil', '15 ml (1 tbsp), measured'], ['tomato, diced', '1 medium (120 g)'], ['parsley', 'small handful'], ['salt', 'to taste']],
      steps: ['Simmer the ful with the water for 8–10 minutes.', 'Mash about half, leave the rest whole.', 'Stir in garlic, cumin, lemon and salt.', 'Store plain. Add the measured olive oil, tomato and parsley when serving.'],
      macros: 'Per 100 g ≈ 115 kcal · 7 g protein · 18 g carbs · 2 g fat', tip: 'Restaurant ful often has 2–3 tbsp of oil or ghee per plate (≈ 300 kcal). Measure your 1 tsp each.' },
    { id: 'shak', n: 'Shakshuka for two', ar: 'شكشوكة', meals: ['b_shak'], time: '20 min', yields: '1 pan: one breakfast for both', split: 'Ahmed takes 3 eggs + 3 whites, Yousr 2 eggs + 2 whites, sauce split 60/40',
      ing: [['olive oil', '10 ml (2 tsp)'], ['onion, diced', '100 g (1 small)'], ['green pepper, diced', '150 g (1 large)'], ['tomatoes, grated', '400 g (3 medium)'], ['tomato paste', '15 g (1 tbsp)'], ['cumin, paprika, chilli flakes', '1 tsp, 1 tsp, pinch'], ['whole eggs', '5'], ['egg whites', '5 (165 g)'], ['light white cheese', '70 g'], ['baladi bread', '1½ loaves']],
      steps: ['Soften onion and pepper in the oil for 5 minutes.', 'Add tomatoes, paste and spices; simmer 8 minutes until thick.', 'Pour in the whites, stir gently, then make 5 wells and crack in the eggs.', 'Cover and cook 5–7 minutes until whites set. Crumble cheese on top.'],
      macros: 'Whole pan ≈ 1,190 kcal · 88 g protein', tip: 'The egg whites carry most of the protein for very few calories. Liquid egg whites in a carton save time.' },
    { id: 'oats', n: 'Greek yogurt oat bowl (or overnight oats)', ar: 'زبادي بالشوفان', meals: ['b_oats'], time: '5 min', yields: '1 bowl each', split: 'Ahmed: 300 g yogurt, 60 g oats · Yousr: 200 g yogurt, 40 g oats',
      ing: [['Greek yogurt 0–2%', '300 g / 200 g'], ['oats', '60 g / 40 g'], ['banana, sliced', '1 / ½'], ['dates, chopped', '2 / 1'], ['nuts', '15 g / 10 g'], ['cinnamon', 'pinch']],
      steps: ['Overnight: stir oats into yogurt with 60 ml milk or water, refrigerate.', 'Morning: top with banana, dates, nuts and cinnamon.'],
      macros: 'Ahmed ≈ 730 kcal · 45 g P · Yousr ≈ 480 kcal · 30 g P', tip: 'Good for suhoor in Ramadan: slow carbs plus protein that keeps you full.' },
    { id: 'chicken', n: 'Batch grilled chicken (yogurt-spice)', ar: 'فراخ مشوية', meals: ['l_chicken', 'l_molokhia', 'd_lentil'], time: '15 min + 1 h marinade + 20 min oven', yields: '2 kg raw ≈ 1.5 kg cooked: 4–5 days of chicken for both', split: 'Lunch: Ahmed 220 g, Yousr 150 g cooked',
      ing: [['chicken breast', '2 kg'], ['plain yogurt', '200 g'], ['lemon juice', '2 tbsp'], ['olive oil', '15 ml (1 tbsp)'], ['garlic', '5 cloves'], ['7-spice, paprika, cumin', '2 tsp, 2 tsp, 1 tsp'], ['salt, black pepper', '2 tsp, 1 tsp']],
      steps: ['Butterfly thick breasts so they cook evenly.', 'Mix everything else and coat the chicken. Marinate 1 hour or overnight.', 'Oven at 220 °C on a rack, 18–22 minutes (or grill pan), until 74 °C inside.', 'Rest 5 minutes, slice, and box in 220 g and 150 g portions.'],
      macros: 'Per 100 g cooked ≈ 165 kcal · 31 g protein', tip: 'Yogurt keeps breast meat juicy when reheated. Freeze anything beyond day 4.' },
    { id: 'molokhia', n: 'Light molokhia', ar: 'ملوخية خفيفة', meals: ['l_molokhia'], time: '25 min', yields: '≈ 1.2 L: 2 lunches for both', split: 'Per lunch: Ahmed 300 ml, Yousr 250 ml',
      ing: [['frozen molokhia', '400 g (1 pack)'], ['chicken stock, fat skimmed', '1 L'], ['garlic', '6 cloves, crushed'], ['ground coriander', '1 tbsp'], ['ghee', '10 g (2 tsp) instead of the usual 2–3 tbsp'], ['salt', 'to taste']],
      steps: ['Bring the stock to a simmer and stir in the frozen molokhia. Don\'t boil hard.', 'Fry the garlic and coriander in the ghee until golden (the ta\'leya).', 'Stir the ta\'leya into the molokhia, take it off the heat.', 'Serve with grilled chicken and measured rice.'],
      macros: 'Per 300 ml ≈ 90 kcal (without chicken and rice)', tip: 'Chill the stock first so you can lift the fat off the top.' },
    { id: 'shawarma', n: 'Homemade chicken shawarma + garlic yogurt', ar: 'شاورما فراخ بيتي', meals: ['d_shawarma'], time: '20 min + 30 min marinade', yields: '800 g raw ≈ 600 g cooked: 2 dinners for both', split: 'Per dinner: Ahmed 200 g, Yousr 150 g cooked',
      ing: [['chicken breast or thigh strips', '800 g'], ['plain yogurt', '150 g'], ['vinegar', '2 tbsp'], ['garlic', '4 cloves'], ['shawarma spice (cumin, coriander, cardamom, cinnamon, allspice, paprika, turmeric)', '1 tbsp total'], ['oil', '10 ml (2 tsp)'], ['Sauce: Greek yogurt + garlic + lemon + salt', '200 g yogurt']],
      steps: ['Marinate the chicken in yogurt, vinegar, garlic and spices for 30 minutes or more.', 'Sear in a very hot pan in 2–3 batches with the oil until charred at the edges.', 'Mix the yogurt sauce: it replaces toum (garlic sauce), which is ~100 kcal per tbsp.', 'Serve with ½ baladi, salad and pickles.'],
      macros: 'Per 200 g cooked chicken + 50 g sauce ≈ 400 kcal · 68 g protein', tip: 'Don\'t crowd the pan, or the chicken steams instead of browning.' },
    { id: 'kofta', n: 'Lean oven kofta', ar: 'كفتة في الفرن', meals: ['l_kofta'], time: '20 min + 15 min oven', yields: '1 kg raw ≈ 18 pieces of 40 g cooked', split: 'Ahmed 5 pieces (200 g), Yousr 3–4 pieces (140 g)',
      ing: [['lean beef mince (≤10% fat), or half beef half chicken', '1 kg'], ['onion, grated and squeezed dry', '1 medium'], ['parsley, finely chopped', '30 g'], ['kofta spice or 7-spice', '2 tsp'], ['salt, pepper', '2 tsp, 1 tsp']],
      steps: ['Knead everything for 3 minutes until sticky.', 'Shape 55 g logs on skewers or a lined tray.', 'Oven at 220 °C for 12–15 minutes, or grill.', 'Freeze raw extras on a tray, then bag them.'],
      macros: 'Per 40 g cooked piece ≈ 87 kcal · 10 g protein', tip: 'Butcher "kofta" mince is often 20–30% fat. Ask for lean beef minced in front of you.' },
    { id: 'sayadeya', n: 'Baked fish + sayadeya rice', ar: 'سمك وأرز صيادية', meals: ['l_fish'], time: '45 min', yields: '1 lunch for both + 1 portion of rice left over', split: 'Ahmed 280 g fish + 300 g rice, Yousr 200 g fish + 200 g rice',
      ing: [['white fish fillet (bolti, sea bass, denis)', '500 g (≈ 800 g whole fish)'], ['rice, dry', '250 g'], ['onions, sliced', '2 medium'], ['oil', '15 ml (1 tbsp) instead of deep-frying the onions'], ['fish or vegetable stock', '600 ml'], ['cumin, garlic, lemon', '2 tsp, 4 cloves, 1 lemon']],
      steps: ['Caramelise the onions slowly in the oil for 15–20 minutes until dark brown.', 'Add the rinsed rice and cumin, stir 2 minutes, add the stock. Cover and cook on low 18 minutes.', 'Rub the fish with garlic, cumin, lemon and salt. Bake at 200 °C for 12–15 minutes.', 'Serve with tahina salad.'],
      macros: 'Per 100 g cooked fish ≈ 120 kcal · 24 g P · per cup rice ≈ 260 kcal', tip: 'Slow-cooking the onions gives sayadeya its colour without frying.' },
    { id: 'bamya', n: 'Bamya or fasolia with beef', ar: 'بامية / فاصوليا باللحمة', meals: ['l_bamya'], time: '1 h 20 min (mostly simmering)', yields: '≈ 4 lunches for both', split: 'Ahmed 180 g beef + 250 g stew, Yousr 130 g beef + 200 g stew',
      ing: [['lean beef cubes', '700 g raw (≈ 520 g cooked)'], ['frozen bamya (okra) or green beans', '800 g'], ['tomato passata', '500 g'], ['tomato paste', '1 tbsp'], ['onion, garlic', '1 + 4 cloves'], ['oil', '10 ml (2 tsp)'], ['ground coriander, salt', '1 tsp, to taste']],
      steps: ['Simmer the beef in water with onion for 60 minutes until tender; keep 300 ml of the broth.', 'Fry garlic and coriander in the oil, add paste and passata.', 'Add beef, broth and bamya. Simmer 15–20 minutes.', 'Weigh the beef into portions before adding stew.'],
      macros: 'Per Ahmed\'s portion (without rice) ≈ 560 kcal · 55 g protein', tip: 'Cook the beef a day ahead and chill the broth: the fat sets on top and lifts off.' },
    { id: 'lentil', n: 'Red lentil soup', ar: 'شوربة عدس', meals: ['d_lentil', 'r_iftar'], time: '35 min', yields: '≈ 2 L: 6–7 bowls of 300 ml', split: 'Ahmed 450 ml, Yousr 300 ml per dinner',
      ing: [['red lentils', '300 g'], ['onion', '1 medium'], ['carrot', '1 large'], ['tomato', '1 medium'], ['water or stock', '1.5 L'], ['oil', '5 ml (1 tsp)'], ['cumin', '1½ tsp'], ['lemon wedges', 'to serve']],
      steps: ['Soften the chopped onion and carrot in the oil.', 'Add lentils, tomato and water. Simmer 25 minutes.', 'Blend smooth, add cumin and salt.', 'Serve with lemon. Skip fried bread; use measured baladi toast.'],
      macros: 'Per 300 ml ≈ 190 kcal · 12 g protein', tip: 'Perfect as the first thing at iftar: gentle on the stomach and replaces fluids.' },
    { id: 'tahina', n: 'Light tahina salad', ar: 'سلطة طحينة خفيفة', meals: ['l_chicken', 'l_kofta', 'l_fish'], time: '5 min', yields: '≈ 250 g: 2–3 servings', split: '½ cup (100 g) per serving',
      ing: [['tahina', '30 g (2 tbsp)'], ['Greek yogurt', '80 g'], ['lemon juice', '1 lemon'], ['garlic, cumin', '1 clove, ½ tsp'], ['cold water', 'to thin'], ['salt', 'pinch']],
      steps: ['Whisk tahina and lemon until it thickens.', 'Add yogurt, garlic and cumin, then water until it pours.', 'Keeps 3 days in the fridge.'],
      macros: 'Per 100 g ≈ 105 kcal · 6 g protein', tip: 'Yogurt halves the calories of regular tahina salad and adds protein.' },
    { id: 'kebda', n: 'Alexandrian liver (kebda)', ar: 'كبدة إسكندراني', meals: ['d_kebda'], time: '15 min', yields: '1 dinner for both', split: 'Ahmed 180 g, Yousr 130 g cooked',
      ing: [['beef liver, thin strips', '400 g'], ['green chillies or peppers', '2'], ['garlic', '6 cloves'], ['cumin', '1 tsp'], ['oil', '10 ml (2 tsp)'], ['vinegar or lemon', '1 tbsp']],
      steps: ['Pat the liver dry.', 'Very hot pan with the oil: sear liver 2–3 minutes, stirring.', 'Add garlic, peppers and cumin for 1 minute, then vinegar.', 'Serve straight away so it stays tender.'],
      macros: 'Per 100 g cooked ≈ 175 kcal · 27 g protein', tip: 'Very high in vitamin A, so once a week is plenty.' },
    { id: 'pudding', n: 'Protein roz bel laban', ar: 'رز بلبن بروتين', meals: ['r_qatayef'], time: '30 min + chill', yields: '4 cups', split: '1 cup each as a dessert or Ramadan sweet swap',
      ing: [['short-grain rice', '60 g'], ['low-fat milk', '700 ml'], ['vanilla whey', '30 g (1 scoop), stirred in after cooking'], ['honey or sweetener', '20 g (1 tbsp)'], ['rose or orange-blossom water', '1 tsp'], ['cinnamon', 'to top']],
      steps: ['Simmer rice in 250 ml water until absorbed.', 'Add milk; cook on low, stirring, 20 minutes until creamy.', 'Off the heat, cool 5 minutes, then whisk in whey, honey and rose water.', 'Chill in 4 cups.'],
      macros: 'Per cup ≈ 190 kcal · 15 g protein', tip: 'Adding whey while it\'s boiling makes it grainy: let it cool first.' },
    { id: 'qatayef', n: 'Baked qatayef (lighter)', ar: 'قطايف في الفرن', meals: ['r_qatayef'], time: '20 min', yields: '8 pieces', split: 'Ahmed 2, Yousr 1 per serving',
      ing: [['qatayef pancakes', '8 (≈ 200 g)'], ['areesh or ricotta', '150 g'], ['cinnamon, honey', '½ tsp, 10 g'], ['or: chopped nuts', '40 g'], ['ghee, melted', '10 g (2 tsp) to brush'], ['honey or light syrup', '1 tbsp to drizzle']],
      steps: ['Mix cheese, cinnamon and honey (or use nuts).', 'Fill and pinch closed.', 'Brush lightly with ghee and bake at 200 °C for 12–15 minutes.', 'Drizzle a little honey instead of dunking in syrup.'],
      macros: 'Per cheese-filled piece ≈ 110 kcal · 5 g protein (fried and soaked: ≈ 250 kcal)', tip: 'Cheese filling beats nuts on calories and adds protein.' }
  ];
  P.MEAL_RECIPES = {};
  P.RECIPES.forEach((r) => r.meals.forEach((m) => (P.MEAL_RECIPES[m] = P.MEAL_RECIPES[m] || []).push(r.id)));
})();
