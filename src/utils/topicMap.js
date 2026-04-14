// Bilingual topic mapping for the Quranic Examples Finder
// Each topic maps English search terms to Arabic patterns found in the Surah App data

export const TAJWEED_CATEGORIES = [
  {
    id: 'noon-sakinah',
    name_en: 'Noon Sakinah & Tanween',
    name_ar: 'أحكام النون الساكنة والتنوين',
    topics: [
      {
        id: 'izhar-halqi',
        name_en: 'Izhar (Clear Pronunciation)',
        name_ar: 'إظهار حلقي',
        search_ar: ['إظهار حلقي'],
        description: 'Clear pronunciation before throat letters (ء ه ع ح غ خ)',
      },
      {
        id: 'idgham-ghunnah',
        name_en: 'Idgham with Ghunnah',
        name_ar: 'إدغام بغنة',
        search_ar: ['إدغام بغنة', 'إدغام بغنّة'],
        description: 'Merging with nasalization into ي ن م و',
      },
      {
        id: 'idgham-bila-ghunnah',
        name_en: 'Idgham without Ghunnah',
        name_ar: 'إدغام بغير غنة',
        search_ar: ['إدغام بغير غنة', 'إدغام بلا غنة'],
        description: 'Merging without nasalization into ل ر',
      },
      {
        id: 'ikhfa-haqiqi',
        name_en: 'Ikhfa (Concealment)',
        name_ar: 'إخفاء حقيقي',
        search_ar: ['إخفاء حقيقي'],
        description: 'Concealing noon/tanween before 15 letters with nasalization',
      },
      {
        id: 'iqlab',
        name_en: 'Iqlab (Conversion to Meem)',
        name_ar: 'إقلاب',
        search_ar: ['إقلاب'],
        description: 'Converting noon/tanween to meem before ب',
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
        description: 'Concealing meem sakinah before ب',
      },
      {
        id: 'idgham-mithlayn',
        name_en: 'Idgham Mithlayn (Meem into Meem)',
        name_ar: 'إدغام مثلين صغير',
        search_ar: ['إدغام مثلين صغير', 'إدغام مثلين'],
        description: 'Merging meem sakinah into another meem',
      },
      {
        id: 'izhar-shafawi',
        name_en: 'Izhar Shafawi (Lip Clear Pronunciation)',
        name_ar: 'إظهار شفوي',
        search_ar: ['إظهار شفوي'],
        description: 'Clear pronunciation of meem sakinah before all letters except ب and م',
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
        description: 'Natural elongation of 2 counts',
      },
      {
        id: 'madd-muttasil',
        name_en: 'Madd Muttasil (Connected)',
        name_ar: 'مد متصل',
        search_ar: ['مد متصل'],
        description: 'Madd letter followed by hamza in the same word (4-5 counts)',
      },
      {
        id: 'madd-munfasil',
        name_en: 'Madd Munfasil (Separated)',
        name_ar: 'مد منفصل',
        search_ar: ['مد منفصل'],
        description: 'Madd letter at end of word, hamza at start of next (4-5 counts)',
      },
      {
        id: 'madd-arid',
        name_en: 'Madd \'Arid Lil-Sukoon',
        name_ar: 'مد عارض للسكون',
        search_ar: ['مد عارض للسكون', 'مد عارض'],
        description: 'Elongation when stopping (2, 4, or 6 counts)',
      },
      {
        id: 'madd-lazim',
        name_en: 'Madd Lazim (Obligatory)',
        name_ar: 'مد لازم',
        search_ar: ['مد لازم'],
        description: 'Obligatory 6-count elongation before sukoon or shaddah',
      },
      {
        id: 'madd-badal',
        name_en: 'Madd Badal (Substitute)',
        name_ar: 'مد بدل',
        search_ar: ['مد بدل'],
        description: 'Madd letter replacing a hamza (2 counts)',
      },
      {
        id: 'madd-leen',
        name_en: 'Madd Leen (Soft)',
        name_ar: 'مد لين',
        search_ar: ['مد لين'],
        description: 'Waw/Ya sakinah preceded by fathah when stopping',
      },
      {
        id: 'madd-silah',
        name_en: 'Madd Silah (Connection)',
        name_ar: 'مد صلة',
        search_ar: ['مد صلة', 'مد صلة كبرى', 'مد صلة صغرى'],
        description: 'Elongation of the Ha pronoun between two voweled letters',
      },
    ],
  },
  {
    id: 'qalqalah',
    name_en: 'Qalqalah (Echo)',
    name_ar: 'قلقلة',
    topics: [
      {
        id: 'qalqalah',
        name_en: 'Qalqalah (Echo/Bounce)',
        name_ar: 'قلقلة',
        search_ar: ['قلقلة'],
        description: 'Echo sound on ق ط ب ج د with sukoon',
      },
    ],
  },
  {
    id: 'ra-rules',
    name_en: 'Ra Rules',
    name_ar: 'أحكام الراء',
    topics: [
      {
        id: 'ra-tafkheem',
        name_en: 'Ra Tafkheem (Heavy)',
        name_ar: 'الراء المفخمة',
        search_ar: ['مفخم', 'تفخيم'],
        description: 'Heavy/thick pronunciation of Ra',
      },
      {
        id: 'ra-tarqeeq',
        name_en: 'Ra Tarqeeq (Light)',
        name_ar: 'الراء المرققة',
        search_ar: ['مرققة', 'ترقيق'],
        description: 'Light/thin pronunciation of Ra',
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
        name_en: 'Lam Shamsiyyah (Sun Lam)',
        name_ar: 'لام شمسية',
        search_ar: ['لام شمسية'],
        description: 'Silent lam before sun letters',
      },
      {
        id: 'lam-qamariyyah',
        name_en: 'Lam Qamariyyah (Moon Lam)',
        name_ar: 'لام قمرية',
        search_ar: ['لام قمرية'],
        description: 'Pronounced lam before moon letters',
      },
    ],
  },
  {
    id: 'ghunnah',
    name_en: 'Ghunnah (Nasalization)',
    name_ar: 'غنة',
    topics: [
      {
        id: 'ghunnah',
        name_en: 'Ghunnah (Nasal Sound)',
        name_ar: 'غنة',
        search_ar: ['غنة'],
        description: 'Nasal sound from noon/meem with shaddah (2 counts)',
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
        description: 'A verb indicating a completed action',
      },
      {
        id: 'fil-mudari',
        name_en: 'Fi\'l Mudaari\' (Present/Future)',
        name_ar: 'فعل مضارع',
        search_ar: ['فعل مضارع'],
        description: 'A verb indicating an ongoing or future action',
      },
      {
        id: 'fil-amr',
        name_en: 'Fi\'l Amr (Imperative)',
        name_ar: 'فعل أمر',
        search_ar: ['فعل أمر'],
        description: 'A command verb',
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
        description: 'Subject of a nominal sentence (marfoo\')',
      },
      {
        id: 'khabar',
        name_en: 'Khabar (Predicate)',
        name_ar: 'خبر',
        search_ar: ['خبر'],
        description: 'Predicate that completes the mubtada',
      },
      {
        id: 'faa-il',
        name_en: 'Faa\'il (Doer)',
        name_ar: 'فاعل',
        search_ar: ['فاعل'],
        description: 'The doer of the action in a verbal sentence',
      },
      {
        id: 'naib-faa-il',
        name_en: 'Naa\'ib al-Faa\'il (Passive Subject)',
        name_ar: 'نائب فاعل',
        search_ar: ['نائب فاعل', 'نائب الفاعل'],
        description: 'Subject of a passive verb',
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
        description: 'Direct object of a transitive verb (mansub)',
      },
      {
        id: 'maf-ool-mutlaq',
        name_en: 'Maf\'ool Mutlaq (Absolute Object)',
        name_ar: 'مفعول مطلق',
        search_ar: ['مفعول مطلق'],
        description: 'Verbal noun from the same root, for emphasis',
      },
      {
        id: 'haal',
        name_en: 'Haal (State/Condition)',
        name_ar: 'حال',
        search_ar: ['حال'],
        description: 'Describes the state of the subject/object during the action',
      },
      {
        id: 'tamyeez',
        name_en: 'Tamyeez (Specification)',
        name_ar: 'تمييز',
        search_ar: ['تمييز'],
        description: 'A noun that clarifies what is being referred to',
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
        name_en: 'Na\'t (Adjective)',
        name_ar: 'نعت',
        search_ar: ['نعت'],
        description: 'Adjective that follows and describes a noun',
      },
      {
        id: 'atf',
        name_en: '\'Atf (Conjunction)',
        name_ar: 'عطف',
        search_ar: ['عطف', 'حرف عطف'],
        description: 'Joining elements with و، ف، ثم، أو, etc.',
      },
      {
        id: 'badal',
        name_en: 'Badal (Apposition)',
        name_ar: 'بدل',
        search_ar: ['بدل'],
        description: 'A word that replaces or clarifies the one before it',
      },
      {
        id: 'tawkeed',
        name_en: 'Tawkeed (Emphasis)',
        name_ar: 'توكيد',
        search_ar: ['توكيد'],
        description: 'Word used for emphasis of what precedes it',
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
        description: 'Causes the following noun to be in genitive case',
      },
      {
        id: 'harf-nafi',
        name_en: 'Negation (Harf Nafiy)',
        name_ar: 'حرف نفي',
        search_ar: ['حرف نفي'],
        description: 'Negation particles: لا، ما، لم، لن, etc.',
      },
      {
        id: 'harf-shart',
        name_en: 'Conditional (Shart)',
        name_ar: 'شرط',
        search_ar: ['حرف شرط', 'أداة شرط', 'شرط'],
        description: 'Conditional particles: إن، من، ما، إذا، لو',
      },
    ],
  },
  {
    id: 'noun-types',
    name_en: 'Noun Types & Pronouns',
    name_ar: 'أنواع الأسماء',
    topics: [
      {
        id: 'dameer',
        name_en: 'Pronoun (Dameer)',
        name_ar: 'ضمير',
        search_ar: ['ضمير'],
        description: 'Personal pronouns — attached or detached',
      },
      {
        id: 'ism-mawsool',
        name_en: 'Relative Pronoun (Ism Mawsool)',
        name_ar: 'اسم موصول',
        search_ar: ['اسم موصول'],
        description: 'الذي، التي، الذين — who, which, that',
      },
      {
        id: 'ism-isharah',
        name_en: 'Demonstrative (Ism Isharah)',
        name_ar: 'اسم إشارة',
        search_ar: ['اسم إشارة'],
        description: 'هذا، هذه، ذلك — this, that, these, those',
      },
      {
        id: 'mudaf-idafa',
        name_en: 'Idafa (Possessive)',
        name_ar: 'مضاف ومضاف إليه',
        search_ar: ['مضاف إليه'],
        description: 'Possessive construction — one noun possesses another',
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
        name_en: 'Nidaa (Vocative)',
        name_ar: 'نداء',
        search_ar: ['نداء', 'منادى'],
        description: 'Calling/addressing — يا أيها الذين آمنوا',
      },
      {
        id: 'istithnaa',
        name_en: 'Istithna (Exception)',
        name_ar: 'استثناء',
        search_ar: ['استثناء', 'مستثنى'],
        description: 'Exception constructions using إلا، غير، سوى',
      },
      {
        id: 'istifham',
        name_en: 'Istifhaam (Question)',
        name_ar: 'استفهام',
        search_ar: ['حرف استفهام', 'استفهام'],
        description: 'Question words: هل، أ، من، ما، أين، كيف',
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
