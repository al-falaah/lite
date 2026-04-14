// Bilingual topic mapping for the Quranic Examples Finder
// Each topic maps English search terms to Arabic patterns found in the Surah App data
// explanation_en provides a brief English explanation shown with each result

export const TAJWEED_CATEGORIES = [
  {
    id: 'noon-sakinah',
    name_en: 'Noon Sakinah & Tanween',
    name_ar: 'أحكام النون الساكنة والتنوين',
    topics: [
      {
        id: 'izhar-halqi',
        name_en: 'Izhar Halqi (Clear Pronunciation)',
        name_ar: 'إظهار حلقي',
        search_ar: ['إظهار حلقي'],
        description: 'Clear pronunciation of noon/tanween before throat letters (ء ه ع ح غ خ)',
        explanation_en: 'The noon sakinah or tanween is pronounced clearly (without merging or hiding) because the next letter is one of six throat letters.',
      },
      {
        id: 'idgham-ghunnah',
        name_en: 'Idgham with Ghunnah',
        name_ar: 'إدغام بغنة',
        search_ar: ['إدغام بغنة', 'إدغام بغنّة'],
        description: 'Merging with nasalization into ي ن م و',
        explanation_en: 'The noon sakinah or tanween merges into the next letter (ي ن م و) with a nasal sound (ghunnah) held for 2 counts.',
      },
      {
        id: 'idgham-bila-ghunnah',
        name_en: 'Idgham without Ghunnah',
        name_ar: 'إدغام بغير غنة',
        search_ar: ['إدغام بغير غنة', 'إدغام بلا غنة'],
        description: 'Merging without nasalization into ل ر',
        explanation_en: 'The noon sakinah or tanween merges into the next letter (ل or ر) without any nasal sound.',
      },
      {
        id: 'ikhfa-haqiqi',
        name_en: 'Ikhfa Haqiqi (True Concealment)',
        name_ar: 'إخفاء حقيقي',
        search_ar: ['إخفاء حقيقي'],
        description: 'Concealing noon/tanween before 15 letters with nasalization',
        explanation_en: 'The noon sakinah or tanween is pronounced in a hidden way — between izhar and idgham — with a ghunnah (nasal sound), before one of 15 specific letters.',
      },
      {
        id: 'iqlab',
        name_en: 'Iqlab (Conversion)',
        name_ar: 'إقلاب',
        search_ar: ['إقلاب'],
        description: 'Converting noon/tanween to meem before ب',
        explanation_en: 'The noon sakinah or tanween is converted into a meem sound when followed by the letter ب, with a ghunnah held for 2 counts.',
      },
      {
        id: 'izhar-mutlaq',
        name_en: 'Izhar Mutlaq (Absolute Clarity)',
        name_ar: 'إظهار مطلق',
        search_ar: ['إظهار مطلق'],
        description: 'Clear pronunciation of noon when it occurs in the same word before و or ي',
        explanation_en: 'The noon sakinah is pronounced clearly because it appears in the same word as the following letter (و or ي), so idgham does not apply.',
      },
    ],
  },
  {
    id: 'meem-sakinah',
    name_en: 'Meem Sakinah Rules',
    name_ar: 'أحكام الميم الساكنة',
    topics: [
      {
        id: 'ikhfa-shafawi',
        name_en: 'Ikhfa Shafawi (Lip Concealment)',
        name_ar: 'إخفاء شفوي',
        search_ar: ['إخفاء شفوي'],
        description: 'Concealing meem sakinah before ب with ghunnah',
        explanation_en: 'The meem sakinah is concealed (not fully pronounced) when followed by ب, producing a nasal sound through the lips.',
      },
      {
        id: 'idgham-mithlayn',
        name_en: 'Idgham Mithlayn Sagheer',
        name_ar: 'إدغام مثلين صغير',
        search_ar: ['إدغام مثلين صغير', 'إدغام مثلين'],
        description: 'Merging meem sakinah into another meem',
        explanation_en: 'When meem sakinah meets another meem, the two merge into one meem with shaddah, producing a ghunnah held for 2 counts.',
      },
      {
        id: 'izhar-shafawi',
        name_en: 'Izhar Shafawi (Lip Clarity)',
        name_ar: 'إظهار شفوي',
        search_ar: ['إظهار شفوي'],
        description: 'Clear pronunciation of meem sakinah before all letters except ب and م',
        explanation_en: 'The meem sakinah is pronounced clearly and distinctly — no merging or hiding — because the next letter is not ب or م.',
      },
    ],
  },
  {
    id: 'idgham-types',
    name_en: 'Idgham Types (Merging)',
    name_ar: 'أنواع الإدغام',
    topics: [
      {
        id: 'idgham-tamaathul',
        name_en: 'Idgham Tamaathul (Identical Letters)',
        name_ar: 'إدغام تماثل',
        search_ar: ['إدغام تماثل', 'إدغام متماثلين'],
        description: 'Merging two identical letters (e.g. ب into ب, ت into ت)',
        explanation_en: 'When two identical letters meet (one with sukoon, the next voweled), the first merges into the second, producing a shaddah. For example: "اذهَبْ بكتابي" — ب merges into ب.',
      },
      {
        id: 'idgham-tajaanus',
        name_en: 'Idgham Tajaanus (Similar Articulation)',
        name_ar: 'إدغام تجانس',
        search_ar: ['إدغام تجانس', 'إدغام متجانسين'],
        description: 'Merging letters from the same articulation point but different qualities',
        explanation_en: 'Two letters that share the same articulation point but differ in qualities — the first merges into the second. For example: ت into د, ط into ت, ذ into ظ.',
      },
    ],
  },
  {
    id: 'madd',
    name_en: 'Elongation (Madd)',
    name_ar: 'أحكام المد',
    topics: [
      {
        id: 'madd-tabii',
        name_en: 'Madd Tabee\'i (Natural)',
        name_ar: 'مد طبيعي',
        search_ar: ['مد طبيعي'],
        description: 'Natural elongation of 2 counts — the default madd',
        explanation_en: 'A madd letter (ا و ي) is elongated for exactly 2 counts, with no hamza or sukoon after it. This is the basic, natural elongation.',
      },
      {
        id: 'madd-muttasil',
        name_en: 'Madd Muttasil (Connected Obligatory)',
        name_ar: 'مد متصل',
        search_ar: ['مد متصل'],
        description: 'Madd letter followed by hamza in the same word — 4 to 5 counts',
        explanation_en: 'A madd letter is followed by a hamza within the same word. It must be elongated 4–5 counts. Example: جَاءَ، سُوءَ، جِيءَ.',
      },
      {
        id: 'madd-munfasil',
        name_en: 'Madd Munfasil (Separated Permissible)',
        name_ar: 'مد منفصل',
        search_ar: ['مد منفصل'],
        description: 'Madd at end of one word, hamza at start of next — 4 to 5 counts',
        explanation_en: 'A madd letter ends one word and the next word starts with hamza. It is elongated 4–5 counts. Example: يَا أَيُّهَا، إِنَّا أَنْزَلْنَاهُ.',
      },
      {
        id: 'madd-arid',
        name_en: 'Madd \'Arid Lil-Sukoon (Temporary)',
        name_ar: 'مد عارض للسكون',
        search_ar: ['مد عارض للسكون', 'مد عارض'],
        description: 'Elongation when stopping on the last letter — 2, 4, or 6 counts',
        explanation_en: 'When you stop at the end of a word, the last letter gets sukoon. If there is a madd letter before it, you can elongate 2, 4, or 6 counts. Common at the end of ayahs.',
      },
      {
        id: 'madd-lazim',
        name_en: 'Madd Lazim (Obligatory)',
        name_ar: 'مد لازم',
        search_ar: ['مد لازم'],
        description: 'Obligatory 6-count elongation before permanent sukoon or shaddah',
        explanation_en: 'A madd letter is followed by a permanent sukoon or shaddah in the same word. Must be elongated exactly 6 counts. Example: الحَاقَّة، الضَّالِّينَ.',
      },
      {
        id: 'madd-lazim-kalimi',
        name_en: 'Madd Lazim Kalimi (Word-level)',
        name_ar: 'مد لازم كلمي',
        search_ar: ['مد لازم كلمي'],
        description: 'Obligatory madd within a word (before sukoon/shaddah)',
        explanation_en: 'A subcategory of madd lazim where the sukoon or shaddah occurs within an Arabic word (not in the disconnected letters). Always 6 counts.',
      },
      {
        id: 'madd-lazim-harfi',
        name_en: 'Madd Lazim Harfi (Letter-level)',
        name_ar: 'مد لازم حرفي',
        search_ar: ['مد لازم حرفي'],
        description: 'Obligatory madd in disconnected letters at the start of surahs',
        explanation_en: 'Found in the disconnected letters (حروف مقطعة) at the beginning of certain surahs, like الم، حم، طسم. These letters are spelled out and elongated for 6 counts.',
      },
      {
        id: 'madd-badal',
        name_en: 'Madd Badal (Substitute)',
        name_ar: 'مد بدل',
        search_ar: ['مد بدل'],
        description: 'Hamza followed by a madd letter — 2 counts',
        explanation_en: 'A hamza is followed by a madd letter. Originally there were two hamzas, but the second was replaced by a madd letter. Elongated for 2 counts. Example: آمَنُوا (originally أَأْمَنُوا).',
      },
      {
        id: 'madd-leen',
        name_en: 'Madd Leen (Soft Madd)',
        name_ar: 'مد لين',
        search_ar: ['مد لين'],
        description: 'و or ي with sukoon preceded by fathah, when stopping',
        explanation_en: 'A waw or ya with sukoon that is preceded by a fathah — but only when stopping on the word. Example: خَوْف، بَيْت. Can be elongated 2, 4, or 6 counts when stopping.',
      },
      {
        id: 'madd-silah',
        name_en: 'Madd Silah (Connection)',
        name_ar: 'مد صلة',
        search_ar: ['مد صلة'],
        description: 'Elongation of the ه pronoun suffix between two voweled letters',
        explanation_en: 'The ه at the end of a pronoun (his/him) is elongated when it falls between two voweled letters. Silah Sughra (short) = 2 counts; Silah Kubra (before hamza) = 4–5 counts.',
      },
      {
        id: 'madd-silah-sughra',
        name_en: 'Madd Silah Sughra (Short Connection)',
        name_ar: 'مد صلة صغرى',
        search_ar: ['مد صلة صغرى'],
        description: 'Short connection — ه pronoun between two voweled letters, no hamza after',
        explanation_en: 'The ه pronoun is between two voweled letters and the next letter is NOT hamza. Elongated like a natural madd (2 counts).',
      },
      {
        id: 'madd-silah-kubra',
        name_en: 'Madd Silah Kubra (Long Connection)',
        name_ar: 'مد صلة كبرى',
        search_ar: ['مد صلة كبرى'],
        description: 'Long connection — ه pronoun followed by hamza',
        explanation_en: 'The ه pronoun is between two voweled letters and the next word starts with hamza. Elongated 4–5 counts, like madd munfasil.',
      },
      {
        id: 'madd-iwad',
        name_en: 'Madd \'Iwad (Substitute at Stop)',
        name_ar: 'مد عوض',
        search_ar: ['مد عوض'],
        description: 'Replacing tanween fathah with alif when stopping',
        explanation_en: 'When stopping on a word that ends with tanween fathah (ـًا), the tanween is replaced by an alif sound elongated for 2 counts. Example: عَلِيمًا → عَلِيمَا.',
      },
      {
        id: 'madd-tamkeen',
        name_en: 'Madd Tamkeen (Established)',
        name_ar: 'مد تمكين',
        search_ar: ['مد تمكين'],
        description: 'Two ya letters meeting — one with shaddah+kasra, the next sakinah',
        explanation_en: 'When a ya with shaddah and kasra (يِّ) is followed by a ya sakinah (ي), both are pronounced distinctly to avoid merging. Example: النَّبِيِّين.',
      },
    ],
  },
  {
    id: 'qalqalah',
    name_en: 'Qalqalah (Echo/Bounce)',
    name_ar: 'القلقلة',
    topics: [
      {
        id: 'qalqalah',
        name_en: 'Qalqalah (Echo Sound)',
        name_ar: 'قلقلة',
        search_ar: ['قلقلة', 'مقلقلة'],
        description: 'Bouncing echo on letters ق ط ب ج د when they have sukoon',
        explanation_en: 'When one of the five qalqalah letters (ق ط ب ج د — remembered as قُطْبُ جَد) has a sukoon, it produces a slight bouncing/echoing sound. Stronger when stopping on the letter.',
      },
    ],
  },
  {
    id: 'ghunnah',
    name_en: 'Ghunnah (Nasalization)',
    name_ar: 'الغنة',
    topics: [
      {
        id: 'ghunnah',
        name_en: 'Ghunnah (Nasal Sound)',
        name_ar: 'غنة',
        search_ar: ['غنة'],
        description: 'Nasal sound from the nose, accompanying noon and meem',
        explanation_en: 'A nasal sound produced from the nasal passage, lasting 2 counts. It accompanies noon or meem with shaddah, and appears in ikhfa, idgham with ghunnah, and other rules.',
      },
    ],
  },
  {
    id: 'ra-rules',
    name_en: 'Ra Rules (Tafkheem & Tarqeeq)',
    name_ar: 'أحكام الراء',
    topics: [
      {
        id: 'ra-tafkheem',
        name_en: 'Ra Tafkheem (Heavy/Thick Ra)',
        name_ar: 'الراء المفخمة',
        search_ar: ['مفخم', 'تفخيم', 'مفخمة', 'الراء المفخمة'],
        description: 'Heavy/thick pronunciation of the letter Ra',
        explanation_en: 'The letter Ra is pronounced with a full, thick sound (tafkheem). This happens when Ra has fathah, dammah, or sukoon preceded by fathah/dammah, among other conditions.',
      },
      {
        id: 'ra-tarqeeq',
        name_en: 'Ra Tarqeeq (Light/Thin Ra)',
        name_ar: 'الراء المرققة',
        search_ar: ['مرقق', 'ترقيق', 'مرققة', 'الراء المرققة'],
        description: 'Light/thin pronunciation of the letter Ra',
        explanation_en: 'The letter Ra is pronounced with a light, thin sound (tarqeeq). This happens when Ra has kasra, or sukoon preceded by kasra (with conditions), among other rules.',
      },
    ],
  },
  {
    id: 'lam-rules',
    name_en: 'Lam Rules',
    name_ar: 'أحكام اللام',
    topics: [
      {
        id: 'lam-shamsiyyah',
        name_en: 'Lam Shamsiyyah (Sun Letters)',
        name_ar: 'لام شمسية',
        search_ar: ['لام شمسية', 'شمسية', 'إدغام شمسي'],
        description: 'The lam of ال is silent — it merges into the next "sun" letter',
        explanation_en: 'In "ال" (the), the lam is not pronounced when followed by a sun letter (ت ث د ذ ر ز س ش ص ض ط ظ ل ن). Instead it merges into the next letter, which gets shaddah. Example: الشَّمْس.',
      },
      {
        id: 'lam-qamariyyah',
        name_en: 'Lam Qamariyyah (Moon Letters)',
        name_ar: 'لام قمرية',
        search_ar: ['لام قمرية', 'قمرية'],
        description: 'The lam of ال is pronounced clearly before "moon" letters',
        explanation_en: 'In "ال" (the), the lam is pronounced clearly when followed by a moon letter (ا ب ج ح خ ع غ ف ق ك م و ه ي). Example: الْقَمَر.',
      },
      {
        id: 'lam-jalalah',
        name_en: 'Lam in Allah\'s Name',
        name_ar: 'لام لفظ الجلالة',
        search_ar: ['اسم الجلالة', 'لام لفظ الجلالة'],
        description: 'The lam in "Allah" — heavy after fathah/dammah, light after kasrah',
        explanation_en: 'The lam in the word الله has a special rule: it is pronounced heavy (tafkheem) when preceded by fathah or dammah, and light (tarqeeq) when preceded by kasrah.',
      },
    ],
  },
  {
    id: 'waqf-ibtida',
    name_en: 'Stopping & Starting (Waqf)',
    name_ar: 'الوقف والابتداء',
    topics: [
      {
        id: 'waqf',
        name_en: 'Waqf (Stopping Rules)',
        name_ar: 'الوقف',
        search_ar: ['وقف', 'الوقف'],
        description: 'Rules for stopping at the end of a word or ayah',
        explanation_en: 'Waqf means stopping your recitation at a point. There are rules about where you can and cannot stop, and how the last letter changes when you do (e.g., tanween becomes sukoon, taa marbuta becomes ه).',
      },
      {
        id: 'sakt',
        name_en: 'Sakt (Brief Pause)',
        name_ar: 'سكت',
        search_ar: ['سكت'],
        description: 'A very brief pause without breathing — at specific places in the Quran',
        explanation_en: 'A brief stop without taking a breath, at specific places marked in the Quran. Unlike waqf, you don\'t breathe during sakt. It occurs in 4 places in Hafs\' reading.',
      },
      {
        id: 'imalah',
        name_en: 'Imalah (Tilting)',
        name_ar: 'إمالة',
        search_ar: ['إمالة'],
        description: 'Tilting the fathah towards kasrah in specific words (Hafs: هَار in Hud)',
        explanation_en: 'Imalah means tilting the pronunciation of a fathah towards kasrah and alif towards ya. In Hafs\' reading, it occurs only in the word "مَجْرَاهَا" in Surah Hud (11:41).',
      },
    ],
  },
  {
    id: 'hamzah-rules',
    name_en: 'Hamzah Rules',
    name_ar: 'أحكام الهمزة',
    topics: [
      {
        id: 'hamzat-wasl',
        name_en: 'Hamzat Al-Wasl (Connecting Hamza)',
        name_ar: 'همزة الوصل',
        search_ar: ['همزة الوصل'],
        description: 'Hamza pronounced only at the start of speech, dropped when connected',
        explanation_en: 'Hamzat al-wasl (ٱ) is pronounced when you start with the word, but dropped when connecting from a previous word. Found in ال, past tense verb forms (VII–X), and some nouns.',
      },
      {
        id: 'hamzat-qat',
        name_en: 'Hamzat Al-Qat\' (Cutting Hamza)',
        name_ar: 'همزة القطع',
        search_ar: ['همزة القطع'],
        description: 'Hamza always pronounced, whether starting or connecting',
        explanation_en: 'Hamzat al-qat\' (أ إ) is always pronounced regardless of whether you start from it or connect to it from a previous word.',
      },
      {
        id: 'tasheel',
        name_en: 'Tasheel (Facilitation)',
        name_ar: 'تسهيل',
        search_ar: ['تسهيل'],
        description: 'Softening the pronunciation of hamza between hamza and alif',
        explanation_en: 'When two hamzas meet, the second may be softened (pronounced between hamza and alif) to make it easier. Example: أَأَنذَرْتَهُمْ.',
      },
      {
        id: 'ishmaam',
        name_en: 'Ishmaam (Lip Rounding)',
        name_ar: 'إشمام',
        search_ar: ['إشمام'],
        description: 'A slight rounding of the lips indicating a dammah without voicing it',
        explanation_en: 'Ishmaam involves rounding the lips to signal a dammah without actually producing the sound. In Hafs\' reading, it appears in لَا تَأْمَنَّا (Yusuf 12:11).',
      },
      {
        id: 'rawm',
        name_en: 'Rawm (Slight Vocalization)',
        name_ar: 'روم',
        search_ar: ['روم'],
        description: 'Weakening the vowel when stopping — a faint sound of the original harakah',
        explanation_en: 'When stopping on a word, rawm means producing a very faint trace of the original vowel (dammah or kasrah). Listeners nearby might hear it, but those far away would not.',
      },
    ],
  },
];

export const NAHW_CATEGORIES = [
  {
    id: 'verb-types',
    name_en: 'Verb Types',
    name_ar: 'أنواع الأفعال',
    topics: [
      {
        id: 'fil-maadi',
        name_en: 'Fi\'l Maadi (Past Tense)',
        name_ar: 'فعل ماض',
        search_ar: ['فعل ماض'],
        description: 'A verb indicating a completed action in the past',
        explanation_en: 'This is a past tense verb (فعل ماض). It indicates an action that has already been completed.',
      },
      {
        id: 'fil-mudari',
        name_en: 'Fi\'l Mudaari\' (Present/Future)',
        name_ar: 'فعل مضارع',
        search_ar: ['فعل مضارع'],
        description: 'A verb indicating an ongoing or future action',
        explanation_en: 'This is a present/future tense verb (فعل مضارع). It indicates an action happening now or in the future. It always starts with one of the letters ن أ ت ي.',
      },
      {
        id: 'fil-amr',
        name_en: 'Fi\'l Amr (Command/Imperative)',
        name_ar: 'فعل أمر',
        search_ar: ['فعل أمر'],
        description: 'A command verb — do this!',
        explanation_en: 'This is a command verb (فعل أمر), used to order or instruct someone to do something.',
      },
    ],
  },
  {
    id: 'sentence-components',
    name_en: 'Sentence Components',
    name_ar: 'أركان الجملة',
    topics: [
      {
        id: 'mubtada',
        name_en: 'Mubtada (Subject)',
        name_ar: 'مبتدأ',
        search_ar: ['مبتدأ'],
        description: 'Subject of a nominal sentence — always marfoo\'',
        explanation_en: 'The mubtada is the subject that starts a nominal sentence (جملة اسمية). It is always in the nominative case (marfoo\').',
      },
      {
        id: 'khabar',
        name_en: 'Khabar (Predicate)',
        name_ar: 'خبر',
        search_ar: ['خبر'],
        description: 'Predicate that completes the meaning of the mubtada',
        explanation_en: 'The khabar is the predicate that tells us something about the mubtada (subject). Together they form a complete nominal sentence.',
      },
      {
        id: 'khabar-mubtada',
        name_en: 'Khabar Al-Mubtada',
        name_ar: 'خبر المبتدأ',
        search_ar: ['خبر المبتدأ'],
        description: 'The predicate specifically of the mubtada in a nominal sentence',
        explanation_en: 'This word is the predicate (khabar) of the subject (mubtada) in a nominal sentence. It completes the meaning and matches the mubtada in definiteness and number.',
      },
      {
        id: 'khabar-muqaddam',
        name_en: 'Khabar Muqaddam (Fronted Predicate)',
        name_ar: 'خبر مقدم',
        search_ar: ['خبر مقدم'],
        description: 'A predicate placed before its subject for emphasis or grammatical necessity',
        explanation_en: 'Normally the subject (mubtada) comes first, but sometimes the predicate (khabar) is placed first. This is common with prepositional phrases and adverbs of place.',
      },
      {
        id: 'mubtada-muakhkhar',
        name_en: 'Mubtada Mu\'akhkhar (Delayed Subject)',
        name_ar: 'مبتدأ مؤخر',
        search_ar: ['مبتدأ مؤخر'],
        description: 'A subject placed after its predicate',
        explanation_en: 'The subject (mubtada) is delayed and placed after the predicate (khabar). This reversal is required in certain grammatical structures.',
      },
      {
        id: 'faa-il',
        name_en: 'Faa\'il (Doer/Subject of Verb)',
        name_ar: 'فاعل',
        search_ar: ['فاعل'],
        description: 'The one who performs the action — always marfoo\'',
        explanation_en: 'The faa\'il is the doer of the action in a verbal sentence. It comes after the verb and is always in the nominative case (marfoo\').',
      },
      {
        id: 'naib-faa-il',
        name_en: 'Naa\'ib al-Faa\'il (Deputy Doer)',
        name_ar: 'نائب فاعل',
        search_ar: ['نائب فاعل', 'نائب الفاعل'],
        description: 'The subject of a passive verb — takes the place of the absent doer',
        explanation_en: 'When a verb is in the passive form, the original doer is removed and the object takes its place as naa\'ib al-faa\'il (deputy doer), in the nominative case.',
      },
    ],
  },
  {
    id: 'objects-complements',
    name_en: 'Objects & Complements',
    name_ar: 'المفاعيل والمتممات',
    topics: [
      {
        id: 'maf-ool-bihi',
        name_en: 'Maf\'ool Bihi (Direct Object)',
        name_ar: 'مفعول به',
        search_ar: ['مفعول به'],
        description: 'The thing that the action falls upon — always mansub',
        explanation_en: 'The maf\'ool bihi is the direct object — the thing or person that receives the action. It is always in the accusative case (mansub).',
      },
      {
        id: 'maf-ool-mutlaq',
        name_en: 'Maf\'ool Mutlaq (Absolute/Cognate Object)',
        name_ar: 'مفعول مطلق',
        search_ar: ['مفعول مطلق'],
        description: 'A verbal noun from the same root as the verb, for emphasis or description',
        explanation_en: 'A verbal noun derived from the same root as the verb, placed after it for emphasis or to describe the manner of the action. Example: ضَرَبَ ضَرْبًا (he struck a striking).',
      },
      {
        id: 'maf-ool-fihi',
        name_en: 'Maf\'ool Fihi (Adverb of Time/Place)',
        name_ar: 'مفعول فيه',
        search_ar: ['مفعول فيه', 'ظرف زمان', 'ظرف مكان', 'ظرف'],
        description: 'Adverb indicating when or where the action happened',
        explanation_en: 'The maf\'ool fihi indicates the time or place of the action. It functions as an adverb and is in the accusative case (mansub). Examples: يَوْمَ (day), عِنْدَ (at).',
      },
      {
        id: 'maf-ool-li-ajlihi',
        name_en: 'Maf\'ool Li-Ajlihi (Object of Reason)',
        name_ar: 'مفعول لأجله',
        search_ar: ['مفعول لأجله'],
        description: 'Explains the reason/purpose behind the action',
        explanation_en: 'A verbal noun that explains WHY the action was done. It answers the question "for what reason?" and is in the accusative case. Example: قُمْتُ إِجْلَالًا (I stood out of respect).',
      },
      {
        id: 'haal',
        name_en: 'Haal (State/Condition)',
        name_ar: 'حال',
        search_ar: ['حال'],
        description: 'Describes the state of the doer or object during the action',
        explanation_en: 'Haal describes the condition or state of the subject or object at the time the action occurs. It is always indefinite and accusative (mansub). Example: جَاءَ رَاكِبًا (he came riding).',
      },
      {
        id: 'tamyeez',
        name_en: 'Tamyeez (Specification)',
        name_ar: 'تمييز',
        search_ar: ['تمييز'],
        description: 'Clarifies an ambiguous noun or sentence — removes vagueness',
        explanation_en: 'Tamyeez is a noun that removes ambiguity from what precedes it. It specifies what is being counted, measured, or compared. Always accusative (mansub). Example: عِشْرُونَ كِتَابًا (twenty books).',
      },
    ],
  },
  {
    id: 'qualifiers',
    name_en: 'Qualifiers & Followers',
    name_ar: 'التوابع',
    topics: [
      {
        id: 'nat',
        name_en: 'Na\'t / Sifah (Adjective)',
        name_ar: 'نعت',
        search_ar: ['نعت', 'صفة'],
        description: 'An adjective that follows and describes a noun — matches its case',
        explanation_en: 'The na\'t (also called sifah) is an adjective that describes the noun before it. It must match that noun in case (i\'rab), gender, number, and definiteness.',
      },
      {
        id: 'atf',
        name_en: '\'Atf (Conjunction/Coordination)',
        name_ar: 'عطف',
        search_ar: ['عطف', 'حرف عطف', 'معطوف'],
        description: 'Joining nouns or sentences with و، ف، ثم، أو, etc.',
        explanation_en: 'Atf connects words or sentences using conjunctions (و = and, ف = then, ثم = then after, أو = or). The word after the conjunction follows the same grammatical case as the word before it.',
      },
      {
        id: 'badal',
        name_en: 'Badal (Substitution/Apposition)',
        name_ar: 'بدل',
        search_ar: ['بدل'],
        description: 'A word that replaces or further specifies the one before it',
        explanation_en: 'Badal is a word placed after another to clarify, specify, or replace it. It follows the same grammatical case. Example: "The guide, Muhammad, came" — Muhammad is badal of the guide.',
      },
      {
        id: 'tawkeed',
        name_en: 'Tawkeed (Emphasis)',
        name_ar: 'توكيد',
        search_ar: ['توكيد'],
        description: 'A word used to emphasize what precedes it',
        explanation_en: 'Tawkeed is used to emphasize and confirm the word before it. It can be verbal (repeating the same word) or semantic (using words like نَفْس، عَيْن، كُلّ، جَمِيع).',
      },
    ],
  },
  {
    id: 'case-markers',
    name_en: 'Grammatical Cases (I\'rab)',
    name_ar: 'علامات الإعراب',
    topics: [
      {
        id: 'marfoo',
        name_en: 'Marfoo\' (Nominative Case)',
        name_ar: 'مرفوع',
        search_ar: ['مرفوع'],
        description: 'The nominative case — for subjects, predicates. Marked by dammah/waw/alif/noon',
        explanation_en: 'Marfoo\' indicates the nominative case. Words are marfoo\' when they are: mubtada (subject), khabar (predicate), faa\'il (doer), or naa\'ib al-faa\'il. Signs include dammah, waw, alif, or ثبوت النون.',
      },
      {
        id: 'mansub',
        name_en: 'Mansub (Accusative Case)',
        name_ar: 'منصوب',
        search_ar: ['منصوب'],
        description: 'The accusative case — for objects, haal, tamyeez. Marked by fathah/alif/ya/kasrah',
        explanation_en: 'Mansub indicates the accusative case. Words are mansub when they are: maf\'ool bihi (object), haal, tamyeez, or after certain particles (إنّ، كان). Signs include fathah, alif, ya, or kasrah.',
      },
      {
        id: 'majroor',
        name_en: 'Majroor (Genitive Case)',
        name_ar: 'مجرور',
        search_ar: ['مجرور', 'اسم مجرور'],
        description: 'The genitive case — after prepositions or in idafa. Marked by kasrah/ya/fathah',
        explanation_en: 'Majroor indicates the genitive case. A word is majroor after a preposition (حرف جر) or when it is mudaf ilayhi (second part of idafa). Signs include kasrah, ya, or fathah (for diptotes).',
      },
      {
        id: 'majzoom',
        name_en: 'Majzoom (Jussive Case)',
        name_ar: 'مجزوم',
        search_ar: ['مجزوم'],
        description: 'The jussive case — only for present-tense verbs, after لم، لا الناهية, conditional particles',
        explanation_en: 'Majzoom applies only to present-tense verbs. A verb is majzoom after particles like لَمْ (did not), لَا (prohibition), and in conditional sentences. Signs include sukoon or dropping the final noon/letter.',
      },
    ],
  },
  {
    id: 'particles',
    name_en: 'Particles',
    name_ar: 'الحروف',
    topics: [
      {
        id: 'harf-jar',
        name_en: 'Preposition (Harf Jarr)',
        name_ar: 'حرف جر',
        search_ar: ['حرف جر', 'جار ومجرور'],
        description: 'Causes the following noun to be in the genitive case (majroor)',
        explanation_en: 'A preposition (حرف جر) puts the noun after it into the genitive case. Common prepositions: في (in), من (from), إلى (to), على (on), عن (from/about), ب (by/with), ل (for), ك (like).',
      },
      {
        id: 'harf-nafi',
        name_en: 'Negation Particle',
        name_ar: 'حرف نفي',
        search_ar: ['حرف نفي'],
        description: 'Negation particles: لا، ما، لم، لن, etc.',
        explanation_en: 'A negation particle denies or negates the action or statement. Common ones: لَمْ (did not — past), لَا (not — present), لَنْ (will not — future), مَا (not).',
      },
      {
        id: 'harf-shart',
        name_en: 'Conditional Particle',
        name_ar: 'أداة شرط',
        search_ar: ['حرف شرط', 'أداة شرط', 'شرط'],
        description: 'Conditional particles: إن، من، ما، إذا، لو',
        explanation_en: 'Conditional particles create "if…then" sentences. إنْ and مَنْ cause jazm (jussive) in the verbs. إذا and لو are also conditional but have different grammatical effects.',
      },
    ],
  },
  {
    id: 'noun-types',
    name_en: 'Noun Types & Pronouns',
    name_ar: 'أنواع الأسماء والضمائر',
    topics: [
      {
        id: 'dameer',
        name_en: 'Dameer (Pronoun)',
        name_ar: 'ضمير',
        search_ar: ['ضمير'],
        description: 'Personal pronouns — attached (suffix) or detached (independent)',
        explanation_en: 'A dameer (pronoun) replaces a noun. Attached pronouns are suffixes (ـه، ـهم، ـك، ـنا), while detached pronouns are independent words (هو، هي، أنت، نحن). Each has a specific grammatical role.',
      },
      {
        id: 'ism-mawsool',
        name_en: 'Ism Mawsool (Relative Pronoun)',
        name_ar: 'اسم موصول',
        search_ar: ['اسم موصول', 'صلة الموصول'],
        description: 'الذي، التي، الذين — "who", "which", "that"',
        explanation_en: 'A relative pronoun (الذي = who/which/that) connects to a clause called صلة الموصول (relative clause) which defines or describes it. It must match in gender and number.',
      },
      {
        id: 'ism-isharah',
        name_en: 'Ism Isharah (Demonstrative)',
        name_ar: 'اسم إشارة',
        search_ar: ['اسم إشارة'],
        description: 'هذا، هذه، ذلك — "this", "that", "these", "those"',
        explanation_en: 'Demonstrative pronouns point to something specific. هذا (this, masc.), هذه (this, fem.), ذلك (that, masc.), تلك (that, fem.), هؤلاء (these), أولئك (those).',
      },
      {
        id: 'mudaf-idafa',
        name_en: 'Mudaf Ilayhi (Possessive/Idafa)',
        name_ar: 'مضاف إليه',
        search_ar: ['مضاف إليه'],
        description: 'Second part of a possessive construction — always majroor',
        explanation_en: 'In an idafa (possessive) construction, the second noun (mudaf ilayhi) is always in the genitive case (majroor). Example: كِتَابُ اللهِ (Book of Allah) — الله is mudaf ilayhi.',
      },
    ],
  },
  {
    id: 'sentence-types',
    name_en: 'Sentence & Clause Types',
    name_ar: 'أنواع الجمل',
    topics: [
      {
        id: 'jumlah',
        name_en: 'Jumlah (Sentence/Clause)',
        name_ar: 'جملة',
        search_ar: ['جملة'],
        description: 'A complete sentence or clause — nominal (اسمية) or verbal (فعلية)',
        explanation_en: 'A jumlah (sentence) is either nominal (starts with a noun: mubtada + khabar) or verbal (starts with a verb: fi\'l + faa\'il). Sub-clauses in Arabic grammar can fill various roles (khabar, haal, sifah, etc.).',
      },
      {
        id: 'mabni',
        name_en: 'Mabniy (Indeclinable/Fixed)',
        name_ar: 'مبني',
        search_ar: ['مبني'],
        description: 'A word whose ending does not change regardless of its position in the sentence',
        explanation_en: 'A mabniy word has a fixed ending that does not change with grammatical position. Examples: past tense verbs, imperative verbs, particles, some pronouns and nouns. Contrast with mu\'rab (declinable).',
      },
    ],
  },
  {
    id: 'special',
    name_en: 'Special Constructions',
    name_ar: 'أساليب خاصة',
    topics: [
      {
        id: 'nida',
        name_en: 'Nidaa\' (Vocative/Calling)',
        name_ar: 'نداء',
        search_ar: ['نداء', 'منادى'],
        description: 'Calling or addressing someone: يَا أَيُّهَا الَّذِينَ آمَنُوا',
        explanation_en: 'Nidaa\' is the vocative construction used to call or address someone. The most common particle is يا. The person being called (منادى) has specific grammatical rules depending on whether it\'s a proper noun or a description.',
      },
      {
        id: 'istithnaa',
        name_en: 'Istithna\' (Exception)',
        name_ar: 'استثناء',
        search_ar: ['استثناء', 'مستثنى'],
        description: 'Exception constructions using إلا، غير، سوى',
        explanation_en: 'Istithna\' excludes something from a general statement using words like إلَّا (except), غَيْر (other than), سِوَى (besides). The مستثنى (excepted item) has specific case rules.',
      },
      {
        id: 'istifham',
        name_en: 'Istifhaam (Question)',
        name_ar: 'استفهام',
        search_ar: ['حرف استفهام', 'استفهام'],
        description: 'Question words: هل، أ، من، ما، أين، كيف',
        explanation_en: 'Istifhaam is used to ask questions. هَلْ and أ (hamza) are yes/no question particles. مَنْ (who), مَا (what), أَيْنَ (where), كَيْفَ (how), مَتَى (when) ask for specific information.',
      },
      {
        id: 'kaana-akhawat',
        name_en: 'Kaana & Sisters',
        name_ar: 'كان وأخواتها',
        search_ar: ['اسم كان', 'خبر كان'],
        description: 'كان، أصبح، ظل, etc. — verbs that modify nominal sentences',
        explanation_en: 'كان and its sisters are verbs that enter upon a nominal sentence. The mubtada becomes "ism kaan" (stays marfoo\') and the khabar becomes "khabar kaan" (becomes mansub). Example: كان زيدٌ قائمًا.',
      },
      {
        id: 'inna-akhawat',
        name_en: 'Inna & Sisters',
        name_ar: 'إن وأخواتها',
        search_ar: ['اسم إن', 'خبر إن'],
        description: 'إنّ، أنّ، لكنّ, etc. — particles that modify nominal sentences',
        explanation_en: 'إنّ and its sisters are particles that enter upon a nominal sentence. The mubtada becomes "ism inna" (becomes mansub) and the khabar becomes "khabar inna" (stays marfoo\'). Example: إنّ اللهَ غفورٌ.',
      },
    ],
  },
];

// Build a flat searchable index for quick lookup
export function buildSearchIndex() {
  const index = [];

  for (const cat of TAJWEED_CATEGORIES) {
    for (const topic of cat.topics) {
      index.push({
        ...topic,
        category: cat.name_en,
        category_ar: cat.name_ar,
        subject: 'tajweed',
        table: 'quran_tajweed_aya',
      });
    }
  }

  for (const cat of NAHW_CATEGORIES) {
    for (const topic of cat.topics) {
      index.push({
        ...topic,
        category: cat.name_en,
        category_ar: cat.name_ar,
        subject: 'nahw',
        table: 'quran_eerab_aya',
      });
    }
  }

  return index;
}

// Search topics by English or Arabic text
export function searchTopics(query, index) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();

  return index.filter((topic) => {
    // Match English name or description
    if (topic.name_en.toLowerCase().includes(q)) return true;
    if (topic.description.toLowerCase().includes(q)) return true;
    // Match Arabic name
    if (topic.name_ar.includes(query)) return true;
    // Match Arabic search terms
    if (topic.search_ar.some((t) => t.includes(query))) return true;
    // Match category
    if (topic.category.toLowerCase().includes(q)) return true;
    if (topic.category_ar.includes(query)) return true;
    return false;
  });
}
