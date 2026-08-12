/**
 * Translations for the public landing page.
 *
 * Scoped deliberately: `/` and `/ar` are the localized surfaces, while the
 * signed-in workspace stays English. Localizing the product properly means
 * translating every status, empty state and validation message *and* deciding
 * how numerals, currency and dates render per locale — a separate piece of
 * work, not something to half-do behind a language switch.
 *
 * Both dictionaries are checked against one type, so a missing Arabic string
 * is a build error rather than an English word appearing mid-paragraph.
 */

export const LOCALES = ['en', 'ar'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** `/` serves English; Arabic gets its own path so it can be linked and indexed. */
export const LOCALE_PATH: Record<Locale, string> = {
  en: '/',
  ar: '/ar',
}

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
}

/** Short label for the switcher, where there is no room for the full name. */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN',
  ar: 'ع',
}

export const isRtl = (locale: Locale) => locale === 'ar'

type Pillar = { title: string; body: string }
type Feature = { title: string; body: string }

export type LandingDictionary = {
  meta: { title: string; description: string }
  nav: {
    sections: { product: string; clients: string; features: string }
    sectionsLabel: string
    signIn: string
    start: string
    /**
     * The same call to action, short enough to sit next to a menu button on a
     * 320px phone. `start` does not fit there — the button cannot shrink, so a
     * long label pushes the whole header into horizontal scroll.
     */
    startShort: string
    openWorkspace: string
    languageLabel: string
    menuLabel: string
  }
  hero: {
    eyebrow: string
    heading: string
    subheading: string
    demo: string
    demoHint: string
  }
  pillars: { heading: string; deliver: Pillar; bill: Pillar; collaborate: Pillar }
  portal: { heading: string; body: string; points: [string, string, string] }
  money: { heading: string; body: string; extra: string }
  features: {
    heading: string
    attention: Feature
    health: Feature
    approvals: Feature
    search: Feature
    roles: Feature
    money: Feature
  }
  cta: { heading: string; body: string }
  footer: { tagline: string }
  /** Labels inside the product previews — the screenshots are live markup. */
  preview: {
    dashboardFrame: string
    portalFrame: string
    projectFrame: string
    kpi: {
      activeProjects: [string, string]
      outstanding: [string, string]
      thisMonth: [string, string]
      overdue: [string, string]
    }
    attention: {
      title: string
      count: string
      invoices: [string, string]
      risk: [string, string]
      approval: [string, string]
      tasks: [string, string]
    }
    projects: {
      title: string
      website: { title: string; client: string; meta: string; status: string }
      brand: { title: string; client: string; meta: string; status: string }
    }
    portal: {
      project: string
      progress: string
      updates: [string, string]
      awaiting: string
      awaitingMeta: string
      approve: string
      requestChanges: string
      paid: string
      pending: string
    }
    finance: {
      heading: string
      budget: string
      invoiced: string
      paid: string
      outstanding: string
      budgetHint: string
      invoicedHint: string
      paidHint: string
      outstandingHint: string
      burn: string
      work: string
    }
  }
}

const en: LandingDictionary = {
  meta: {
    title: 'Parallax — The operating system for your agency',
    description:
      'Projects, clients, invoices, and revenue — connected in one workspace built for modern agencies.',
  },
  nav: {
    sections: {
      product: 'Product',
      clients: 'Client portal',
      features: 'Features',
    },
    sectionsLabel: 'Sections',
    signIn: 'Sign in',
    start: 'Start your workspace',
    startShort: 'Start free',
    openWorkspace: 'Open workspace',
    languageLabel: 'Language',
    menuLabel: 'Menu',
  },
  hero: {
    eyebrow: 'The operating system for your agency',
    heading: 'Run your agency from one workspace.',
    subheading:
      'Projects, clients, invoices, and revenue — connected in one place.',
    demo: 'Explore demo',
    demoHint:
      'The demo signs you straight in as a developer, designer or client.',
  },
  pillars: {
    heading: 'Everything between brief and payment.',
    deliver: {
      title: 'Deliver',
      body: 'Plan projects, run the board, and keep every task moving with an owner and a date.',
    },
    bill: {
      title: 'Bill',
      body: 'Track budgets, raise invoices against the work, and watch what has actually been collected.',
    },
    collaborate: {
      title: 'Collaborate',
      body: 'Give clients a clear view of progress and a straight answer on what needs their sign-off.',
    },
  },
  portal: {
    heading: 'Clients see what matters.',
    body: 'The portal shows progress, deliverables, approvals and invoices — and none of your internal tasks, notes, workload or margins.',
    points: [
      'Progress on every project they are paying for',
      'Deliverables waiting on their approval, with a place to say what needs changing',
      'Invoices and payment status, nothing else from your books',
    ],
  },
  money: {
    heading: 'Projects and money, finally connected.',
    body: 'Every invoice belongs to a project, so budget, billing and delivery sit on one page. When billing runs ahead of the work, Parallax says so — with the two numbers that prove it.',
    extra:
      'No exports, no second spreadsheet, no reconciling the board against the books at month end.',
  },
  features: {
    heading: 'Built for the way agencies actually work.',
    attention: {
      title: 'An attention centre, not a feed',
      body: 'Overdue invoices, late tasks, projects slipping and approvals waiting — one list, every item a link to the thing itself.',
    },
    health: {
      title: 'Health you can explain',
      body: 'Projects are flagged by arithmetic, never a guess: budget 92% used at 76% complete says exactly why.',
    },
    approvals: {
      title: 'Approvals as real objects',
      body: 'Send a deliverable, get an approval or written feedback back. Both sides read the same record.',
    },
    search: {
      title: 'Everything a keystroke away',
      body: 'Press ⌘K and search projects, clients, tasks and invoices at once, scoped to what you are allowed to see.',
    },
    roles: {
      title: 'Roles enforced at the data layer',
      body: 'Clients reach their own projects and nothing else. Permission checks live next to the queries, not in the buttons.',
    },
    money: {
      title: 'Money attached to work',
      body: 'Every invoice hangs off a project, so revenue, budget and delivery are never three separate stories.',
    },
  },
  cta: {
    heading: 'Less admin. More making.',
    body: 'Put delivery, clients and billing in the same workspace and stop reassembling the picture by hand.',
  },
  footer: { tagline: 'The operating system for your agency.' },
  preview: {
    dashboardFrame: 'Parallax · Dashboard',
    portalFrame: 'Parallax · Client portal',
    projectFrame: 'Parallax · Nova Website',
    kpi: {
      activeProjects: ['Active projects', '4 in flight'],
      outstanding: ['Outstanding', 'Not yet collected'],
      thisMonth: ['This month', 'Collected since the 1st'],
      overdue: ['Overdue', '3 invoices past due'],
    },
    attention: {
      title: 'Needs your attention',
      count: '4 items to act on.',
      invoices: ['3 invoices overdue', '$2,100 unpaid · oldest Aug 2'],
      risk: ['Helios Replatform is at risk', 'Budget 92% used at 76% complete'],
      approval: [
        '1 client approval outstanding',
        'Nova Technologies · Homepage v3',
      ],
      tasks: ['2 tasks due today', 'Across the agency'],
    },
    projects: {
      title: 'Projects in flight',
      website: {
        title: 'Website Redesign',
        client: 'Nova Technologies',
        meta: '18 of 21 tasks',
        status: 'On track',
      },
      brand: {
        title: 'Brand System',
        client: 'Helios Retail',
        meta: '11 of 18 tasks',
        status: 'At risk',
      },
    },
    portal: {
      project: 'Website Redesign',
      progress: '14 of 18 deliverables complete',
      updates: ['Homepage approved', 'Mobile version delivered'],
      awaiting: 'Awaiting your approval',
      awaitingMeta: 'About page · sent Aug 10',
      approve: 'Approve',
      requestChanges: 'Request changes',
      paid: 'Paid',
      pending: 'Pending',
    },
    finance: {
      heading: 'Financial overview',
      budget: 'Budget',
      invoiced: 'Invoiced',
      paid: 'Paid',
      outstanding: 'Outstanding',
      budgetHint: '',
      invoicedHint: '75% of budget',
      paidHint: '75% collected',
      outstandingHint: 'Nothing overdue',
      burn: 'Budget invoiced',
      work: 'Work complete',
    },
  },
}

const ar: LandingDictionary = {
  meta: {
    title: 'Parallax — نظام التشغيل الخاص بوكالتك',
    description:
      'المشاريع والعملاء والفواتير والإيرادات — مترابطة في مساحة عمل واحدة مصمّمة للوكالات الحديثة.',
  },
  nav: {
    sections: {
      product: 'المنتج',
      clients: 'بوابة العملاء',
      features: 'المزايا',
    },
    sectionsLabel: 'الأقسام',
    signIn: 'تسجيل الدخول',
    start: 'ابدأ مساحة عملك',
    startShort: 'ابدأ مجانًا',
    openWorkspace: 'افتح مساحة العمل',
    languageLabel: 'اللغة',
    menuLabel: 'القائمة',
  },
  hero: {
    eyebrow: 'نظام التشغيل الخاص بوكالتك',
    heading: 'أدِر وكالتك من مساحة عمل واحدة.',
    subheading: 'المشاريع والعملاء والفواتير والإيرادات — مترابطة في مكان واحد.',
    demo: 'جرّب النسخة التجريبية',
    demoHint: 'تدخلك النسخة التجريبية مباشرةً كمطوّر أو مصمّم أو عميل.',
  },
  pillars: {
    heading: 'كل ما بين الموجز والسداد.',
    deliver: {
      title: 'التنفيذ',
      body: 'خطّط للمشاريع، وأدِر لوحة المهام، وأبقِ كل مهمة تتحرك بمسؤول وموعد محدّد.',
    },
    bill: {
      title: 'الفوترة',
      body: 'تابع الميزانيات، وأصدر الفواتير مقابل العمل المنجز، وراقب ما تم تحصيله فعليًا.',
    },
    collaborate: {
      title: 'التعاون',
      body: 'امنح عملاءك رؤية واضحة للتقدّم وإجابة مباشرة عمّا ينتظر موافقتهم.',
    },
  },
  portal: {
    heading: 'عملاؤك يرون ما يهمّهم.',
    body: 'تعرض البوابة التقدّم والتسليمات والموافقات والفواتير — دون أي من مهامك الداخلية أو ملاحظاتك أو أعباء فريقك أو هوامش أرباحك.',
    points: [
      'تقدّم كل مشروع يدفعون مقابله',
      'التسليمات التي تنتظر موافقتهم، مع مكان لتوضيح ما يحتاج إلى تعديل',
      'الفواتير وحالة السداد، ولا شيء آخر من دفاترك',
    ],
  },
  money: {
    heading: 'المشاريع والمال، مترابطان أخيرًا.',
    body: 'كل فاتورة تتبع مشروعًا، لتجتمع الميزانية والفوترة والتنفيذ في صفحة واحدة. وحين تسبق الفوترة سير العمل، ينبّهك Parallax إلى ذلك — بالرقمين اللذين يثبتان الأمر.',
    extra:
      'بلا تصدير، وبلا جدول بيانات ثانٍ، وبلا مطابقة لوحة المهام مع الدفاتر في نهاية الشهر.',
  },
  features: {
    heading: 'مصمّم بالطريقة التي تعمل بها الوكالات فعلًا.',
    attention: {
      title: 'مركز انتباه، لا خلاصة أخبار',
      body: 'فواتير متأخرة، ومهام فات موعدها، ومشاريع تتعثّر، وموافقات تنتظر — قائمة واحدة، كل عنصر فيها رابط إلى الشيء نفسه.',
    },
    health: {
      title: 'حالة يمكنك تفسيرها',
      body: 'تُصنَّف المشاريع بالحساب لا بالتخمين: «استُهلك 92% من الميزانية عند إنجاز 76%» يقول السبب بالضبط.',
    },
    approvals: {
      title: 'الموافقات ككيانات حقيقية',
      body: 'أرسل تسليمًا، واستقبل موافقة أو ملاحظات مكتوبة. ويقرأ الطرفان السجل نفسه.',
    },
    search: {
      title: 'كل شيء على بُعد ضغطة مفتاح',
      body: 'اضغط ⌘K وابحث في المشاريع والعملاء والمهام والفواتير دفعة واحدة، ضمن ما يُسمح لك برؤيته.',
    },
    roles: {
      title: 'صلاحيات مطبَّقة في طبقة البيانات',
      body: 'لا يصل العملاء إلا إلى مشاريعهم. وتقع فحوص الصلاحيات بجوار الاستعلامات، لا في الأزرار.',
    },
    money: {
      title: 'مال مرتبط بالعمل',
      body: 'كل فاتورة معلّقة بمشروع، فلا تصبح الإيرادات والميزانية والتنفيذ ثلاث حكايات منفصلة.',
    },
  },
  cta: {
    heading: 'إدارة أقل. إنجاز أكثر.',
    body: 'اجمع التنفيذ والعملاء والفوترة في مساحة عمل واحدة، وتوقّف عن تجميع الصورة يدويًا.',
  },
  footer: { tagline: 'نظام التشغيل الخاص بوكالتك.' },
  preview: {
    dashboardFrame: 'Parallax · لوحة التحكم',
    portalFrame: 'Parallax · بوابة العملاء',
    projectFrame: 'Parallax · موقع Nova',
    kpi: {
      activeProjects: ['المشاريع النشطة', '4 قيد التنفيذ'],
      outstanding: ['المستحقات', 'لم تُحصّل بعد'],
      thisMonth: ['هذا الشهر', 'المحصّل منذ أول الشهر'],
      overdue: ['المتأخرات', '3 فواتير فات موعدها'],
    },
    attention: {
      title: 'يحتاج انتباهك',
      count: '4 عناصر تحتاج إجراءً.',
      invoices: ['3 فواتير متأخرة', '2,100$ غير مسدّدة · أقدمها 2 أغسطس'],
      risk: [
        'مشروع Helios Replatform في خطر',
        'استُهلك 92% من الميزانية عند إنجاز 76%',
      ],
      approval: [
        'موافقة عميل واحدة معلّقة',
        'Nova Technologies · الصفحة الرئيسية v3',
      ],
      tasks: ['مهمتان مستحقتان اليوم', 'على مستوى الوكالة'],
    },
    projects: {
      title: 'مشاريع قيد التنفيذ',
      website: {
        title: 'إعادة تصميم الموقع',
        client: 'Nova Technologies',
        meta: '18 من 21 مهمة',
        status: 'على المسار',
      },
      brand: {
        title: 'نظام الهوية',
        client: 'Helios Retail',
        meta: '11 من 18 مهمة',
        status: 'في خطر',
      },
    },
    portal: {
      project: 'إعادة تصميم الموقع',
      progress: 'اكتمل 14 من 18 تسليمًا',
      updates: ['اعتُمدت الصفحة الرئيسية', 'سُلّمت نسخة الجوال'],
      awaiting: 'بانتظار موافقتك',
      awaitingMeta: 'صفحة «من نحن» · أُرسلت 10 أغسطس',
      approve: 'اعتماد',
      requestChanges: 'طلب تعديلات',
      paid: 'مدفوعة',
      pending: 'قيد الانتظار',
    },
    finance: {
      heading: 'نظرة مالية',
      budget: 'الميزانية',
      invoiced: 'المفوتر',
      paid: 'المحصّل',
      outstanding: 'المستحق',
      budgetHint: '',
      invoicedHint: '75% من الميزانية',
      paidHint: 'حُصّل 75%',
      outstandingHint: 'لا شيء متأخر',
      burn: 'المفوتر من الميزانية',
      work: 'العمل المنجز',
    },
  },
}

export const DICTIONARIES: Record<Locale, LandingDictionary> = { en, ar }

export const getDictionary = (locale: Locale) => DICTIONARIES[locale]
