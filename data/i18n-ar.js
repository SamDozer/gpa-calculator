/* Egyptian Arabic dictionary for js/i18n.js.
   Key = the English text with every number / course or term code replaced by "#" (numbers are put back in order, so keep the
   same number of "#" in the same order). Technical tokens (CGPA, GPA, RMSE, Nmax ...) are deliberately left in Latin letters. */
window.I18N_AR_SUFFIX = [
  [' · full transcript', ' · كشف كامل'], [' · quick mode', ' · بداية سريعة'],
  [' · Below pass', ' · أقل من النجاح'], [' · Excellent', ' · ممتاز'], [' · Very Good', ' · جيد جداً'], [' · Good', ' · جيد'], [' · Pass', ' · مقبول'],
  [' · new', ' · جديدة'], [' · retake', ' · إعادة']
];
window.I18N_AR = {
  /* header, menu, navigation */
  'Data ▾': 'البيانات ▾', 'Download my data (.json)': 'نزّل بياناتي (.json)', 'Load a saved file…': 'افتح ملف محفوظ…', 'Export courses (.csv)': 'صدّر المواد (.csv)',
  'Print / save as PDF': 'اطبع / احفظ PDF', 'Change starting point…': 'غيّر نقطة البداية…', 'Erase everything and start over': 'امسح كل حاجة وابدأ من الأول',
  'CGPA now': 'المعدل التراكمي دلوقتي', '≈ #% · from your baseline': '≈ #% · من أساسك', '≈ #% · baseline + # new results': '≈ #% · الأساس + # نتيجة جديدة',
  'Projected graduating': 'المعدل المتوقع عند التخرج', '+# at #% new / #% retake': '+# عند #% في الجديد / #% في الإعادة', '−# at #% new / #% retake': '−# عند #% في الجديد / #% في الإعادة',
  'add a plan to project': 'ضيف خطة عشان نتوقع', 'Credits': 'الساعات', '# to go · # planned': '# باقية · # مخططة', 'German grade (est.)': 'الدرجة الألمانية (تقدير)',
  'projected #': 'المتوقع #', 'Modified Bavarian, N_min=#': 'Bavarian المعدلة، N_min=#',
  'Overview': 'نظرة عامة', 'Courses': 'المواد', 'Plan': 'الخطة', 'Projection': 'التوقعات', 'Analytics': 'التحليلات', 'Settings': 'الإعدادات',
  'Undo (Ctrl+Z)': 'تراجع (Ctrl+Z)', 'Undo': 'تراجع', 'Redo (Ctrl+Y)': 'إعادة (Ctrl+Y)', 'Redo': 'إعادة', 'Light / dark': 'فاتح / غامق', 'Toggle theme': 'غيّر المظهر', 'Sections': 'الأقسام',
  'Free and open source (MIT) ·': 'مجاني ومفتوح المصدر (MIT) ·', 'How the model works': 'إزاي النموذج بيشتغل', 'Report an issue': 'بلّغ عن مشكلة',
  'Estimates only: not an official document. The repeat-course rule is a model fitted to published CGPAs, not a university regulation; use Settings → Calibration to check it against your own official numbers. Your data never leaves this browser.':
    'تقديرات بس: مش مستند رسمي. قاعدة إعادة المواد نموذج مستنتج من معدلات رسمية مش لائحة جامعة؛ استخدم الإعدادات ← المعايرة عشان تقارنها بأرقامك الرسمية. بياناتك عمرها ما بتسيب المتصفح ده.',

  /* welcome */
  'Credit-hour GPA · #–# scale · Faculty of Science': 'معدل الساعات المعتمدة · مقياس #–# · كلية العلوم',
  'Know your CGPA.': 'اعرف معدلك التراكمي.', 'Plan the next one.': 'وخطط للي بعده.',
  'See where you stand, what next semester does to your CGPA, and exactly what you need to score to hit a target. It understands repeat-course penalties, so retakes are modelled the way your registrar counts them.':
    'شوف إنت واقف فين، والترم الجاي هيعمل إيه في معدلك، وبالظبط محتاج تجيب كام عشان توصل لهدفك. الأداة بتفهم عقوبة إعادة المواد، فالإعادة بتتحسب بنفس طريقة شؤون الطلبة.',
  'Quick start': 'بداية سريعة',
  'You know your current CGPA and finished hours, and don’t want to type old courses. Start planning this or next semester in under a minute.':
    'عارف معدلك الحالي وعدد ساعاتك ومش عايز تكتب المواد القديمة؟ ابدأ تخطط للترم ده أو الجاي في أقل من دقيقة.',
  'I know my CGPA & hours →': 'أنا عارف معدلي وساعاتي ←', 'Full transcript': 'كشف الدرجات الكامل',
  'Enter every course attempt to get the exact CGPA, term-by-term charts, repeat penalties, and a degree map. Paste from Excel works.':
    'اكتب كل محاولة في كل مادة وهتاخد المعدل بالظبط، ورسومات لكل ترم، وعقوبة الإعادة، وخريطة الدرجة. وينفع تنسخ من Excel.',
  'I’ll enter my courses →': 'هكتب موادي ←', 'Try the demo': 'جرّب النسخة التجريبية',
  'Explore every screen with a made-up student first. One click on “Erase everything” in the Data menu clears it and brings you back here.':
    'اتفرج على كل الشاشات مع طالب وهمي الأول. ضغطة على «امسح كل حاجة» من قايمة البيانات بتمسحه وترجعك هنا.',
  'Show me around →': 'وريني الأداة ←', 'Private by design.': 'الخصوصية أساسية.',
  'Everything runs in your browser and is saved only on this device. There is no account and no server. Use': 'كل حاجة بتشتغل في المتصفح بتاعك وبتتحفظ على جهازك بس. مفيش حساب ولا سيرفر. استخدم',
  'Data → Download my data': 'البيانات ← نزّل بياناتي', 'to back up or move devices.': 'عشان تاخد نسخة احتياطية أو تنقل لجهاز تاني.',
  'Load a saved file': 'افتح ملف محفوظ', 'Open source on GitHub': 'مفتوح المصدر على GitHub',
  'Your starting point': 'نقطة البداية بتاعتك', 'Copy these from your student portal or transcript. You can change them any time in Settings.': 'انسخ الأرقام دي من بوابة الطالب أو كشف الدرجات. تقدر تغيرها في أي وقت من الإعدادات.',
  'Current CGPA': 'المعدل التراكمي الحالي', 'Hours counted in CGPA': 'الساعات المحسوبة في المعدل', 'Hours passed (earned)': 'الساعات اللي نجحت فيها', 'Hours to graduate': 'ساعات التخرج',
  'Results as of (exam period)': 'النتايج لحد (فترة الامتحانات)', 'Course list for autofill (optional)': 'قايمة المواد للإكمال التلقائي (اختياري)',
  'Blank: I will type my own courses': 'فاضي: هكتب موادي بنفسي',
  'Cairo University, Faculty of Science: Biotechnology / Molecular Biochemistry (# cr)': 'جامعة القاهرة، كلية العلوم: التكنولوجيا الحيوية / الكيمياء الحيوية الجزيئية (# ساعة)',
  'Start planning': 'ابدأ التخطيط', 'Back': 'رجوع', 'e.g. #': 'مثلاً #',
  'The credit hours your university used to compute that CGPA. If you never failed or missed a course this equals your passed hours. If you did, it is higher, because failed attempts still count in the denominator.':
    'عدد الساعات اللي الجامعة حسبت بيها المعدل ده. لو عمرك ما سقطت أو غبت في مادة يبقى هو نفس ساعات نجاحك. لو سقطت يبقى أكبر، لأن محاولات الرسوب لسه محسوبة في المقام.',
  'same as left if no fails': 'زي اللي جنبه لو مفيش رسوب',
  'The exam period of your latest results: Jan = Term # exams (Dec/Jan), May = Term # exams (May/Jun), Sep = summer exams (Aug/Sep). Planning starts from the one after it.':
    'فترة امتحانات آخر نتايجك: Jan = امتحانات الترم # (ديسمبر/يناير)، May = امتحانات الترم # (مايو/يونيو)، Sep = امتحانات الصيف (أغسطس/سبتمبر). التخطيط بيبدأ من اللي بعدها.',
  'Enter your CGPA as a number between # and #.': 'اكتب معدلك التراكمي كرقم بين # و#.', 'Enter the hours counted in your CGPA.': 'اكتب الساعات المحسوبة في معدلك.', 'Enter your passed hours.': 'اكتب ساعات نجاحك.',
  'Enter the total hours needed to graduate.': 'اكتب إجمالي ساعات التخرج.', 'Passed hours cannot exceed the hours needed to graduate.': 'ساعات النجاح ما ينفعش تزيد عن ساعات التخرج.',
  'Passed hours cannot exceed the hours counted in your CGPA (failed courses make the second number larger, not smaller).': 'ساعات النجاح ما ينفعش تزيد عن الساعات المحسوبة في المعدل (الرسوب بيكبّر الرقم التاني مش بيصغره).',
  'Term should look like # or Fall # (or leave it empty).': 'الترم لازم يبقى شكله # أو Fall # (أو سيبه فاضي).',
  'Which degree?': 'أنهي شعبة؟',
  'A template pre-fills the course list, credits and the #-hour total so the app can work out what is left. Pick “Blank” to type your own. Your grades are never part of a template.':
    'القالب بيملّى قايمة المواد والساعات وإجمالي الـ # ساعة عشان الأداة تحسب الباقي. اختار «فاضي» لو هتكتب بنفسك. درجاتك عمرها ما بتبقى جزء من القالب.',
  'Programme': 'الشعبة', 'Continue to my courses': 'كمّل لموادي',
  'Starting point saved. Add the courses you’re taking next.': 'نقطة البداية اتحفظت. ضيف المواد اللي هتاخدها.',
  'Demo student loaded. “Erase everything” in the Data menu returns here.': 'اتحمّل الطالب التجريبي. «امسح كل حاجة» في قايمة البيانات بترجعك هنا.',

  /* semester calculator + plan */
  'Semester calculator: what will my GPA be?': 'حاسبة الترم: معدلي هيبقى كام؟',
  'Pick the term, list the courses you take in it and the score you expect in each. You get that semester’s GPA, your new CGPA, and what each course does to it. Whatever you enter here is saved into your plan below, so nothing is entered twice.':
    'اختار الترم، واكتب المواد اللي هتاخدها فيه والدرجة اللي متوقعها في كل مادة. هتطلعلك معدل الترم، ومعدلك التراكمي الجديد، وكل مادة بتأثر قد إيه. أي حاجة تكتبها هنا بتتحفظ في خطتك تحت، فمش هتكتب حاجة مرتين.',
  'Term (named by its exam period)': 'الترم (بفترة امتحاناته)', '# · Summer': '# · الصيف', '# · Term #': '# · الترم #',
  'Term # #/#: first-term exams (Dec/Jan)': 'الترم # #/#: امتحانات الترم الأول (ديسمبر/يناير)',
  'Term # #/#: second-term exams (late May/Jun); the term starts in Feb': 'الترم # #/#: امتحانات الترم التاني (آخر مايو/يونيو)، والترم بيبدأ في فبراير',
  'Summer #/#: summer exams (Aug/Sep)': 'الصيف #/#: امتحانات الصيف (أغسطس/سبتمبر)',
  'Term #: first-term exams (Dec/Jan)': 'الترم #: امتحانات الترم الأول (ديسمبر/يناير)', 'Term #: second-term exams (late May/Jun); the term starts in Feb': 'الترم #: امتحانات الترم التاني (آخر مايو/يونيو)، والترم بيبدأ في فبراير',
  'Summer: summer exams (Aug/Sep)': 'الصيف: امتحانات الصيف (أغسطس/سبتمبر)',
  'No courses in # yet': 'مفيش مواد في # لسه', 'Add the courses you take in this term below. Each one you add moves your CGPA.': 'ضيف المواد اللي هتاخدها في الترم ده تحت. كل مادة بتضيفها بتحرّك معدلك.',
  'Course': 'المادة', 'cr': 'ساعات', 'score %': 'الدرجة %', 'grade': 'التقدير', 'GPA pts': 'نقاط', 'effect on CGPA': 'التأثير على المعدل', 'CGPA change from adding only this course': 'تغيّر المعدل لو ضفت المادة دي بس',
  'Add a course': 'ضيف مادة', 'Type': 'النوع', 'new course': 'مادة جديدة', 'retake': 'إعادة', 'Times failed before': 'مرات الرسوب قبل كده', 'Expected %': 'الدرجة المتوقعة %', '+ Add': '+ ضيف',
  'code, e.g. #': 'الكود، مثلاً #', 'default': 'افتراضي', 'Set every course in this term to': 'خلّي كل مواد الترم ده', 'Set all scores for this term': 'حدد كل درجات الترم ده', '(later)': '(بعدين)',
  'Counts only courses planned for this term. “Effect on CGPA” is what that course would do on its own. Retakes include their earlier fails as a repeat penalty automatically.':
    'بيحسب بس المواد المخططة للترم ده. «التأثير على المعدل» هو اللي المادة دي هتعمله لوحدها. الإعادة بتشمل رسوبها القديم كعقوبة تلقائي.',
  'Counts only courses planned for this term. “Effect on CGPA” is what that course would do on its own. Retakes include their earlier fails as a repeat penalty automatically. # planned course has no term yet and is not counted here.':
    'بيحسب بس المواد المخططة للترم ده. «التأثير على المعدل» هو اللي المادة دي هتعمله لوحدها. الإعادة بتشمل رسوبها القديم كعقوبة تلقائي. # مادة مخططة لسه ملهاش ترم وما اتحسبتش هنا.',
  'Counts only courses planned for this term. “Effect on CGPA” is what that course would do on its own. Retakes include their earlier fails as a repeat penalty automatically. # planned courses have no term yet and are not counted here.':
    'بيحسب بس المواد المخططة للترم ده. «التأثير على المعدل» هو اللي المادة دي هتعمله لوحدها. الإعادة بتشمل رسوبها القديم كعقوبة تلقائي. # مواد مخططة لسه ملهاش ترم وما اتحسبتش هنا.',
  'Counts only courses planned for this term plus the # you planned in earlier terms. “Effect on CGPA” is what that course would do on its own. Retakes include their earlier fails as a repeat penalty automatically.':
    'بيحسب المواد المخططة للترم ده بالإضافة لـ # خططتها في ترمات قبله. «التأثير على المعدل» هو اللي المادة دي هتعمله لوحدها. الإعادة بتشمل رسوبها القديم كعقوبة تلقائي.',
  'Add a course to your plan': 'ضيف مادة لخطتك',
  'Planning this semester or the next? Add each course with the credits and the score you expect. For a course you failed or missed before, mark it as a retake so the repeat penalty is counted.':
    'بتخطط للترم ده أو الجاي؟ ضيف كل مادة بساعاتها والدرجة اللي متوقعها. لو المادة سقطت فيها أو غبت قبل كده، علّم عليها «إعادة» عشان العقوبة تتحسب.',
  'Course code': 'كود المادة', 'Name (optional)': 'الاسم (اختياري)', 'Term': 'الترم', '+ Add to plan': '+ ضيف للخطة', 'Times absent before': 'مرات الغياب قبل كده',
  'Both count toward the repeat penalty. Courses with logged attempts fill this in automatically.': 'الاتنين بيتحسبوا في عقوبة الإعادة. المواد اللي ليها محاولات مسجلة بيتملى ده لوحده.',
  'Semester board': 'لوحة الترمات',
  'Drag courses between terms to see how the order changes your CGPA. Each column shows that term’s own GPA and your cumulative CGPA after it. On a phone, use the Term column in the table below.':
    'اسحب المواد بين الترمات وشوف الترتيب بيغير معدلك إزاي. كل عمود بيوريك معدل الترم لوحده ومعدلك التراكمي بعده. على الموبايل استخدم عمود «الترم» في الجدول تحت.',
  'Start term': 'ترم البداية', 'Max credits / term': 'أقصى ساعات / ترم', '# turns the warning off': '# بيقفل التحذير', 'Auto-distribute unassigned': 'وزّع غير المحددة تلقائي', 'Clear terms': 'امسح الترمات', '+ term column': '+ عمود ترم',
  'Unassigned': 'من غير ترم', '# cr': '# ساعة', 'not scheduled yet': 'لسه ما اتحددش', 'Summer · #/#': 'الصيف · #/#', 'Term # · #/#': 'الترم # · #/#', 'drop courses here': 'سيب المواد هنا',
  'term GPA # · CGPA # (+#)': 'معدل الترم # · المعدل # (+#)', 'term GPA # · CGPA # (−#)': 'معدل الترم # · المعدل # (−#)', 'term GPA': 'معدل الترم', 'CGPA after': 'المعدل بعده',
  'Your plan': 'خطتك',
  'Untick a course to leave it out of the projection (it still blocks graduation until passed). Leave “expected %” empty to use the default new / retake scores from the Projection tab.':
    'شيل العلامة من مادة عشان تطلعها من التوقع (لسه بتمنع التخرج لحد ما تنجح فيها). سيب «الدرجة المتوقعة» فاضية عشان تاخد الدرجات الافتراضية للجديد / الإعادة من تاب التوقعات.',
  'on': 'مفعّلة', 'history': 'السجل', 'term': 'الترم', 'expected %': 'الدرجة المتوقعة %', 'Your plan is empty': 'خطتك فاضية', 'Add the courses you are taking or planning above.': 'ضيف المواد اللي هتاخدها أو بتخطط لها فوق.',
  'TOTAL': 'الإجمالي', '# cr new · # cr retake': '# ساعة جديدة · # ساعة إعادة', 'new': 'جديدة', 'failed': 'رسوب', 'absent': 'غياب', 'from your log': 'من سجلك', '# attempt': '# محاولة', 'Re-derive from degree template': 'أعد الاستخراج من قالب الدرجة',
  'Reconciled:': 'متطابق:', '# earned + # planned = # cr': '# منجزة + # مخططة = # ساعة', ', exactly the degree total.': '، بالظبط إجمالي الدرجة.',
  '# remaining credits are not planned yet.': '# ساعة باقية لسه ما اتخططتش.', 'The projection assumes you average': 'التوقع بيفترض إنك بتجيب في المتوسط', 'on them.': 'فيها.', 'Ignore them instead': 'تجاهلها بدل كده',
  'CGPA after each term': 'المعدل التراكمي بعد كل ترم', 'Nothing scheduled': 'مفيش حاجة متحددة', 'Drag courses into terms (or press Auto-distribute) to see the path.': 'اسحب المواد جوه الترمات (أو دوس «وزّع تلقائي») عشان تشوف المسار.',
  'No scheduled courses yet.': 'مفيش مواد متحددة لسه.',
  'Where your effort pays': 'فين مجهودك بيفرق',
  'Each bar is the CGPA you gain by scoring the target below instead of a bare pass. The last column is what one extra failure of that course costs your graduating CGPA.':
    'كل عمود هو المعدل اللي بتكسبه لو جبت الدرجة المستهدفة تحت بدل النجاح بالعافية. العمود الأخير هو رسوب واحد زيادة في المادة دي بيكلف معدل التخرج قد إيه.',
  'Target score for the comparison': 'الدرجة المستهدفة للمقارنة', 'If a course fails once, it is retaken at': 'لو مادة سقطت مرة، بتتعاد بدرجة', 'the score I planned': 'الدرجة اللي خططتها', '#% (bare pass)': '#% (نجاح بالعافية)',
  'type': 'النوع', 'gain # → #': 'المكسب # ← #', 'cost if failed once': 'تكلفة الرسوب مرة', 'Add courses to see their leverage.': 'ضيف مواد عشان تشوف تأثيرها.',
  'Biggest payoff: # (+# CGPA at #% instead of a bare pass). Costliest failure: # (−#). Cheapest failure: # (~#): its repeat penalty is already booked, though it still blocks graduation.':
    'أكبر مكسب: # (+# معدل عند #% بدل النجاح بالعافية). أغلى رسوب: # (−#). أرخص رسوب: # (~#): عقوبة إعادتها محسوبة بالفعل، لكن لسه بتمنع التخرج.',
  'Target score': 'الدرجة المستهدفة', 'Summer · #': 'الصيف · #',
  'Added #': 'اتضافت #', 'Added # as a retake.': 'اتضافت # كإعادة.', 'Added # to #': 'اتضافت # إلى #', 'Added # to # (retake: repeat penalty applied).': 'اتضافت # إلى # (إعادة: اتطبقت عقوبة الإعادة).',
  '# was already in your plan: moved into # with your score.': '# كانت في خطتك بالفعل: اتنقلت إلى # بدرجتك.', '# was already in your plan: moved into #.': '# كانت في خطتك بالفعل: اتنقلت إلى #.',
  '# is already in the plan. Edit its score or term instead.': '# موجودة في الخطة بالفعل. عدّل درجتها أو ترمها بدل كده.', 'Enter a course code.': 'اكتب كود المادة.',
  'Expected score must be between # and #.': 'الدرجة المتوقعة لازم تبقى بين # و#.', 'Distributed # course(s) from #': 'اتوزعت # مادة من #', 'Terms cleared': 'الترمات اتمسحت', 'Nothing unassigned': 'مفيش حاجة من غير ترم',
  'Remove #': 'شيل #', 'Include #': 'ضمّن #', 'New or retake': 'جديدة أو إعادة', 'Expected score': 'الدرجة المتوقعة', 'Credits': 'الساعات', 'Times failed': 'مرات الرسوب', 'Times absent': 'مرات الغياب', 'Term': 'الترم',
  '# credits planned': '# ساعة مخططة', '# cr · #%': '# ساعة · #%',
  'Semester GPA': 'معدل الترم', '≈ #% · # cr this term': '≈ #% · # ساعة الترم ده', 'New CGPA after #': 'المعدل الجديد بعد #', '+# from # now': '+# من # دلوقتي', '−# from # now': '−# من # دلوقتي',
  '+# from # (with earlier planned terms)': '+# من # (مع الترمات المخططة قبلها)', '−# from # (with earlier planned terms)': '−# من # (مع الترمات المخططة قبلها)', 'was #': 'كان #',
  'Your # target is already met by just passing these.': 'هدفك # متحقق بالفعل لو نجحت في دول بس.',
  'To have': 'عشان يبقى عندك', 'by the end of this term you need about': 'بنهاية الترم ده محتاج حوالي', 'on average in these courses.': 'كمتوسط في المواد دي.',

  /* overview */
  'Planning a semester?': 'بتخطط لترم؟', 'Enter the courses you take and the scores you expect: see the semester GPA, your new CGPA, and what each course does to it.': 'اكتب المواد اللي هتاخدها والدرجات المتوقعة: شوف معدل الترم ومعدلك التراكمي الجديد وكل مادة بتعمل إيه.',
  'Open the semester calculator →': 'افتح حاسبة الترم ←', 'Get set up': 'جهّز الأداة', 'hide': 'إخفاء', '✓ DONE': '✓ تم', 'Starting point': 'نقطة البداية', 'CGPA # · # h': 'المعدل # · # ساعة', 'STEP #': 'خطوة #',
  'Add old courses (optional)': 'ضيف مواد قديمة (اختياري)', 'for charts & repeat penalties': 'للرسومات وعقوبة الإعادة', 'Plan your courses': 'خطط موادك', 'this or next semester': 'الترم ده أو الجاي',
  'Check the projection': 'شوف التوقع', 'set expected scores': 'حدد الدرجات المتوقعة', 'scores set': 'الدرجات محددة', 'Add your courses': 'ضيف موادك', '# entered': '# مكتوبة', '# planned': '# مخططة', '# attempts': '# محاولة',
  'At a glance': 'ملخص سريع', 'CGPA': 'المعدل التراكمي', 'Credits earned': 'الساعات المنجزة', 'passed degree credits': 'ساعات الدرجة اللي نجحت فيها', '# university-requirement + # subject': '# متطلبات جامعة + # تخصص',
  'Credits remaining': 'الساعات الباقية', '# new + # retake planned · # not planned': '# جديدة + # إعادة مخططة · # لسه ما اتخططتش', '# new + # retake planned': '# جديدة + # إعادة مخططة', 'nothing planned yet': 'لسه مفيش حاجة مخططة',
  'Effective credits': 'الساعات الفعلية', 'denominator · # quality points': 'المقام · # نقطة جودة', 'Planned credits': 'الساعات المخططة', '# courses': '# مواد', 'Projected CGPA': 'المعدل المتوقع',
  'at #% new / #% retake': 'عند #% جديد / #% إعادة', 'Ceiling': 'الحد الأقصى', '#% on everything left': '#% في كل الباقي', 'Quality points': 'نقاط الجودة', 'CGPA × hours counted': 'المعدل × الساعات المحسوبة',
  'Best term': 'أحسن ترم', 'Worst term': 'أضعف ترم', 'Pass rate': 'نسبة النجاح', '# attempts · #% fail/absent': '# محاولة · #% رسوب/غياب', 'Attempts logged': 'المحاولات المسجلة', 'across # terms': 'على # ترمات',
  'CGPA timeline': 'تطور المعدل التراكمي', 'Computed CGPA after each term (green), your official numbers if you entered them (blue), and the plan projected forward (purple). Dashed line is your target.':
    'المعدل المحسوب بعد كل ترم (أخضر)، وأرقامك الرسمية لو كتبتها (أزرق)، والخطة المتوقعة (بنفسجي). الخط المتقطع هو هدفك.',
  'Term GPA trend': 'اتجاه معدل الترم', 'Credit-weighted GPA of each term on its own, counting fails and absences. A trend indicator, not an official figure.': 'معدل كل ترم لوحده موزون بالساعات، بيحسب الرسوب والغياب. مؤشر اتجاه مش رقم رسمي.',
  'No terms yet': 'مفيش ترمات لسه', 'Add past courses on the Courses tab to see how each term went.': 'ضيف مواد قديمة من تاب المواد عشان تشوف كل ترم عدّى إزاي.',
  'Nothing to chart yet': 'مفيش حاجة نرسمها لسه', 'Set your starting point or add courses.': 'حدد نقطة البداية أو ضيف مواد.',
  'Credit progress': 'تقدم الساعات', 'Earned, planned (new / retake) and not yet planned.': 'المنجز والمخطط (جديد / إعادة) واللي لسه ما اتخططش.', 'Projection comparison': 'مقارنة التوقعات',
  'Graduating CGPA if you average these scores on new courses / retakes. Updates with your plan.': 'معدل التخرج لو جبت المتوسطات دي في الجديد / الإعادة. بيتحدث مع خطتك.',
  'No plan yet': 'مفيش خطة لسه', 'Add courses on the Plan tab to compare scenarios.': 'ضيف مواد من تاب الخطة عشان تقارن السيناريوهات.',
  'What to do next': 'تعمل إيه دلوقتي', 'Target graduating CGPA': 'المعدل المستهدف عند التخرج', 'Target CGPA': 'المعدل المستهدف', 'Add a plan to get tailored suggestions.': 'ضيف خطة عشان تاخد اقتراحات مخصصة.',
  'Nothing planned yet.': 'لسه مفيش حاجة مخططة.', '# credits are still needed for graduation. Add this term’s courses in the Plan tab to see where your CGPA lands.': 'لسه محتاج # ساعة للتخرج. ضيف مواد الترم ده في تاب الخطة عشان تشوف معدلك هيوصل لفين.',
  'The projection assumes you average #% on them (switch this off in Projection).': 'التوقع بيفترض إنك بتجيب #% في المتوسط فيها (تقدر تقفل ده من التوقعات).',
  'Upward trend.': 'اتجاه صاعد.', 'Your last three term GPAs (# → # → #) are rising. Worth foregrounding in applications.': 'معدلات آخر تلات ترمات (# ← # ← #) بتطلع. تستاهل تبرزها في التقديمات.',
  'Target # needs about #%': 'الهدف # محتاج حوالي #%', 'on average across the planned courses. Ceiling from here: #.': 'كمتوسط على المواد المخططة. الحد الأقصى من هنا: #.',
  'Biggest lever: #': 'أكبر رافعة: #', '(# cr). Scoring #% instead of a bare pass adds about +# to your final CGPA.': '(# ساعة). لو جبت #% بدل النجاح بالعافية بتضيف حوالي +# لمعدلك النهائي.',
  'Costliest failure: #': 'أغلى رسوب: #', '(−# final CGPA if you fail once before passing).': '(−# من المعدل النهائي لو سقطت مرة قبل ما تنجح).',
  'Target # is already secured': 'الهدف # مضمون بالفعل', 'if you simply pass everything planned.': 'لو نجحت في كل المخطط وبس.', 'Target # is out of reach.': 'الهدف # بعيد المنال.', 'Even #% on everything left tops out at #. Aim at or below that.': 'حتى #% في كل الباقي أقصاه #. استهدف الحد ده أو أقل.',

  /* courses tab */
  'Optional: past courses': 'اختياري: المواد القديمة', 'You started from a CGPA and hours, so older courses are': 'إنت بدأت من معدل وساعات، فالمواد القديمة', 'already inside your baseline': 'متحسوبة بالفعل جوه أساسك',
  '. Anything you add here is counted': '. أي حاجة تضيفها هنا بتتحسب', 'on top of it': 'فوقه', ': use it for results that came out': ': استخدمها لنتايج طلعت', 'after': 'بعد',
  'your baseline, or if you want charts of recent terms. Want every old course tracked exactly? Switch to full-transcript mode in': 'أساسك، أو لو عايز رسومات للترمات الأخيرة. عايز كل مادة قديمة تتتبع بالظبط؟ حوّل لوضع الكشف الكامل من',
  'Add a result': 'ضيف نتيجة', 'Type a course you sat. Leave the score empty (or tick Absent) for a missed exam. Repeating a course applies the repeat penalty automatically.': 'اكتب مادة امتحنتها. سيب الدرجة فاضية (أو علّم «غايب») لو فاتك الامتحان. إعادة المادة بتطبّق عقوبة الإعادة لوحدها.',
  'Term (exam period)': 'الترم (فترة الامتحانات)', 'Score %': 'الدرجة %', 'Absent (غ)': 'غايب (غ)', 'Add result': 'ضيف النتيجة', 'This is a retake of a course already counted in my baseline CGPA': 'دي إعادة لمادة متحسوبة بالفعل في معدلي الأساسي',
  'Last attempt was': 'آخر محاولة كانت', 'a fail': 'رسوب', 'an absence': 'غياب',
  'Jan = Term # exams (Dec/Jan), May = Term # exams (late May/Jun), Sep = Summer exams (Aug/Sep). Dec, Jun and Aug are accepted too.': 'Jan = امتحانات الترم # (ديسمبر/يناير)، May = امتحانات الترم # (آخر مايو/يونيو)، Sep = امتحانات الصيف (أغسطس/سبتمبر). Dec وJun وAug مقبولين برضه.',
  '▸ Paste many courses (Excel, Google Sheets, CSV or JSON)': '▸ الصق مواد كتير (Excel أو Google Sheets أو CSV أو JSON)', 'One course per line:': 'مادة في كل سطر:',
  '. Copy straight from a spreadsheet or use a header row (course, credits, semester, score). Leave score empty, or write غ / AB, for an absence.': '. انسخ على طول من الجدول أو استخدم صف عناوين (course, credits, semester, score). سيب الدرجة فاضية أو اكتب غ / AB للغياب.',
  'Add these': 'ضيف دول', 'Replace all my courses': 'استبدل كل موادي', 'From file…': 'من ملف…', 'Copy as CSV': 'انسخ كـ CSV', 'Paste courses': 'الصق مواد',
  'Your attempts': 'محاولاتك', 'No courses yet': 'مفيش مواد لسه', 'Add a result above, or paste a whole list.': 'ضيف نتيجة فوق أو الصق قايمة كاملة.', 'Filter by code or name…': 'فلتر بالكود أو الاسم…', 'Filter attempts': 'فلتر المحاولات',
  '# of # attempts': '# من # محاولة', '· term GPA # · CGPA after #': '· معدل الترم # · المعدل بعده #', '+ add here': '+ ضيف هنا', 'Score': 'الدرجة', 'retake #': 'إعادة #',
  'Degree map': 'خريطة الدرجة', 'Green = passed, amber = still outstanding. Click a row to start entering a result for that course.': 'أخضر = ناجح، أصفر = لسه باقي. دوس على صف عشان تبدأ تكتب نتيجة المادة دي.',
  'Lvl': 'المستوى', 'Status': 'الحالة', 'Best %': 'أحسن %', 'Attempts': 'المحاولات', 'passed': 'ناجح', 'not passed': 'لسه', 'not taken': 'ما اتاخدتش', 'Level #': 'المستوى #', '#/# cr · #%': '#/# ساعة · #%', '# of # cr passed': '# من # ساعة ناجح',
  'Term and course code are required.': 'الترم وكود المادة مطلوبين.', 'Term not understood. Use e.g. #, Fall # or مايو#.': 'الترم مش مفهوم. استخدم مثلاً #، Fall # أو مايو#.', 'Term not understood. Use e.g. #': 'الترم مش مفهوم. استخدم مثلاً #',
  'Credits must be a number (# for a #-hour requirement).': 'الساعات لازم تبقى رقم (# لمتطلب بـ # ساعة).', 'Score must be between # and #.': 'الدرجة لازم تبقى بين # و#.',
  'Added # (# cr, #). New course.': 'اتضافت # (# ساعة، #). مادة جديدة.', 'Added # (# cr, #). Retake: repeat penalty applied.': 'اتضافت # (# ساعة، #). إعادة: اتطبقت عقوبة الإعادة.',
  '# already has a result in #. Edit it in the table below instead.': '# ليها نتيجة بالفعل في #. عدّلها من الجدول تحت بدل كده.',
  'Line #: missing course code': 'سطر #: كود المادة ناقص', 'Line #: score “#” must be # to #': 'سطر #: الدرجة “#” لازم تبقى من # لـ #', 'Line #: credits missing for #': 'سطر #: الساعات ناقصة لـ #', 'Nothing to import.': 'مفيش حاجة تتستورد.',
  'Replace all courses?': 'تستبدل كل المواد؟', 'This overwrites your # saved attempts with # imported ones. You can undo with Ctrl+Z.': 'ده هيكتب فوق الـ # محاولة المحفوظة بـ # مستوردة. تقدر تتراجع بـ Ctrl+Z.',
  'Cancel': 'إلغاء', 'Replace': 'استبدل', 'Imported # attempts.': 'اتستوردت # محاولة.', 'Replaced with # attempts': 'اتستبدلت بـ # محاولة', 'Added # attempts': 'اتضافت # محاولة',
  'Added # attempts (# skipped)': 'اتضافت # محاولة (# اتخطت)', 'Replaced with # attempts (# skipped)': 'اتستبدلت بـ # محاولة (# اتخطت)', 'Removed # (#)': 'اتشالت # (#)', 'Remove': 'شيل',
  'Add courses': 'ضيف مواد', 'Copied': 'اتنسخ', 'CSV copied': 'CSV اتنسخ', 'Copy blocked by the browser': 'المتصفح منع النسخ',
  'File loaded. Check it, then press Add.': 'الملف اتحمّل. راجعه وبعدين دوس ضيف.',
  '# courses in your degree list (# cr). A template only supplies course names and credits.': '# مادة في قايمة درجتك (# ساعة). القالب بيدّي أسماء المواد وساعاتها بس.',

  /* projection */
  'Graduation predictor': 'توقع التخرج',
  'Set the scores you expect. Passing a course adds its credits to the denominator once; a course you attempted before stays in the denominator one extra time (one extra registration), which is why new courses move your CGPA far more than retakes. Per-course scores set on the Plan tab override these defaults.':
    'حدد الدرجات اللي متوقعها. نجاح المادة بيضيف ساعاتها للمقام مرة واحدة؛ والمادة اللي حاولتها قبل كده بتفضل في المقام مرة زيادة (تسجيل زيادة واحد)، وعشان كده المواد الجديدة بتحرك معدلك أكتر بكتير من الإعادة. الدرجات اللي بتحطها لكل مادة في تاب الخطة بتغلب الافتراضيات دي.',
  'Conservative': 'متحفظ', 'Realistic': 'واقعي', 'Optimistic': 'متفائل', 'Perfect': 'مثالي', 'Custom': 'مخصص', 'NEW courses average (# cr)': 'متوسط المواد الجديدة (# ساعة)', 'RETAKES average (# cr)': 'متوسط الإعادة (# ساعة)',
  'Average score on new courses': 'متوسط الدرجة في المواد الجديدة', 'Average score on retakes': 'متوسط الدرجة في الإعادة',
  'Assume the # credits I haven’t planned yet score the new-course average': 'افترض إن الـ # ساعة اللي لسه ما خططتهاش بتجيب متوسط المواد الجديدة',
  'projected graduating CGPA (≈ #%) · from # now': 'المعدل المتوقع عند التخرج (≈ #%) · من # دلوقتي', 'add courses on the Plan tab to project': 'ضيف مواد من تاب الخطة عشان نتوقع',
  'meets your # target': 'بيحقق هدفك #', '# short of your # target': 'ناقص # عن هدفك #',
  'final = (N + Q) ÷ D': 'النهائي = (N + Q) ÷ D', 'final': 'النهائي', 'Q = Σ credits × GPA over the planned courses (max #). D': 'Q = Σ الساعات × النقاط للمواد المخططة (الأقصى #). D',
  'is fixed once you pass everything, so each extra quality point is worth': 'ثابت أول ما تنجح في كل حاجة، فكل نقطة جودة زيادة بتساوي', 'CGPA; one GPA point (# score points) on a #-credit course adds': 'من المعدل؛ ونقطة GPA واحدة (# درجات) على مادة # ساعات بتضيف',
  'Target calculator': 'حاسبة الهدف', 'To reach': 'علشان توصل لـ', 'you need about': 'محتاج تجيب حوالي', 'on average across all': 'كمتوسط على كل', '# planned credits': '# ساعة مخططة', '(needs Q = # of max #).': '(محتاج Q = # من أقصى #).',
  'Plan some courses first and I will tell you what average they need.': 'خطط شوية مواد الأول وأنا أقولك محتاجين متوسط كام.',
  '…or the CGPA after this term': '…أو المعدل بعد الترم ده', '(assign terms on the Plan tab)': '(حدد الترمات من تاب الخطة)', 'Put courses into terms to ask “what do I need this semester?”.': 'حط المواد في ترمات عشان تسأل «محتاج أجيب كام الترم ده؟».',
  'At your expected scores, CGPA after': 'بدرجاتك المتوقعة، المعدل بعد', '. To have # by then you would need about': '. عشان يبقى عندك # وقتها محتاج حوالي', 'across everything up to that term.': 'على كل حاجة لحد الترم ده.',
  '# is already secured': '# مضمون بالفعل', 'if you pass everything planned (bare-pass floor: #).': 'لو نجحت في كل المخطط (أدنى نجاح: #).', '. That target is already met by just passing.': '. الهدف ده متحقق بالنجاح بس.',
  '. Reaching # by then is not possible (ceiling #).': '. الوصول لـ # وقتها مش ممكن (الحد الأقصى #).', '# is out of reach': '# بعيد المنال', ': even #% everywhere tops out at': ': حتى #% في كل حاجة أقصاها', '. The past fixes a floor under the denominator.': '. الماضي بيثبّت حد أدنى للمقام.',
  'German grade': 'الدرجة الألمانية', 'An estimate for MSc applications. Nmin is the contested input: some universities use the lowest passing GPA, others the good-standing line. Try both. Uni-assist or the programme’s own table is the authority.':
    'تقدير لطلبات الماجستير. Nmin هو المدخل المختلف عليه: جامعات بتستخدم أقل معدل نجاح، وجامعات تانية بتستخدم خط الوضع الجيد. جرب الاتنين. uni-assist أو جدول البرنامج نفسه هو المرجع.',
  'N max (best)': 'N max (الأحسن)', 'N min (lowest pass)': 'N min (أقل نجاح)', 'Source': 'المصدر', 'German': 'الألماني', 'Class': 'التقدير', 'Current CGPA': 'المعدل التراكمي الحالي',
  'Projected (your plan)': 'المتوقع (خطتك)', 'Best case (#% on everything)': 'أحسن حالة (#% في كل حاجة)', 'As printed on a graduation statement': 'زي ما بيتطبع في بيان التخرج',
  'The class follows the GPA rounded to # decimal (a record of # was classed Excellent). Bands: Excellent #–#, Very Good #–#, Good #–#, Pass #–#. The printed number is usually exact (one record printed # / #%), though a near-threshold value was printed rounded up (# as # / #%). “With Honour” has extra criteria that are not modelled.':
    'التقدير بيمشي على المعدل مقرب لـ # رقم عشري (سجل معدله # اتصنف ممتاز). الشرائح: ممتاز #–#، جيد جداً #–#، جيد #–#، مقبول #–#. الرقم المطبوع غالباً بالظبط (سجل طبع # / #%)، بس قيمة قريبة من الحد اتطبعت مقربة لفوق (# كـ # / #%). «مع مرتبة الشرف» ليها شروط زيادة مش متحسبة.',
  'Classification': 'التصنيف', 'Excellent · #–#%': 'ممتاز · #–#%', 'Very Good · #–#%': 'جيد جداً · #–#%', 'Good · #–#%': 'جيد · #–#%', 'Pass · #–#%': 'مقبول · #–#%',
  'Scenarios': 'السيناريوهات', 'What your plan gives under different score levels (new courses / retakes).': 'خطتك هتدّي كام لو جبت مستويات درجات مختلفة (جديد / إعادة).', 'Scenario': 'السيناريو', 'Final CGPA': 'المعدل النهائي', 'vs target': 'مقارنة بالهدف',
  'Everything at #%': 'كل حاجة #%', 'Everything at #% (ceiling)': 'كل حاجة #% (الحد الأقصى)', 'New #% / retake #%': 'جديد #% / إعادة #%', 'Plan some courses to compare scenarios.': 'خطط شوية مواد عشان تقارن السيناريوهات.',
  'How likely is your target?': 'احتمال إنك توصل لهدفك', '# simulated outcomes': '# نتيجة محاكاة', 'A simulation: every planned course is drawn around your expected score, with a chance of failing once and being retaken. It shows a range instead of one number.':
    'محاكاة: كل مادة مخططة بتتسحب حوالين درجتك المتوقعة، مع احتمال إنك تسقط مرة وتعيد. بتوريك مدى بدل رقم واحد.',
  'Score spread (± points)': 'تفاوت الدرجة (± نقطة)', 'Fail chance, new %': 'احتمال الرسوب، جديد %', 'Fail chance, retake %': 'احتمال الرسوب، إعادة %', 'Re-roll': 'أعد المحاكاة', 'Likely range (#%)': 'المدى المتوقع (#%)',
  'median # · middle half # – #': 'الوسيط # · النص الأوسط # – #', 'P(final ≥ #)': 'احتمال (النهائي ≥ #)', 'No plan to simulate': 'مفيش خطة نحاكيها', 'Add courses on the Plan tab.': 'ضيف مواد من تاب الخطة.',
  'Model uncertainty': 'عدم يقين النموذج', 'The repeat-course rule is fitted to official CGPAs, so the projection has some model error. This re-fits the rule to your own numbers and shows the spread of every parameter set that reproduces them all within the university’s rounding.':
    'قاعدة إعادة المواد مستنتجة من معدلات رسمية، فالتوقع فيه هامش خطأ. ده بيعيد ظبط القاعدة على أرقامك وبيوريك مدى كل مجموعة قيم بتطابقهم كلهم في حدود تقريب الجامعة.',
  'Compute range from my official CGPAs': 'احسب المدى من معدلاتي الرسمية', 'Modified Bavarian formula: # + # × (Nmax − Nd) / (Nmax − Nmin)': 'معادلة Bavarian المعدلة: # + # × (Nmax − Nd) / (Nmax − Nmin)',
  'Average score on new courses': 'متوسط الدرجة في المواد الجديدة',

  /* analytics */
  'No course history yet': 'مفيش سجل مواد لسه', 'Analytics are built from your logged attempts. Add past courses to unlock them. Your CGPA and planning work without them.': 'التحليلات بتتبني من محاولاتك المسجلة. ضيف مواد قديمة عشان تفتحها. المعدل والتخطيط شغالين من غيرها.',
  'Grade distribution': 'توزيع التقديرات', 'Every attempt by grade band.': 'كل محاولة حسب الشريحة.', 'Subject averages': 'متوسطات المجالات', 'Average GPA of passed courses (latest attempt) by area.': 'متوسط نقاط المواد الناجحة (آخر محاولة) حسب المجال.',
  'Grade mix by year': 'توزيع التقديرات بالسنة', 'How the mix of grades, fails and absences shifted year to year.': 'إزاي التقديرات والرسوب والغياب اتغيروا من سنة للتانية.',
  'Where the repeat penalty sits': 'فين عقوبة الإعادة', 'Extra credits each course adds to the denominator because of earlier failed or missed attempts. Big bars are expensive history; they are sunk cost, so passing them cleanly matters more than perfecting them.':
    'الساعات الزيادة اللي كل مادة بتضيفها للمقام بسبب محاولات رسوب أو غياب قبل كده. الأعمدة الكبيرة هي تاريخ غالي؛ هو خلاص مدفوع، فنجاحك فيها بشكل نضيف أهم من إنك تكمّلها لأعلى درجة.',
  'Credits over time': 'الساعات عبر الوقت', 'Credits registered vs credits actually passed, cumulative. A widening gap is lost semesters.': 'الساعات المسجلة قصاد الساعات اللي نجحت فيها فعلاً، تراكمي. الفجوة اللي بتكبر معناها ترمات ضايعة.',
  'Absent': 'غايب', 'Registered': 'المسجل', 'Passed': 'الناجح', 'extra credits in denominator': 'ساعات زيادة في المقام',

  /* settings */
  'How the app knows your record. You can switch at any time; nothing is lost.': 'الأداة بتعرف سجلك إزاي. تقدر تبدل في أي وقت ومفيش حاجة بتضيع.', 'Quick: CGPA & hours': 'سريع: معدل وساعات', 'Term names in a year': 'أسماء الترمات في السنة',
  'Baseline (your record before anything below)': 'الأساس (سجلك قبل أي حاجة تحت)', 'Hours passed': 'ساعات النجاح', 'As of term': 'لحد ترم',
  'Courses you failed earlier are still in the denominator, so hours counted can be higher than hours passed. For a retake of one of those, mark it as a retake in the Plan tab so its repeat penalty is applied.':
    'المواد اللي سقطت فيها قبل كده لسه في المقام، فالساعات المحسوبة ممكن تبقى أكتر من ساعات النجاح. لو بتعيد واحدة منهم، علّم عليها «إعادة» في تاب الخطة عشان عقوبتها تتطبق.',
  'Term calendar': 'تقويم الترمات', 'Every term in this app is named by its': 'كل ترم في الأداة دي اسمه بـ', 'exam period': 'فترة امتحاناته', ', because that is when results (and your CGPA) change. Typing the month your exams fall in is enough:': '، لأن ده وقت ما النتايج (ومعدلك) بتتغير. يكفي تكتب شهر امتحاناتك:',
  'Write': 'اكتب', 'Meaning': 'المعنى', 'Starts': 'بيبدأ', 'or Dec': 'أو Dec', 'Term # exams (December / January)': 'امتحانات الترم # (ديسمبر / يناير)', 'autumn (Sep/Oct)': 'الخريف (سبتمبر/أكتوبر)', 'or Jun': 'أو Jun',
  'Term # exams (late May / early June)': 'امتحانات الترم # (آخر مايو / أول يونيو)', 'February': 'فبراير', 'or Aug': 'أو Aug', 'Summer exams (August / September)': 'امتحانات الصيف (أغسطس / سبتمبر)', 'after Term #': 'بعد الترم #',
  'So': 'يعني', 'and': 'و', 'are the same term (Term # of #/#),': 'نفس الترم (الترم # من #/#)،', 'are Term #, and': 'هم الترم #، و',
  'are the summer exams of that same academic year. Other universities can rename the terms in “Term names in a year” above (for example Fall, Spring).': 'هم امتحانات الصيف لنفس السنة الدراسية. الجامعات التانية تقدر تغير أسماء الترمات من «أسماء الترمات في السنة» فوق (مثلاً Fall, Spring).',
  'Grading rules': 'قواعد التقدير', 'Defaults match the Cairo University Faculty of Science credit-hour system. Every number is editable if your faculty differs.': 'الافتراضيات على نظام الساعات المعتمدة بكلية العلوم جامعة القاهرة. كل رقم تقدر تعدله لو كليتك مختلفة.',
  'Pass mark': 'درجة النجاح', 'University-req. pass': 'نجاح متطلبات الجامعة', 'Score offset': 'إزاحة الدرجة', 'Score divisor': 'قاسم الدرجة', 'Minimum points for a pass': 'أقل نقاط للنجاح', 'Max GPA': 'أقصى GPA',
  'A university requirement passed at #-#% prints as # points, not #-#': 'متطلب جامعة ناجح فيه بـ #-#% بيتطبع # نقطة، مش #-#',
  'exclude non-degree courses from CGPA': 'استبعد المواد خارج الدرجة من المعدل', 'Repeat-course rule': 'قاعدة إعادة المواد', 'One extra registration per repeated course (matches official records)': 'تسجيل زيادة واحد لكل مادة معادة (مطابق للسجلات الرسمية)',
  'Weighted: earlier fails keep ~full weight, later ones decay (older fit)': 'موزون: الرسوب الأول بوزن شبه كامل والباقي بيقل (الظبط القديم)', 'Replace (textbook): only the latest attempt counts': 'استبدال (النظري): آخر محاولة بس هي اللي بتتحسب',
  'Capped: retake grade limited to a maximum': 'بحد أقصى: درجة الإعادة محدودة بسقف', 'Failed-exam weight': 'وزن الرسوب', 'Absence weight': 'وزن الغياب', 'Decay per repeat': 'التناقص لكل إعادة', 'Retake grade cap': 'سقف درجة الإعادة',
  'Reset to Cairo defaults': 'رجّع افتراضيات القاهرة', 'Grading rules reset': 'قواعد التقدير اترجعت',
  'GPA = score < pass ? # : max(passFloor, min((score − offset) ÷ divisor, max)). Under the default rule a course you attempted before adds': 'GPA = الدرجة < النجاح ؟ # : max(passFloor, min((الدرجة − الإزاحة) ÷ القاسم, الأقصى)). في القاعدة الافتراضية المادة اللي حاولتها قبل كده بتضيف',
  'one extra registration': 'تسجيل زيادة واحد', '(its credits once more) to the denominator, however many earlier attempts it had; only the latest attempt earns points. Non-degree courses (below) never count.': '(ساعاتها مرة تانية) للمقام، مهما كان عدد محاولاتها القديمة؛ وآخر محاولة بس هي اللي بتاخد نقاط. المواد خارج الدرجة (تحت) عمرها ما بتتحسب.',
  '▸ Score ↔ GPA table': '▸ جدول الدرجة ↔ GPA', 'Letter': 'الحرف',
  'Calibration against your official CGPAs': 'المعايرة على معدلاتك الرسمية', 'The repeat-course rule is not published, so it is a model. Type the CGPA your university showed after each term; the table shows how closely the rules reproduce them. Official values are rounded to # decimals, so ±# is the noise floor.':
    'قاعدة إعادة المواد مش منشورة، فهي نموذج. اكتب المعدل اللي الجامعة وريتهولك بعد كل ترم؛ الجدول بيوريك القاعدة بتطابقهم قد إيه. القيم الرسمية مقربة لـ # أرقام عشرية، فـ ±# هو حد الضوضاء.',
  'Official CGPA': 'المعدل الرسمي', '+ Add official CGPA': '+ ضيف معدل رسمي', 'Official': 'الرسمي', 'Model': 'النموذج', 'Error': 'الخطأ',
  'No official CGPAs yet. Adding even three or four tells you how well the repeat rule fits your record.': 'لسه مفيش معدلات رسمية. حتى تلاتة أو أربعة بيقولوك القاعدة مطابقة لسجلك قد إيه.', 'Auto-fit the rule to my numbers': 'اظبط القاعدة تلقائي على أرقامي',
  '· # of # inside rounding (±#).': '· # من # جوه التقريب (±#).', 'Best fit: failed weight': 'أحسن ظبط: وزن الرسوب', ', absence weight': '، وزن الغياب', ', decay': '، التناقص',
  '(RMSE #). # parameter sets reproduce every snapshot within rounding. Leave-one-out error:': '(RMSE #). # مجموعة قيم بتطابق كل المعدلات الرسمية في حدود التقريب. خطأ الاستبعاد واحد-واحد:',
  '(each snapshot predicted from the others, absence weight fixed at #).': '(كل معدل بيتوقع من الباقي، ووزن الغياب ثابت #).', 'Apply these values': 'طبّق القيم دي', 'Max error': 'أقصى خطأ', 'Inside rounding': 'جوه التقريب', 'Projected final': 'النهائي المتوقع',
  'Replace (textbook)': 'استبدال (النظري)', 'Count one extra registration': 'تسجيل زيادة واحد', 'Count one, but no # floor on passes': 'تسجيل زيادة واحد، من غير حد أدنى # للنجاح', 'Weighted (older fit: # / # / #)': 'موزون (الظبط القديم: # / # / #)',
  'Your current settings': 'إعداداتك الحالية', 'Best fit to your snapshots': 'أحسن ظبط على معدلاتك', 'Fitted values applied': 'القيم المظبوطة اتطبقت',
  'Add at least # official CGPAs in Settings → Calibration first.': 'ضيف على الأقل # معدلات رسمية في الإعدادات ← المعايرة الأول.', 'Add at least # official CGPAs for a meaningful fit.': 'ضيف على الأقل # معدلات رسمية عشان الظبط يبقى مفيد.', 'Enter the official CGPA (#–#)': 'اكتب المعدل الرسمي (#–#)',
  'Calibration compares your logged courses only, so use full-transcript mode for it.': 'المعايرة بتقارن موادك المسجلة بس، فاستخدم وضع الكشف الكامل ليها.',
  'Degree & course list': 'الدرجة وقايمة المواد', 'No degree list yet: you can type course codes freely, but level progress and “remaining courses” need a list. A template only supplies course names and credits.': 'مفيش قايمة مواد لسه: تقدر تكتب أكواد المواد براحتك، بس تقدم المستويات و«المواد الباقية» محتاجين قايمة. القالب بيدّي أسماء المواد وساعاتها بس.',
  'Template': 'القالب', 'Use this course list': 'استخدم قايمة المواد دي', '▸ Paste my own course list': '▸ الصق قايمة موادي', '. Put': '. حط', 'at the end for university requirements (lower pass mark).': 'في الآخر لمتطلبات الجامعة (درجة نجاح أقل).',
  'Use pasted list': 'استخدم القايمة الملزوقة', 'Copy current list': 'انسخ القايمة الحالية', 'Non-degree courses (passed but outside the total; comma separated)': 'مواد خارج الدرجة (ناجح فيها بس برا الإجمالي؛ مفصولة بفاصلة)',
  'Use it': 'استخدمها', 'No valid lines. Format: level, code, name, credits': 'مفيش سطور صالحة. الشكل: level, code, name, credits', 'Replace the course list?': 'تستبدل قايمة المواد؟',
  'Your data': 'بياناتك', 'Saved only in this browser (local storage). Nothing is sent anywhere. Download a backup to move to another device or keep a private copy; you can load it again from the welcome screen or the Data menu.': 'متحفوظة في المتصفح ده بس (تخزين محلي). مفيش حاجة بتتبعت لأي مكان. نزّل نسخة احتياطية عشان تنقل لجهاز تاني أو تحتفظ بنسخة خاصة؛ وتقدر ترجّعها من شاشة الترحيب أو قايمة البيانات.',
  'Print / PDF': 'اطبع / PDF', 'Erase everything': 'امسح كل حاجة', 'Erase everything?': 'تمسح كل حاجة؟', 'Removes your saved data from this browser.': 'بيمسح بياناتك المحفوظة من المتصفح ده.', 'Erase': 'امسح',
  'Comma separated, e.g. Fall, Spring, Summer': 'مفصولة بفاصلة، مثلاً Fall, Spring, Summer', 'Quick mode: enter your baseline below.': 'الوضع السريع: اكتب أساسك تحت.', 'Full-transcript mode: your baseline is switched off and every logged course counts.': 'وضع الكشف الكامل: الأساس اتقفل وكل مادة مسجلة بتتحسب.',
  'Course list set: # courses': 'قايمة المواد اتحددت: # مادة', 'Saved gpa-profile.json': 'اتحفظ gpa-profile.json', 'Profile loaded': 'البروفايل اتحمّل',
  'Charts could not load (offline?). Everything else still works.': 'الرسومات ما اتحملتش (من غير نت؟). باقي الأداة شغال عادي.',

  /* chart labels */
  'Computed CGPA': 'المعدل المحسوب', 'Plan (projected)': 'الخطة (متوقعة)', 'Target': 'الهدف', 'Term GPA': 'معدل الترم', 'Earned': 'المنجز', 'Planned · new': 'مخطط · جديد', 'Planned · retake': 'مخطط · إعادة', 'Not planned': 'لسه ما اتخططش',
  'Now': 'دلوقتي', 'Conserv. #/#': 'متحفظ #/#', 'Realistic #/#': 'واقعي #/#', 'Optimistic #/#': 'متفائل #/#', 'Your plan': 'خطتك', 'Graduating CGPA': 'معدل التخرج', 'Unscheduled': 'من غير جدول', 'Runs': 'مرات',
  'Demo student loaded.': 'اتحمّل الطالب التجريبي.'
};
