/* Program data: poses, exercises, sessions, meals, schedule. */
(function () {
  const S = { h: [100, 26], n: [100, 42], e: [100, 66], w: [100, 88], p: [100, 92], k: [100, 121], f: [100, 150] };
  const m = (b, o) => Object.assign({}, b, o);
  const SQ = { h: [116, 58], n: [108, 72], e: [124, 76], w: [142, 74], p: [78, 112], k: [112, 116], f: [100, 150] };
  const HINGE = { h: [146, 64], n: [132, 68], e: [128, 90], w: [124, 112], p: [90, 90], k: [102, 121], f: [100, 150] };
  const PU_UP = { h: [152, 98], n: [140, 104], e: [138, 126], w: [138, 148], p: [96, 116], k: [72, 128], f: [46, 142] };
  const PU_DN = { h: [156, 124], n: [142, 128], e: [124, 134], w: [138, 148], p: [96, 134], k: [72, 140], f: [46, 146] };
  const HANG = { h: [100, 52], n: [100, 66], e: [98, 46], w: [100, 26], p: [100, 112], k: [102, 134], f: [98, 150] };
  const HOLLOW = { h: [46, 124], n: [58, 130], e: [36, 124], w: [20, 120], p: [104, 140], k: [134, 134], f: [164, 128] };
  const DB_A = { h: [46, 138], n: [58, 140], e: [62, 118], w: [64, 96], p: [104, 142], k: [108, 112], f: [132, 112] };
  const QUAD = { h: [150, 98], n: [136, 106], e: [138, 128], w: [140, 148], p: [90, 106], k: [90, 148], f: [60, 148] };
  const LOWL = { h: [110, 52], n: [108, 68], e: [118, 90], w: [126, 104], p: [96, 114], k: [126, 118], f: [126, 150], k2: [80, 148], f2: [52, 140] };
  const YTW = { h: [146, 62], n: [132, 68], p: [90, 90], k: [100, 121], f: [98, 150] };
  const ROW_BASE = { h: [142, 62], n: [130, 68], p: [90, 88], k: [96, 120], f: [94, 150], e2: [140, 86], w2: [146, 104] };

  const T = {
    squat: { A: m(S, { e: [110, 58], w: [126, 56] }), B: SQ },
    backsquat: { A: m(S, { e: [90, 58], w: [102, 44] }), B: m(SQ, { e: [98, 86], w: [110, 74] }), prop: { type: 'bar', at: 'w' } },
    hinge: { A: m(S, { w: [102, 92] }), B: HINGE, prop: { type: 'bar', at: 'w' } },
    slhinge: { A: m(S, { w: [102, 92], k2: [100, 121], f2: [100, 150] }), B: m(HINGE, { k2: [70, 96], f2: [44, 88] }), prop: { type: 'db', at: 'w' } },
    deadlift: { A: { h: [138, 62], n: [126, 70], e: [122, 96], w: [118, 120], p: [86, 104], k: [110, 124], f: [100, 150] }, B: m(S, { w: [102, 92] }), prop: { type: 'trap', at: 'w' } },
    hipthrust: {
      A: { h: [44, 90], n: [58, 100], e: [76, 112], w: [92, 118], p: [92, 132], k: [126, 112], f: [130, 150] },
      B: { h: [44, 90], n: [58, 100], e: [76, 100], w: [92, 100], p: [94, 100], k: [128, 100], f: [130, 150] },
      scene: [{ type: 'bench', x: 24, y: 100, w: 36, h: 50 }], prop: { type: 'bar', at: 'p' }
    },
    splitsquat: {
      A: { h: [104, 26], n: [104, 42], e: [104, 66], w: [104, 90], p: [100, 92], k: [112, 120], f: [114, 150], k2: [82, 116], f2: [56, 112] },
      B: { h: [106, 48], n: [106, 64], e: [106, 88], w: [106, 110], p: [98, 114], k: [124, 118], f: [114, 150], k2: [82, 140], f2: [56, 112] },
      scene: [{ type: 'bench', x: 26, y: 112, w: 40, h: 38 }], prop: { type: 'db', at: 'w' }
    },
    lunge: {
      A: m(S, { k2: [100, 121], f2: [100, 150] }),
      B: { h: [104, 48], n: [104, 64], e: [104, 88], w: [104, 110], p: [100, 114], k: [126, 116], f: [126, 150], k2: [88, 142], f2: [64, 146] },
      prop: { type: 'db', at: 'w' }
    },
    stepup: {
      A: { h: [100, 26], n: [100, 42], e: [100, 66], w: [100, 88], p: [100, 92], k: [122, 102], f: [128, 128], k2: [100, 121], f2: [100, 150] },
      B: { h: [128, 8], n: [128, 22], e: [128, 46], w: [128, 66], p: [128, 70], k: [128, 99], f: [128, 128], k2: [142, 84], f2: [136, 108] },
      scene: [{ type: 'box', x: 112, y: 128, w: 50, h: 22 }], prop: { type: 'db', at: 'w' }
    },
    pushup: { A: PU_UP, B: PU_DN },
    plyopush: { A: PU_DN, B: m(PU_UP, { h: [152, 86], n: [140, 92], e: [142, 112], w: [146, 130], p: [96, 110] }) },
    planktap: { A: m(PU_UP, { e2: [138, 126], w2: [138, 148] }), B: m(PU_UP, { e2: [126, 124], w2: [134, 108] }) },
    renegade: { A: m(PU_UP, { e2: [138, 126], w2: [138, 148] }), B: m(PU_UP, { e2: [118, 104], w2: [132, 122] }), prop: { type: 'db', at: 'w2' } },
    mtnclimber: {
      A: m(PU_UP, { k: [118, 128], f: [104, 146], k2: [72, 128], f2: [46, 142] }),
      B: m(PU_UP, { k: [72, 128], f: [46, 142], k2: [118, 128], f2: [104, 146] })
    },
    pullup: { A: HANG, B: { h: [106, 14], n: [100, 34], e: [80, 40], w: [100, 26], p: [100, 82], k: [106, 106], f: [98, 126] }, scene: [{ type: 'pullbar', y: 26 }] },
    kneeraise: { A: HANG, B: m(HANG, { k: [126, 104], f: [118, 130] }), scene: [{ type: 'pullbar', y: 26 }] },
    pulldown: {
      A: { h: [112, 28], n: [110, 44], e: [126, 32], w: [142, 20], p: [100, 94], k: [102, 122], f: [100, 150] },
      B: { h: [116, 30], n: [112, 46], e: [116, 70], w: [110, 92], p: [100, 94], k: [102, 122], f: [100, 150] },
      prop: { type: 'band', at: 'w', anchor: [190, 0] }
    },
    row1: {
      A: m(ROW_BASE, { e: [128, 90], w: [126, 114] }), B: m(ROW_BASE, { e: [110, 70], w: [122, 90] }),
      scene: [{ type: 'bench', x: 132, y: 104, w: 46, h: 46 }], prop: { type: 'db', at: 'w' }
    },
    press: { A: m(S, { e: [92, 60], w: [108, 46] }), B: m(S, { e: [112, 28], w: [122, 10] }), prop: { type: 'landmine', at: 'w', anchor: [30, 150] } },
    bench: {
      A: { h: [150, 100], n: [136, 104], p: [86, 104], k: [62, 110], f: [58, 150], e: [124, 114], w: [132, 88] },
      B: { h: [150, 100], n: [136, 104], p: [86, 104], k: [62, 110], f: [58, 150], e: [134, 84], w: [136, 60] },
      scene: [{ type: 'bench', x: 70, y: 110, w: 90, h: 40 }], prop: { type: 'bar', at: 'w' }
    },
    slam: {
      A: m(S, { e: [100, 20], w: [104, 2] }),
      B: { h: [132, 70], n: [122, 74], e: [132, 100], w: [140, 126], p: [84, 104], k: [108, 122], f: [100, 150] },
      prop: { type: 'ball', at: 'w' }
    },
    ski: {
      A: m(S, { e: [108, 22], w: [116, 6] }),
      B: { h: [128, 54], n: [120, 62], e: [112, 86], w: [106, 104], p: [92, 98], k: [106, 122], f: [100, 150] },
      prop: { type: 'band', at: 'w', anchor: [150, -10] }
    },
    chestpass: { A: m(S, { e: [94, 70], w: [112, 60] }), B: m(S, { h: [104, 26], n: [104, 42], e: [130, 56], w: [152, 54] }), prop: { type: 'ball', at: 'w' } },
    rotthrow: { A: m(S, { h: [96, 28], e: [84, 76], w: [76, 96] }), B: m(S, { h: [106, 26], e: [128, 54], w: [150, 44] }), prop: { type: 'ball', at: 'w' } },
    swing: {
      A: { h: [140, 66], n: [128, 72], e: [110, 100], w: [96, 124], p: [86, 96], k: [104, 122], f: [100, 150] },
      B: m(S, { e: [124, 56], w: [148, 54] }), prop: { type: 'kb', at: 'w' }
    },
    jumpsquat: {
      A: m(SQ, { e: [88, 84], w: [72, 94] }),
      B: { h: [100, 4], n: [100, 20], e: [108, 2], w: [114, -12], p: [100, 70], k: [102, 98], f: [100, 126] }
    },
    streamjump: {
      A: m(SQ, { e: [120, 46], w: [126, 28] }),
      B: { h: [100, 4], n: [100, 20], e: [100, -2], w: [100, -14], p: [100, 70], k: [100, 98], f: [100, 126] }
    },
    boxjump: {
      A: m(SQ, { e: [88, 84], w: [72, 94] }),
      B: { h: [150, 40], n: [146, 54], e: [160, 64], w: [174, 64], p: [138, 86], k: [158, 92], f: [150, 110] },
      scene: [{ type: 'box', x: 128, y: 110, w: 50, h: 40 }]
    },
    broadjump: {
      A: m(SQ, { h: [80, 58], n: [72, 72], e: [62, 88], w: [46, 96], p: [42, 112], k: [76, 116], f: [64, 150] }),
      B: { h: [164, 30], n: [156, 44], e: [172, 40], w: [188, 34], p: [130, 80], k: [150, 94], f: [142, 120] }
    },
    latbound: {
      A: { h: [80, 30], n: [80, 46], e: [66, 64], w: [62, 84], p: [80, 94], k: [80, 122], f: [80, 150], k2: [92, 116], f2: [96, 136], e2: [94, 64], w2: [98, 84] },
      B: { h: [128, 30], n: [128, 46], e: [142, 64], w: [146, 84], p: [128, 94], k: [128, 122], f: [128, 150], k2: [116, 116], f2: [112, 136], e2: [114, 64], w2: [110, 84] }
    },
    pogo: { A: m(S, { e: [88, 66], w: [84, 86] }), B: { h: [100, 12], n: [100, 28], e: [88, 52], w: [84, 72], p: [100, 78], k: [100, 107], f: [100, 136] } },
    hollow: { A: HOLLOW, B: { h: [46, 120], n: [58, 127], e: [36, 120], w: [20, 115], p: [104, 141], k: [134, 130], f: [164, 122] } },
    flutter: {
      A: m(HOLLOW, { k: [134, 132], f: [164, 122], k2: [134, 138], f2: [164, 138] }),
      B: m(HOLLOW, { k: [134, 138], f: [164, 138], k2: [134, 132], f2: [164, 122] })
    },
    deadbug: {
      A: m(DB_A, { e2: [62, 118], w2: [64, 96], k2: [108, 112], f2: [132, 112] }),
      B: m(DB_A, { e2: [40, 134], w2: [22, 132], k2: [134, 134], f2: [164, 138] })
    },
    rollout: {
      A: { h: [132, 80], n: [120, 88], e: [122, 116], w: [124, 140], p: [96, 110], k: [96, 146], f: [70, 148] },
      B: { h: [176, 118], n: [162, 124], e: [178, 132], w: [192, 140], p: [118, 132], k: [96, 146], f: [70, 148] },
      prop: { type: 'wheel', at: 'w' }
    },
    nordic: {
      A: { h: [94, 44], n: [92, 58], e: [100, 82], w: [108, 90], p: [90, 104], k: [90, 148], f: [60, 148] },
      B: { h: [156, 70], n: [146, 80], e: [152, 96], w: [160, 104], p: [118, 114], k: [90, 148], f: [60, 148] }
    },
    kickback: {
      A: { h: [108, 32], n: [106, 48], e: [118, 66], w: [128, 76], p: [96, 96], k: [98, 122], f: [98, 150], k2: [100, 122], f2: [96, 148] },
      B: { h: [108, 32], n: [106, 48], e: [118, 66], w: [128, 76], p: [96, 96], k: [98, 122], f: [98, 150], k2: [76, 108], f2: [52, 100] },
      prop: { type: 'band', at: 'f2', anchor: [150, 150] }
    },
    bandwalk: {
      A: { h: [100, 30], n: [100, 46], e: [86, 66], w: [90, 84], p: [100, 96], k: [90, 122], f: [88, 150], k2: [110, 122], f2: [112, 150], e2: [114, 66], w2: [110, 84] },
      B: { h: [100, 30], n: [100, 46], e: [86, 66], w: [90, 84], p: [100, 96], k: [80, 122], f: [72, 150], k2: [118, 122], f2: [124, 150], e2: [114, 66], w2: [110, 84] },
      prop: { type: 'kneeband' }
    },
    copenhagen: {
      A: { h: [44, 98], n: [56, 106], e: [58, 148], w: [78, 148], p: [106, 118], k: [136, 110], f: [162, 100], k2: [128, 126], f2: [150, 132] },
      B: { h: [44, 110], n: [56, 116], e: [58, 148], w: [78, 148], p: [106, 134], k: [136, 120], f: [162, 100], k2: [128, 140], f2: [150, 146] },
      scene: [{ type: 'bench', x: 150, y: 100, w: 40, h: 50 }]
    },
    pallof: { A: m(S, { e: [110, 72], w: [116, 64] }), B: m(S, { e: [128, 64], w: [148, 64] }), prop: { type: 'band', at: 'w', anchor: [6, 64] } },
    facepull: { A: m(S, { e: [124, 48], w: [146, 44] }), B: m(S, { e: [88, 40], w: [112, 28] }), prop: { type: 'band', at: 'w', anchor: [196, 38] } },
    pullapart: { A: m(S, { e: [124, 50], w: [148, 50], e2: [124, 50], w2: [148, 50] }), B: m(S, { e: [100, 50], w: [100, 50], e2: [100, 50], w2: [100, 50] }) },
    extrot: { A: m(S, { w: [124, 68] }), B: m(S, { w: [108, 70] }), prop: { type: 'band', at: 'w', anchor: [6, 68] } },
    ytw: { A: m(YTW, { e: [132, 90], w: [134, 112] }), B: m(YTW, { e: [152, 56], w: [170, 44] }), prop: { type: 'db', at: 'w' } },
    rower: {
      A: { h: [130, 72], n: [124, 86], e: [140, 100], w: [156, 104], p: [108, 130], k: [128, 104], f: [150, 136] },
      B: { h: [56, 78], n: [64, 92], e: [74, 116], w: [96, 110], p: [80, 130], k: [116, 122], f: [150, 136] },
      scene: [{ type: 'rail', y: 140 }]
    },
    bike: {
      A: { h: [118, 46], n: [110, 58], e: [126, 72], w: [140, 82], p: [90, 96], k: [116, 92], f: [110, 124], k2: [106, 112], f2: [96, 140] },
      B: { h: [118, 46], n: [110, 58], e: [126, 72], w: [140, 82], p: [90, 96], k: [106, 112], f: [96, 140], k2: [116, 92], f2: [110, 124] },
      scene: [{ type: 'bike' }]
    },
    lowlunge: { A: LOWL, B: m(LOWL, { p: [104, 122], n: [112, 74], h: [114, 58], e: [122, 96], w: [128, 110] }) },
    worlds: { A: m(LOWL, { e2: [118, 90], w2: [126, 104] }), B: m(LOWL, { h: [118, 56], e2: [116, 40], w2: [120, 18] }) },
    couch: {
      A: { h: [108, 48], n: [106, 64], e: [116, 86], w: [124, 100], p: [96, 112], k: [126, 118], f: [126, 150], k2: [76, 146], f2: [58, 110] },
      B: { h: [104, 46], n: [102, 62], e: [114, 84], w: [124, 100], p: [100, 116], k: [128, 118], f: [126, 150], k2: [76, 146], f2: [58, 110] },
      scene: [{ type: 'wall', x: 50 }]
    },
    quadruped: { A: m(QUAD, { e2: [138, 128], w2: [140, 148] }), B: m(QUAD, { e2: [136, 76], w2: [134, 48] }) },
    hip9090: {
      A: { h: [100, 74], n: [100, 90], e: [112, 112], w: [120, 128], p: [100, 140], k: [132, 140], f: [138, 120], k2: [70, 140], f2: [60, 122] },
      B: { h: [120, 86], n: [112, 100], e: [124, 120], w: [134, 132], p: [100, 140], k: [132, 140], f: [138, 120], k2: [70, 140], f2: [60, 122] }
    },
    ankle: {
      A: { h: [100, 70], n: [100, 86], e: [110, 108], w: [116, 128], p: [96, 128], k: [130, 146], f: [74, 148] },
      B: { h: [92, 72], n: [94, 88], e: [104, 110], w: [108, 130], p: [92, 128], k: [130, 138], f: [74, 148] }
    },
    doorway: {
      A: m(S, { e: [122, 44], w: [124, 22] }), B: m(S, { h: [108, 28], n: [106, 44], p: [100, 92], e: [122, 44], w: [124, 22] }),
      scene: [{ type: 'wall', x: 128 }]
    },
    sleeper: {
      A: { h: [40, 126], n: [54, 132], e: [58, 108], w: [76, 106], p: [110, 136], k: [138, 126], f: [164, 136] },
      B: { h: [40, 126], n: [54, 132], e: [58, 108], w: [72, 128], p: [110, 136], k: [138, 126], f: [164, 136] }
    },
    legswing: { A: m(S, { k2: [118, 116], f2: [138, 136] }), B: m(S, { k2: [84, 118], f2: [66, 140] }), scene: [{ type: 'wall', x: 60 }] }
  };

  const yt = (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);

  // Exercise library
  const EX = {
    kbswing: { n: 'Kettlebell swing', t: 'swing', cues: ['Hike the bell back between your thighs, hips go back', 'Snap your hips forward; arms just guide the bell to chest height', 'Squeeze your glutes at the top and keep your ribs down'], alt: ['Dumbbell swing', 'Cable pull-through', 'Banded hip hinge (light day)'], why: 'Hip snap trains the same extension as starts and turns.' },
    pushup: { n: 'Push-up', t: 'pushup', cues: ['Hands under shoulders, body in one straight line', 'Lower chest to a fist height off the floor', 'Elbows about 45° from your body'], alt: ['Incline push-up (hands on bench)', 'Knee push-up', 'Dumbbell floor press'] },
    walklunge: { n: 'Walking lunge', t: 'lunge', cues: ['Long step, back knee kisses the floor', 'Front shin stays fairly upright', 'Drive through the front heel to the next step'], alt: ['Reverse lunge in place', 'Split squat', 'Step-ups'] },
    renegade: { n: 'Renegade row', t: 'renegade', cues: ['High plank on dumbbells, feet wide', 'Row one dumbbell to your hip without twisting', 'Alternate sides, hips stay square'], alt: ['Plank + single-arm band row', 'Bent-over dumbbell row', 'Plank shoulder taps'] },
    bike: { n: 'Assault bike / SkiErg', t: 'bike', cues: ['Push and pull the handles, drive with your legs', 'Hold a pace you can repeat every round', 'Breathe every 2–3 pedal strokes'], alt: ['SkiErg', 'Rowing machine', 'Jumping jacks or high knees (no machine)'] },
    mtnclimber: { n: 'Mountain climbers', t: 'mtnclimber', cues: ['Hands under shoulders, hips level with shoulders', 'Drive knees to chest fast and light', 'Keep your head neutral'], alt: ['Slow cross-body climbers', 'High knees', 'Plank jacks'] },
    hollow: { n: 'Hollow hold (streamline)', t: 'hollow', cues: ['Lower back pressed into the floor', 'Arms in streamline by your ears', 'Lift legs and shoulders just off the floor'], alt: ['Tuck hollow (knees bent)', 'Dead bug hold', 'Hollow rocks'], why: 'This is your streamline position on land.' },
    flutter: { n: 'Flutter kicks', t: 'flutter', cues: ['Same hollow position, lower back down', 'Small, fast kicks from the hip', 'Keep toes pointed like in the water'], alt: ['Scissor kicks', 'Hollow hold', 'Prone flutter on a bench'], why: 'Builds the hip-driven kick you use in freestyle.' },
    deadbug: { n: 'Dead bug', t: 'deadbug', cues: ['Arms up, knees over hips at 90°', 'Reach opposite arm and leg out slowly', 'Exhale fully while your back stays flat'], alt: ['Bird dog', 'Heel taps', 'Hollow hold'] },
    planktap: { n: 'Plank shoulder taps', t: 'planktap', cues: ['High plank, feet a bit wider than hips', 'Tap the opposite shoulder without rocking', 'Move slowly and keep control'], alt: ['Forearm plank', 'Bear crawl hold', 'Renegade row (no weight)'] },
    bikeint: { n: 'Bike intervals (finisher)', t: 'bike', cues: ['30 s all-out, 30 s easy spin', 'Keep every hard rep at the same output', 'Stop if your output drops by more than 15%'], alt: ['Rower 30/30', 'SkiErg 30/30', 'Hill or stair sprints'], why: 'Raises the VO2 max ceiling you need for hard sets in the pool.' },

    hipthrust: { n: 'Barbell hip thrust', t: 'hipthrust', cues: ['Upper back on the bench, bar padded over hips', 'Chin tucked and ribs down; drive through your heels', 'Pause and squeeze at the top for 1 s'], alt: ['Smith machine hip thrust', 'Dumbbell glute bridge (floor)', 'Single-leg hip thrust'], why: 'Main glute builder for shaping and a stronger kick.' },
    rdl: { n: 'Romanian deadlift', t: 'hinge', cues: ['Soft knees; push hips back', 'Bar slides down your thighs to mid-shin', 'Feel the hamstring stretch, then drive your hips forward'], alt: ['Dumbbell RDL', 'Cable pull-through', 'Good morning'] },
    bss: { n: 'Bulgarian split squat', t: 'splitsquat', cues: ['Back foot laces-down on the bench', 'Lean slightly forward for more glute work', 'Lower until your back knee is near the floor'], alt: ['Rear-foot-elevated split squat on a step', 'Reverse lunge', 'Leg press (single leg)'] },
    nordic: { n: 'Nordic hamstring curl', t: 'nordic', cues: ['Anchor heels under a pad or a partner', 'Lower as slowly as you can, hips straight', 'Catch yourself with your hands, push back up'], alt: ['Slider or towel leg curl', 'Swiss-ball leg curl', 'Lying leg curl machine'] },
    kickback: { n: 'Cable glute kickback', t: 'kickback', cues: ['Slight forward lean, brace on the machine', 'Kick back and up with a straight-ish leg', 'Glute does the work, not your lower back'], alt: ['Band kickback', 'Donkey kick on all fours', 'Reverse hyper'] },
    bandwalk: { n: 'Banded lateral walk', t: 'bandwalk', cues: ['Band above the knees, quarter-squat', 'Step sideways, keep tension the whole time', 'Toes forward, knees push out'], alt: ['Hip abduction machine', 'Side-lying clamshell', 'Side-lying leg raise'] },
    copenhagen: { n: 'Copenhagen plank', t: 'copenhagen', cues: ['Top leg on the bench, bottom leg hanging', 'Lift hips into a straight line', 'Start short-lever (knee on bench)'], alt: ['Short-lever Copenhagen (knee on bench)', 'Adductor machine', 'Side plank'], why: 'Inner-thigh strength protects breaststroke knees and groin.' },
    couch: { n: 'Couch stretch', t: 'couch', cues: ['Back knee in the corner, shin up the wall', 'Squeeze the back glute, stay tall', '60–90 s per side'], alt: ['Half-kneeling hip flexor stretch', 'Standing quad stretch', 'Low lunge'] },
    hip9090: { n: '90/90 hip switch', t: 'hip9090', cues: ['Both knees at 90°, sit tall', 'Lean over the front shin', 'Switch sides slowly'], alt: ['Pigeon stretch', 'Figure-4 stretch on your back', 'Seated butterfly'] },
    tspine: { n: 'Thoracic rotation (quadruped)', t: 'quadruped', cues: ['On all fours, one hand behind your head', 'Rotate the elbow up toward the ceiling', 'Follow it with your eyes; breathe out at the top'], alt: ['Open book (side-lying)', 'Foam roller extensions', 'Thread the needle'], why: 'Upper-back rotation lets you rotate in freestyle and backstroke without straining your shoulders.' },
    ankle: { n: 'Kneeling ankle (plantar-flexion) stretch', t: 'ankle', cues: ['Kneel and sit back on your heels, laces flat', 'Gently lift your knees to deepen it', '60 s, build up gradually'], alt: ['Seated toe-point stretch', 'Ankle circles', 'Pointed-toe calf raises'], why: 'Floppy, pointed ankles make your kick a fin.' },
    doorway: { n: 'Doorway pec stretch', t: 'doorway', cues: ['Forearm on the frame, elbow at shoulder height', 'Step through until you feel the chest open', '45–60 s per side'], alt: ['Floor pec stretch (lying)', 'Band pec stretch', 'Foam roller chest opener'] },
    sleeper: { n: 'Sleeper stretch', t: 'sleeper', cues: ['Lie on your side, arm at 90° in front', 'Gently press the forearm toward the floor', 'Mild stretch only, never pain'], alt: ['Cross-body shoulder stretch', 'Band internal rotation', 'Doorway posterior-shoulder stretch'] },

    pogo: { n: 'Pogo hops', t: 'pogo', cues: ['Stiff ankles, bounce off the balls of your feet', 'Minimal knee bend, quick contacts', 'Stay tall and quiet'], alt: ['Jump rope (fast)', 'Single-leg pogo (advanced)', 'Calf raises (no-impact day)'], why: 'Ankle stiffness = snappier wall push-offs.' },
    boxjump: { n: 'Box jump', t: 'boxjump', cues: ['Arm swing and jump, land softly in a quarter squat', 'Step down, never jump down', 'Choose a box you land on easily'], alt: ['Squat jump', 'Tuck jump', 'Step-up jump'] },
    broadjump: { n: 'Broad jump', t: 'broadjump', cues: ['Swing arms back, load your hips', 'Explode forward and up', 'Stick the landing for 2 s'], alt: ['Standing long jump to a line', 'Kettlebell swing', 'Squat jump'], why: 'Close to the push you use on dive starts.' },
    latbound: { n: 'Lateral bounds', t: 'latbound', cues: ['Push off one leg sideways', 'Land on the other leg and hold for 1 s', 'Knee tracks over your toes'], alt: ['Skater hops (smaller)', 'Lateral line hops', 'Banded lateral walk'] },
    streamjump: { n: 'Streamline squat jump', t: 'streamjump', cues: ['Arms locked in streamline overhead', 'Dip and explode straight up', 'Land softly and reset each rep'], alt: ['Squat jump (arms free)', 'Box jump', 'Jump squat with light dumbbells'], why: 'Builds the streamline push off the wall and the block.' },
    trapbar: { n: 'Trap bar deadlift', t: 'deadlift', cues: ['Stand in the middle, grip the handles', 'Push the floor away; chest stays proud', 'Stand tall, hips through; lower with control'], alt: ['Barbell back squat', 'Goblet squat (heavy DB)', 'Leg press'] },
    jumpsquat: { n: 'Jump squat (contrast)', t: 'jumpsquat', cues: ['Do these straight after each heavy set', 'Bodyweight or light dumbbells', 'Max height, soft landing'], alt: ['Box jump', 'Kettlebell swing', 'Broad jump'] },
    slrdl: { n: 'Single-leg RDL', t: 'slhinge', cues: ['Dumbbell in the opposite hand', 'Hinge forward and reach the back leg long', 'Hips stay square to the floor'], alt: ['Kickstand RDL (back toe down)', 'Cable single-leg RDL', 'Romanian deadlift'] },
    stepup: { n: 'Weighted step-up', t: 'stepup', cues: ['Whole foot on the box, knee over toes', 'Drive up through the top heel', 'Lower slowly, no push from the back foot'], alt: ['Reverse lunge', 'Bulgarian split squat', 'Single-leg leg press'] },
    pallof: { n: 'Pallof press', t: 'pallof', cues: ['Band or cable at chest height, stand side-on', 'Press straight out and resist rotating', 'Hold 2 s, return slowly'], alt: ['Half-kneeling Pallof press', 'Side plank', 'Suitcase carry'] },
    kneeraise: { n: 'Hanging knee raise', t: 'kneeraise', cues: ['Dead hang, shoulders packed', 'Curl knees up and tilt the pelvis', 'Lower slowly, no swinging'], alt: ['Captain\'s chair knee raise', 'Reverse crunch (floor)', 'Lying leg raise'] },

    slam: { n: 'Med ball slam', t: 'slam', cues: ['Reach tall, ball overhead', 'Slam down hard using your lats and abs', 'Catch on the bounce and repeat fast'], alt: ['Rope slams', 'Cable straight-arm pulldown (fast)', 'Band overhead slam motion'], why: 'Same lat-and-core path as your underwater pull.' },
    rotthrow: { n: 'Rotational med ball throw', t: 'rotthrow', cues: ['Side-on to a wall, ball at the back hip', 'Rotate from your hips and throw', 'Catch and reset each rep'], alt: ['Cable woodchop (fast)', 'Landmine rotation', 'Band rotation'] },
    plyopush: { n: 'Plyometric push-up', t: 'plyopush', cues: ['Lower under control', 'Push so hard your hands leave the floor', 'Land with soft elbows'], alt: ['Incline plyo push-up', 'Med ball chest pass', 'Fast push-up (no lift-off)'] },
    pullup: { n: 'Pull-up', t: 'pullup', cues: ['Full hang, shoulders packed', 'Pull chest toward the bar', 'Lower in 2–3 s'], alt: ['Band-assisted pull-up', 'Lat pulldown', 'Inverted row'], why: 'Main upper-body strength builder for the catch and pull.' },
    bench: { n: 'Bench press', t: 'bench', cues: ['Shoulder blades pinched and down', 'Bar to lower chest, elbows ~45°', 'Feet planted, drive up'], alt: ['Dumbbell bench press', 'Push-up (weighted)', 'Machine chest press'] },
    row1: { n: 'Single-arm dumbbell row', t: 'row1', cues: ['Hand and knee on the bench, flat back', 'Row the dumbbell toward your hip', 'Pause and lower slowly'], alt: ['Seated cable row', 'Chest-supported row', 'Inverted row'] },
    pulldownSA: { n: 'Straight-arm pulldown', t: 'pulldown', cues: ['Slight hinge, arms nearly straight', 'Sweep the bar or rope to your thighs', 'Feel the lats, keep your torso still'], alt: ['Band straight-arm pulldown', 'Dumbbell pullover', 'Med ball slam (light)'], why: 'Close to the catch-to-finish part of your stroke.' },
    landmine: { n: 'Landmine press', t: 'press', cues: ['Half-kneeling or standing, bar at the shoulder', 'Press up and forward, reach long', 'Ribs down, don\'t lean back'], alt: ['Half-kneeling single-arm dumbbell press', 'Arnold press (light)', 'Push press'] },
    extrot: { n: 'Band external rotation', t: 'extrot', cues: ['Elbow tucked at your side (towel helps)', 'Rotate the forearm outward slowly', 'Light band, high quality'], alt: ['Side-lying dumbbell external rotation', 'Cable external rotation', 'Band pull-apart'], why: 'Shoulder insurance for heavy swim volume.' },
    facepull: { n: 'Face pull', t: 'facepull', cues: ['Rope at face height, thumbs back', 'Pull to your ears, elbows high', 'Squeeze shoulder blades together'], alt: ['Band face pull', 'Reverse fly', 'Band pull-apart'] },
    ytw: { n: 'Y-T-W raises', t: 'ytw', cues: ['Hinge forward (or lie face-down on an incline)', 'Very light weights or none', '8 reps each of Y, T and W'], alt: ['Prone Y-T-W on bench', 'Band Y-T-W', 'Reverse fly'] },
    rollout: { n: 'Ab wheel rollout', t: 'rollout', cues: ['Kneel, tuck your pelvis', 'Roll out only as far as you can keep your back flat', 'Pull back with your abs'], alt: ['Stability-ball rollout', 'Plank walkouts', 'Long-lever plank'] },

    legswing: { n: 'Leg swings', t: 'legswing', cues: ['Hand on the wall', '10 forward-back + 10 side-to-side per leg'], alt: ['Walking knee hugs'] },
    worlds: { n: 'World\'s greatest stretch', t: 'worlds', cues: ['Lunge, same-side elbow to instep', 'Rotate and reach to the ceiling', '5 per side'], alt: ['Spiderman lunge'] },
    pullapart: { n: 'Band pull-apart', t: 'pullapart', cues: ['Arms straight at chest height', 'Pull the band to your chest, squeeze'], alt: ['Face pull'] },
    squatbw: { n: 'Bodyweight squat', t: 'squat', cues: ['Sit between your heels, chest up', '10–15 easy reps'], alt: ['Goblet squat (light)'] },
    rower: { n: 'Rowing machine', t: 'rower', cues: ['Legs, then body, then arms', 'Easy pace for warm-up'], alt: ['Bike', 'SkiErg'] }
  };
  Object.keys(EX).forEach((k) => { EX[k].id = k; EX[k].demo = yt(EX[k].n + ' exercise proper form'); });

  // Blocks: b1 weeks 1–3, dl weeks 4/8/12, b2 weeks 5–7, b3 weeks 9–11
  const SESSIONS = {
    A: {
      id: 'A', name: 'Circuit + core engine', day: 'Mon', time: '8:00–9:30 am', focus: ['Endurance', 'Circuit', 'Core / VO2 max'], warm: 'general',
      partner: 'Train "I go, you go": one of you works while the other rests, then swap. That makes the work/rest interval for you.',
      parts: [
        { title: 'Circuit', rx: { b1: '4 rounds · 40 s on / 20 s off · 90 s between rounds', b2: '4 rounds · 45 s on / 15 s off', b3: '5 rounds · 45 s on / 15 s off', dl: '3 rounds · 30 s on / 30 s off' }, items: ['kbswing', 'pushup', 'walklunge', 'renegade', 'bike', 'mtnclimber'] },
        { title: 'Core engine', rx: { b1: '3 rounds · 30 s each (dead bug 10/side)', b2: '3 rounds · 40 s each', b3: '4 rounds · 40 s each', dl: '2 rounds · 30 s each' }, items: ['hollow', 'flutter', 'deadbug', 'planktap'] },
        { title: 'VO2 finisher (optional)', rx: { b1: '6 × 30 s hard / 30 s easy', b2: '8 × 30 s / 30 s', b3: '10 × 30 s / 30 s', dl: 'Skip' }, items: ['bikeint'] }
      ]
    },
    B: {
      id: 'B', name: 'Glutes, hamstrings + mobility', day: 'Tue', time: 'After the 7 am swim (or evening)', focus: ['Toning', 'Shaping', 'Mobility'], warm: 'postswim',
      partner: 'Share the hip-thrust bench and alternate sets. If she wants more glute focus, add a 4th set of hip thrusts and the superset.',
      parts: [
        { title: 'Shaping strength', note: 'Keep 1–2 reps in reserve: you swim Wednesday.', items: [
          ['hipthrust', { b1: '4 × 10', b2: '4 × 8 (heavier)', b3: '4 × 6–8, 2 s pause', dl: '2 × 10 light' }],
          ['rdl', { b1: '3 × 10', b2: '3 × 8', b3: '4 × 8', dl: '2 × 8 light' }],
          ['bss', { b1: '3 × 10 / leg', b2: '3 × 8 / leg', b3: '3 × 8 / leg, heavier DBs', dl: '2 × 8 / leg' }],
          ['nordic', { b1: '3 × 5', b2: '3 × 6', b3: '4 × 6', dl: '2 × 4' }]
        ] },
        { title: 'Superset + adductors', items: [
          ['kickback', { b1: '3 × 15 / leg', b2: '3 × 15 / leg', b3: '3 × 12 / leg, heavier', dl: '2 × 15' }],
          ['bandwalk', { b1: '3 × 15 steps each way', b2: '3 × 15', b3: '3 × 20', dl: '2 × 15' }],
          ['copenhagen', { b1: '3 × 20 s / side', b2: '3 × 25 s / side', b3: '3 × 30 s / side', dl: '2 × 20 s' }]
        ] },
        { title: 'Mobility block · 15 min', rx: { b1: '60–90 s per drill / side', b2: '60–90 s per drill / side', b3: '60–90 s per drill / side', dl: '90 s per drill, extra slow' }, items: ['couch', 'hip9090', 'tspine', 'ankle', 'doorway', 'sleeper'] }
      ]
    },
    C: {
      id: 'C', name: 'Lower power + plyometrics', day: 'Thu', time: '8:00–9:30 am', focus: ['Power', 'Explosiveness', 'Plyometrics'], warm: 'plyo',
      partner: 'Alternate jumps and sets: your partner\'s set is your full rest. Plyos need 60–90 s between sets anyway.',
      parts: [
        { title: 'Plyometrics (fresh, full rest)', items: [
          ['pogo', { b1: '2 × 20', b2: '2 × 20', b3: '3 × 20', dl: '2 × 15' }],
          ['boxjump', { b1: '4 × 4', b2: '4 × 5', b3: '5 × 4, higher box', dl: '3 × 3' }],
          ['broadjump', { b1: '3 × 4', b2: '3 × 5', b3: '4 × 4', dl: '2 × 3' }],
          ['latbound', { b1: '3 × 5 / side', b2: '3 × 5 / side', b3: '4 × 5 / side', dl: '2 × 4 / side' }],
          ['streamjump', { b1: '3 × 5', b2: '3 × 5', b3: '4 × 5', dl: '2 × 4' }]
        ] },
        { title: 'Strength + contrast', note: 'Pair each heavy set with jump squats about 20 s later.', items: [
          ['trapbar', { b1: '4 × 5 @ ~75%', b2: '5 × 4 @ ~80–85%', b3: '5 × 3 @ ~85–88%', dl: '3 × 5 @ ~60%' }],
          ['jumpsquat', { b1: '5 after each set', b2: '5 after each set', b3: '4 after each set', dl: 'Skip' }],
          ['slrdl', { b1: '3 × 8 / leg', b2: '3 × 8 / leg', b3: '3 × 6 / leg, heavier', dl: '2 × 8' }],
          ['stepup', { b1: '3 × 6 / leg', b2: '3 × 8 / leg', b3: '3 × 6 / leg, heavy', dl: '2 × 6' }]
        ] },
        { title: 'Core', items: [
          ['pallof', { b1: '3 × 10 / side', b2: '3 × 10 / side', b3: '3 × 12 / side', dl: '2 × 10' }],
          ['kneeraise', { b1: '3 × 12', b2: '3 × 12', b3: '3 × 15', dl: '2 × 10' }]
        ] }
      ]
    },
    D: {
      id: 'D', name: 'Upper strength + explosiveness', day: 'Sat', time: '~5:00 pm (3–4 h after the swim)', focus: ['Upper strength', 'Power', 'Explosiveness'], warm: 'postswim',
      partner: 'Share one bench and pull-up bar and alternate sets. Spot each other on bench press.',
      parts: [
        { title: 'Explosive first', items: [
          ['slam', { b1: '3 × 6', b2: '3 × 8', b3: '4 × 6, heavier ball', dl: '2 × 6' }],
          ['rotthrow', { b1: '3 × 5 / side', b2: '3 × 5 / side', b3: '4 × 5 / side', dl: '2 × 5' }],
          ['plyopush', { b1: '3 × 5', b2: '3 × 6', b3: '4 × 5', dl: '2 × 4' }]
        ] },
        { title: 'Strength', items: [
          ['pullup', { b1: '4 × 6 (assisted if needed)', b2: '4 × 5 (+ load if possible)', b3: '5 × 4 (+ heavier)', dl: '2 × 5 bodyweight' }],
          ['bench', { b1: '4 × 8', b2: '4 × 6', b3: '5 × 4', dl: '2 × 8 light' }],
          ['row1', { b1: '3 × 10 / side', b2: '3 × 8 / side', b3: '4 × 8 / side', dl: '2 × 10' }],
          ['pulldownSA', { b1: '3 × 12', b2: '3 × 12', b3: '3 × 12', dl: '2 × 12' }],
          ['landmine', { b1: '3 × 8 / side', b2: '3 × 8 / side', b3: '3 × 6 / side', dl: '2 × 8' }]
        ] },
        { title: 'Shoulder care + core (never skip)', items: [
          ['extrot', { b1: '2 × 15', b2: '2 × 15', b3: '2 × 15', dl: '2 × 15' }],
          ['facepull', { b1: '3 × 15', b2: '3 × 15', b3: '3 × 15', dl: '2 × 15' }],
          ['ytw', { b1: '2 × 8 each', b2: '2 × 8 each', b3: '2 × 8 each', dl: '2 × 8 each' }],
          ['rollout', { b1: '3 × 8', b2: '3 × 10', b3: '3 × 12', dl: '2 × 8' }]
        ] }
      ]
    }
  };

  const WARMUPS = {
    general: { name: 'General warm-up · 8 min', items: [['rower', '3 min easy'], ['worlds', '5 / side'], ['legswing', '10 + 10 / leg'], ['pullapart', '15'], ['squatbw', '10']] },
    plyo: { name: 'Plyo warm-up · 12–15 min (morning)', items: [['bike', '4 min easy, building'], ['legswing', '10 + 10 / leg'], ['worlds', '5 / side'], ['hipthrust', '15 bodyweight glute bridges'], ['pogo', '2 × 10 low and easy'], ['squatbw', '10, then 3 small jumps']] },
    postswim: { name: 'Post-swim warm-up · 5 min (you\'re already warm)', items: [['pullapart', '15'], ['extrot', '10 / side, light'], ['worlds', '3 / side'], ['squatbw', '10']] }
  };
  const COOLDOWN = ['2–3 min easy bike or walk', 'Couch stretch 45 s / side', 'Doorway pec stretch 45 s / side', 'Child\'s pose with long arms 60 s', '5 slow nasal breaths lying down'];

  // Calorie / macro targets by phase
  const TARGETS = {
    early: { label: 'Weeks 1–6', a: { train: 2750, rest: 2250, p: 175, f: 75, cT: 340, cR: 220 }, b: { train: 2000, rest: 1650, p: 125, f: 60, cT: 240, cR: 150 } },
    late: { label: 'Weeks 7–12', note: 'Use these if the week-6 check-in shows your loss slowing (it usually does as you get lighter).', a: { train: 2650, rest: 2150, p: 175, f: 75, cT: 315, cR: 195 }, b: { train: 1950, rest: 1600, p: 125, f: 60, cT: 228, cR: 140 } }
  };

  const CATS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', pre: 'Pre-workout / pre-swim snack', early: 'Before the 7 am swim', protein: 'Protein snack / recovery' };

  // Day plans keyed by JS getDay() (0 Sun … 6 Sat)
  const DAYS = {
    6: { name: 'Saturday', type: 'train', swim: '1:00 pm', gym: 'D', items: [
      ['09:30', 'meal', 'breakfast'], ['11:45', 'meal', 'pre', 'Pre-swim snack'], ['13:00', 'swim', 'Swim'], ['14:30', 'meal', 'lunch', 'Lunch (recovery + fuel for the gym)'], ['17:00', 'gym', 'D'], ['18:15', 'meal', 'protein', 'Post-gym shake', 's_whey'], ['20:30', 'meal', 'dinner']] },
    0: { name: 'Sunday', type: 'train', swim: '7:00 pm', items: [
      ['09:30', 'meal', 'breakfast'], ['14:00', 'meal', 'lunch'], ['17:30', 'meal', 'pre', 'Pre-swim snack'], ['19:00', 'swim', 'Swim'], ['20:45', 'meal', 'dinner', 'Post-swim dinner'], ['22:00', 'meal', 'protein', 'Optional, if still hungry', 's_greek']] },
    1: { name: 'Monday', type: 'train', gym: 'A', items: [
      ['07:00', 'meal', 'pre', 'Pre-gym snack'], ['08:00', 'gym', 'A'], ['10:00', 'meal', 'breakfast', 'Post-gym breakfast'], ['14:00', 'meal', 'lunch'], ['17:30', 'meal', 'protein'], ['20:30', 'meal', 'dinner']] },
    2: { name: 'Tuesday', type: 'train', swim: '7:00 am', gym: 'B', items: [
      ['06:15', 'meal', 'early'], ['07:00', 'swim', 'Swim'], ['08:15', 'meal', 'protein', 'Shake between pool and gym', 's_whey'], ['08:30', 'gym', 'B'], ['10:15', 'meal', 'breakfast', 'Breakfast'], ['14:00', 'meal', 'lunch'], ['17:30', 'meal', 'protein', 'Afternoon snack', 's_termis'], ['20:30', 'meal', 'dinner']] },
    3: { name: 'Wednesday', type: 'train', swim: '7:00 pm', items: [
      ['09:30', 'meal', 'breakfast'], ['14:00', 'meal', 'lunch'], ['17:30', 'meal', 'pre', 'Pre-swim snack'], ['19:00', 'swim', 'Swim'], ['20:45', 'meal', 'dinner', 'Post-swim dinner'], ['22:00', 'meal', 'protein', 'Optional, if still hungry', 's_greek']] },
    4: { name: 'Thursday', type: 'train', gym: 'C', items: [
      ['07:00', 'meal', 'pre', 'Pre-gym snack (don\'t skip: plyos need fuel)'], ['08:00', 'gym', 'C'], ['10:00', 'meal', 'breakfast', 'Post-gym breakfast'], ['14:00', 'meal', 'lunch'], ['17:30', 'meal', 'protein'], ['20:30', 'meal', 'dinner']] },
    5: { name: 'Friday', type: 'rest', items: [
      ['10:00', 'meal', 'breakfast'], ['14:30', 'meal', 'lunch', 'Lunch: halve the rice or bread'], ['17:30', 'meal', 'protein'], ['20:30', 'meal', 'dinner', 'Dinner: halve the bread'], ['—', 'rest', 'Full rest: 8–10k steps, light stretching only']] }
  };

  const SWAPS = {
    carbs: { title: 'Carb swaps (each ≈ 1 cup cooked rice, ~200 kcal)', rows: ['1 cup cooked rice', '¾ baladi loaf', '1 cup cooked pasta', '250 g boiled or baked potato', '1 cup cooked freekeh or bulgur', '60 g oats (dry)'] },
    protein: { title: 'Protein swaps (each ≈ 35 g protein)', rows: ['150 g cooked chicken breast', '170 g white fish (bolti, denis, sea bass)', '130 g lean beef or kofta', '1 can tuna + 1 egg', '250 g areesh cheese', '300 g Greek yogurt', '1 scoop whey + 1 egg'] },
    fats: { title: 'Fat swaps (each ≈ 90–100 kcal)', rows: ['1 tbsp tahina', '2 tsp olive oil', '15 g nuts', '¼ avocado', '2 tsp ghee (use sparingly)'] },
    eatingOut: { title: 'Eating out in Cairo', rows: ['Grills (mashwyat): kofta or shish tawook + salad + 1 bread, skip the rice', 'Koshari: small size, add a side of grilled chicken or eggs; keep it for a swim day', 'Fish restaurant: grilled, not fried; sayadeya rice is fine on training days', 'Feteer and sweets: count as your carbs for that meal; best on Saturday after the swim'] }
  };

  const GROCERIES = [
    { group: 'Protein', items: ['Chicken breast · 3.5 kg', 'Lean beef / kofta mince (≤10% fat) · 1.5 kg', 'White fish fillet (bolti / sea bass) · 1.2 kg', 'Beef liver · 400 g', 'Eggs · 5 dozen + 1 L liquid egg whites (or extra eggs)', 'Tuna in water · 6 cans', 'Areesh cheese · 1.5 kg', 'Greek yogurt · 3 kg', 'Plain zabadi · 6 cups', 'Low-fat milk · 3 L', 'Whey protein · 1 tub lasts ~4 weeks'] },
    { group: 'Carbs', items: ['Egyptian rice · 2.5 kg', 'Baladi bread · ~22 loaves (freeze half)', 'Oats · 700 g', 'Toast bread · 1 pack', 'Ful medames · 4 cans (or 1 kg dry)', 'Red lentils · 500 g', 'Potatoes · 1.5 kg', 'Termis (lupini) · 750 g'] },
    { group: 'Vegetables', items: ['Tomatoes · 3 kg', 'Cucumbers · 2 kg', 'Rocca, lettuce, parsley, dill', 'Peppers · 1 kg', 'Onions · 1.5 kg + garlic', 'Frozen molokhia · 2 packs', 'Bamya or green beans · 1 kg', 'Carrots · 1 kg', 'Lemons · 1 kg'] },
    { group: 'Fruit (Nov–Feb season)', items: ['Bananas · 14', 'Oranges · 2 kg', 'Guava · 1 kg', 'Dates · 750 g', 'Strawberries · when available (from Dec)'] },
    { group: 'Fats, flavour + extras', items: ['Olive oil', 'Tahina · 1 jar', 'Mixed nuts · 300 g', 'Ghee (small jar, sparingly)', 'Honey', 'Cumin, coriander, 7-spice, paprika, garlic powder', 'Pickles, vinegar', 'Electrolyte sachets (for long or hot sessions)'] }
  ];

  const PREP = [
    { day: 'Friday evening (rest day)', tasks: ['Shop for the week (list above)', 'Grill 2 kg chicken: half plain, half shawarma-marinated', 'Cook 6 cups of rice and portion into boxes', 'Shape and grill kofta (or freeze raw)', 'Boil 12 eggs', 'Wash and chop the salad base for 3 days', 'Portion termis, nuts and dates into snack bags'] },
    { day: 'Tuesday after the gym', tasks: ['Cook a pot of molokhia or bamya (covers 2 lunches)', 'Make lentil soup for 2 dinners', 'Grill the second batch of chicken', 'Top up bread, fruit and salad'] },
    { day: 'Wednesday', tasks: ['Buy fresh fish for Thursday or Saturday lunch', 'Chop more salad'] }
  ];

  const FUEL = {
    swim: [
      ['Before the 7 am swim (Tue)', 'Small and fast: a banana or 2 dates with water 30–45 min before. Don\'t swim on nothing.'],
      ['Before the 1 pm swim (Sat)', 'Proper breakfast at 9:30, then a pre-swim snack at 11:45.'],
      ['Before the 7 pm swims (Sun, Wed)', 'Lunch by 2 pm, then a snack around 5:30 (banana + dates, or zabadi + dates).'],
      ['During the swim', 'Water bottle on deck. For sessions over 75 min or a hot pool, add an electrolyte sachet.'],
      ['After the swim', 'Within 60 min, eat protein plus carbs. After the evening swims, that\'s dinner itself. Plan it so post-swim hunger doesn\'t take over.']
    ],
    hydration: [
      ['Men', '≈ 3.5 L/day baseline + 500–750 ml per training hour'],
      ['Women', '≈ 2.5 L/day baseline + 500–750 ml per training hour'],
      ['Check', 'Pale-yellow urine by midday. You sweat in the pool even if you don\'t feel it.']
    ],
    supplements: [
      ['Whey protein', 'Convenient way to hit protein targets; it\'s food, not magic.'],
      ['Creatine monohydrate', '3–5 g daily, any time. Helps power and strength. Expect +0.5–1 kg of water weight in the first weeks; that\'s not fat.'],
      ['Caffeine', '1–3 mg/kg about 45 min before Thursday plyos or the Saturday session. None after ~2 pm on evening-swim days, to protect sleep.'],
      ['Vitamin D', 'Only if a blood test says you\'re low. Ask your doctor.'],
      ['Electrolytes', 'For long, hot or double-session days.']
    ],
    sleep: ['7.5–9 hours, especially before Tuesday\'s 7 am swim and Thursday\'s plyos.', 'Sunday and Wednesday finish late: eat dinner within 45 min of getting home, and keep screens off for the last 30 min.', 'Friday is full rest: walking and light stretching only.']
  };

  window.PLAN = { T, EX, SESSIONS, WARMUPS, COOLDOWN, TARGETS, CATS, DAYS, SWAPS, GROCERIES, PREP, FUEL, START: '2026-11-28', WEEKS: 12 };
})();
