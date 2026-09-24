import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function clearAllEducationalData(): Promise<{ deletedCount: number }> {
  const collectionsToClear = [
    'subjects',
    'topics',
    'lectures',
    'notes',
    'mcqs',
    'mockTests',
    'mockAttempts',
    'mcqAttempts',
    'userProgress',
  ];
  let totalDeleted = 0;

  for (const colName of collectionsToClear) {
    const snap = await getDocs(collection(db, colName));
    if (snap.empty) continue;

    // Firestore batch has a limit of 500 operations per batch
    const docs = snap.docs;
    const chunkSize = 400;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      totalDeleted += chunk.length;
    }
  }

  return { deletedCount: totalDeleted };
}

export async function seedEducationalData(): Promise<{
  subjectsCount: number;
  topicsCount: number;
  lecturesCount: number;
  notesCount: number;
  mcqsCount: number;
  mockTestsCount: number;
}> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // -------------------------------------------------------------
  // 1. SUBJECTS (विषय)
  // -------------------------------------------------------------
  const subHistoryRef = doc(collection(db, 'subjects'));
  const subPolityRef = doc(collection(db, 'subjects'));
  const subGeographyRef = doc(collection(db, 'subjects'));
  const subScienceRef = doc(collection(db, 'subjects'));
  const subMathRef = doc(collection(db, 'subjects'));
  const subReasoningRef = doc(collection(db, 'subjects'));

  batch.set(subHistoryRef, {
    name: 'Indian History & National Movement',
    hindiName: 'भारतीय इतिहास एवं राष्ट्रीय आंदोलन',
    description: 'Ancient Indus Valley, Vedic Era, Mauryan Empire, Medieval Era, and the Indian Freedom Struggle (1857-1947).',
    icon: 'Landmark',
    color: '#6366f1', // Indigo
    image: 'https://images.unsplash.com/photo-1599578705716-8d3c33a39626?w=600&auto=format&fit=crop&q=80',
    order: 1,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(subPolityRef, {
    name: 'Indian Polity & Constitution',
    hindiName: 'भारतीय राजव्यवस्था एवं संविधान',
    description: 'Preamble, Fundamental Rights (Part III), Directive Principles, Parliament, Supreme Court & Constitutional Amendments.',
    icon: 'Scale',
    color: '#8b5cf6', // Violet
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    order: 2,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(subGeographyRef, {
    name: 'Geography of India & World',
    hindiName: 'भारत एवं विश्व का भूगोल',
    description: 'Physical geography, Indian river drainage systems, monsoon climate, agriculture, minerals & world geographical divisions.',
    icon: 'Globe2',
    color: '#0ea5e9', // Sky blue
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80',
    order: 3,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(subScienceRef, {
    name: 'General Science & Technology',
    hindiName: 'सामान्य विज्ञान एवं प्रौद्योगिकी',
    description: 'Physics laws, Chemistry in daily life, Human physiology & cell biology, ISRO space missions & defense technology.',
    icon: 'Atom',
    color: '#10b981', // Emerald
    image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80',
    order: 4,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(subMathRef, {
    name: 'Quantitative Aptitude & Mathematics',
    hindiName: 'गणित एवं संख्यात्मक अभियोग्यता',
    description: 'Number systems, LCM-HCF, Percentage, Profit & Loss, Simple & Compound Interest, Ratio & Proportion, Time & Work.',
    icon: 'Calculator',
    color: '#f59e0b', // Amber
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    order: 5,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(subReasoningRef, {
    name: 'Reasoning & Mental Ability',
    hindiName: 'तर्कशक्ति एवं मानसिक योग्यता',
    description: 'Verbal & Non-verbal reasoning, Syllogism, Blood relations, Direction sense, Coding-Decoding, Series & Analytical puzzles.',
    icon: 'Brain',
    color: '#ec4899', // Pink
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    order: 6,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  // -------------------------------------------------------------
  // 2. TOPICS (अध्याय / चैप्टर्स)
  // -------------------------------------------------------------
  // History Topics
  const topicHist1Ref = doc(collection(db, 'topics'));
  const topicHist2Ref = doc(collection(db, 'topics'));
  const topicHist3Ref = doc(collection(db, 'topics'));

  batch.set(topicHist1Ref, {
    subjectId: subHistoryRef.id,
    title: 'Indus Valley Civilization & Town Planning',
    hindiTitle: 'सिंधु घाटी सभ्यता एवं नगर नियोजन',
    description: 'Harappa, Mohenjo-daro, Lothal dockyard, drainage system, seals, terracotta art, and decline theories.',
    order: 1,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(topicHist2Ref, {
    subjectId: subHistoryRef.id,
    title: 'Vedic Period, Buddhism & Jainism',
    hindiTitle: 'वैदिक काल, बौद्ध एवं जैन धर्म',
    description: 'Rigvedic & Later Vedic society, Mahajanapadas, Four Noble Truths of Buddha, and Mahavira philosophy.',
    order: 2,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(topicHist3Ref, {
    subjectId: subHistoryRef.id,
    title: 'Indian Freedom Struggle (1857-1947)',
    hindiTitle: 'भारतीय राष्ट्रीय आंदोलन (1857-1947)',
    description: 'Revolt of 1857, INC foundation 1885, Swadeshi Movement, Gandhian Era (Non-Cooperation, Dandi March, Quit India).',
    order: 3,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  // Polity Topics
  const topicPolity1Ref = doc(collection(db, 'topics'));
  const topicPolity2Ref = doc(collection(db, 'topics'));

  batch.set(topicPolity1Ref, {
    subjectId: subPolityRef.id,
    title: 'Preamble & Fundamental Rights (Arts 12-35)',
    hindiTitle: 'प्रस्तावना एवं मौलिक अधिकार (अनुच्छेद 12-35)',
    description: 'Right to Equality, Freedom of Speech (Art 19), Right to Life (Art 21), Article 32 (Constitutional Remedies & Writs).',
    order: 1,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(topicPolity2Ref, {
    subjectId: subPolityRef.id,
    title: 'Union Executive & Parliament',
    hindiTitle: 'संघीय कार्यपालिका एवं संसद',
    description: 'President, Vice-President, Prime Minister, Lok Sabha, Rajya Sabha, Law making process, and Money Bills.',
    order: 2,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  // Geography Topics
  const topicGeo1Ref = doc(collection(db, 'topics'));
  batch.set(topicGeo1Ref, {
    subjectId: subGeographyRef.id,
    title: 'Physiographic Divisions & Rivers of India',
    hindiTitle: 'भारत के भौतिक प्रदेश एवं प्रमुख नदी प्रणालियां',
    description: 'Himalayan range, Northern plains, Peninsular plateau, Indus, Ganga, Brahmaputra, and South Indian peninsular rivers.',
    order: 1,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  // Science Topics
  const topicSci1Ref = doc(collection(db, 'topics'));
  batch.set(topicSci1Ref, {
    subjectId: subScienceRef.id,
    title: 'Human Physiology & Cell Structure',
    hindiTitle: 'मानव शरीर क्रिया विज्ञान एवं कोशिका संरचना',
    description: 'Cell organelles, circulatory system, digestive system, endocrine glands, vitamins & deficiency diseases.',
    order: 1,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  // Math Topics
  const topicMath1Ref = doc(collection(db, 'topics'));
  batch.set(topicMath1Ref, {
    subjectId: subMathRef.id,
    title: 'Percentage, Profit & Loss Masterclass',
    hindiTitle: 'प्रतिशत, लाभ एवं हानि शॉर्ट ट्रिक्स',
    description: 'Fraction to percentage conversion, successive discounts, marked price, CP-SP formulas, and fast calculation techniques.',
    order: 1,
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  // -------------------------------------------------------------
  // 3. VIDEO LECTURES (वीडियो कक्षाएं)
  // -------------------------------------------------------------
  const lec1Ref = doc(collection(db, 'lectures'));
  const lec2Ref = doc(collection(db, 'lectures'));
  const lec3Ref = doc(collection(db, 'lectures'));
  const lec4Ref = doc(collection(db, 'lectures'));

  batch.set(lec1Ref, {
    subjectId: subHistoryRef.id,
    topicId: topicHist1Ref.id,
    title: 'Indus Valley Civilization Complete Foundation (सिंधु घाटी सभ्यता)',
    description: 'Detailed analysis of Harappa, Mohenjo-daro, Lothal, town planning, social structure, and archaeological excavations.',
    videoUrl: 'https://www.youtube.com/watch?v=kC8U63N_f44',
    duration: 3240, // 54 mins
    durationFormatted: '54:00',
    thumbnail: 'https://images.unsplash.com/photo-1599578705716-8d3c33a39626?w=600&auto=format&fit=crop&q=80',
    order: 1,
    published: true,
    viewsCount: 1420,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(lec2Ref, {
    subjectId: subPolityRef.id,
    topicId: topicPolity1Ref.id,
    title: 'Fundamental Rights in Indian Constitution (अनुच्छेद 12 से 35)',
    description: 'In-depth coverage of Articles 14, 19, 21, and Article 32 Writs with landmark Supreme Court judgments.',
    videoUrl: 'https://www.youtube.com/watch?v=0kE20zXyZl4',
    duration: 2700, // 45 mins
    durationFormatted: '45:00',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    order: 1,
    published: true,
    viewsCount: 2310,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(lec3Ref, {
    subjectId: subGeographyRef.id,
    topicId: topicGeo1Ref.id,
    title: 'Himalayan & Peninsular River Systems of India (भारतीय नदियां)',
    description: 'Origin, tributaries, dams, and economic significance of Ganga, Yamuna, Brahmaputra, Godavari, and Krishna rivers.',
    videoUrl: 'https://www.youtube.com/watch?v=7X8II6J-6mU',
    duration: 3120, // 52 mins
    durationFormatted: '52:00',
    thumbnail: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80',
    order: 1,
    published: true,
    viewsCount: 980,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(lec4Ref, {
    subjectId: subMathRef.id,
    topicId: topicMath1Ref.id,
    title: 'Percentage & Profit Loss Short Tricks for Speed Calculations',
    description: 'Zero-formula approach, fraction tables, ratio method, and rapid solving techniques for competitive exams.',
    videoUrl: 'https://www.youtube.com/watch?v=1xN5VqC6iHg',
    duration: 2400, // 40 mins
    durationFormatted: '40:00',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    order: 1,
    published: true,
    viewsCount: 3100,
    createdAt: now,
    updatedAt: now,
  });

  // -------------------------------------------------------------
  // 4. STUDY NOTES & PDFS (अध्ययन नोट्स एवं पीडीएफ)
  // -------------------------------------------------------------
  const note1Ref = doc(collection(db, 'notes'));
  const note2Ref = doc(collection(db, 'notes'));
  const note3Ref = doc(collection(db, 'notes'));

  batch.set(note1Ref, {
    subjectId: subHistoryRef.id,
    topicId: topicHist1Ref.id,
    title: 'Indus Valley Civilization Comprehensive Revision Notes (PDF)',
    description: 'Handcrafted summary notes with mind maps, excavated site tables, river locations, and important artifacts.',
    pdfUrl: 'https://ncert.nic.in/textbook/pdf/kest101.pdf',
    fileSize: '2.4 MB',
    pages: 14,
    order: 1,
    published: true,
    downloadsCount: 890,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(note2Ref, {
    subjectId: subPolityRef.id,
    topicId: topicPolity1Ref.id,
    title: 'Fundamental Rights (Articles 12-35) & Landmark Judgments PDF',
    description: 'Detailed article-by-article breakdown, exceptions, and landmark cases including Kesavananda Bharati & Maneka Gandhi.',
    pdfUrl: 'https://legislative.gov.in/sites/default/files/coi-4March2016.pdf',
    fileSize: '3.8 MB',
    pages: 22,
    order: 1,
    published: true,
    downloadsCount: 1250,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(note3Ref, {
    subjectId: subMathRef.id,
    topicId: topicMath1Ref.id,
    title: 'Quantitative Aptitude Formula Sheet & Vedic Speed Math Tricks',
    description: 'Quick reference formula booklet covering percentages, profit-loss, compound interest shortcuts, and square roots.',
    pdfUrl: 'https://ncert.nic.in/textbook/pdf/jemh108.pdf',
    fileSize: '1.9 MB',
    pages: 18,
    order: 1,
    published: true,
    downloadsCount: 1620,
    createdAt: now,
    updatedAt: now,
  });

  // -------------------------------------------------------------
  // 5. HIGH-YIELD MCQS QUESTION BANK (प्रश्नोत्तरी बैंक)
  // -------------------------------------------------------------
  const mcqRefs: any[] = [];
  const mcqsData = [
    {
      subjectId: subHistoryRef.id,
      topicId: topicHist1Ref.id,
      question: 'Which of the following Indus Valley Civilization sites is known for possessing a tidal dockyard?',
      hindiQuestion: 'सिंधु घाटी सभ्यता का निम्नलिखित में से कौन सा स्थल ज्वारीय गोदी (डॉकयार्ड/बंदरगाह) के लिए जाना जाता है?',
      options: ['Harappa (हड़प्पा)', 'Mohenjo-daro (मोहनजोदड़ो)', 'Lothal (लोथल)', 'Kalibangan (कालीबंगा)'],
      correctOption: 2, // Lothal
      explanation: 'Lothal in Gujarat (on the Bhogava river) had the world’s earliest known artificial dockyard connected to the ancient course of the Sabarmati river.',
      difficulty: 'medium',
      tags: ['history', 'upsc', 'indus_valley'],
    },
    {
      subjectId: subHistoryRef.id,
      topicId: topicHist1Ref.id,
      question: 'The famous "Dancing Girl" bronze statue was discovered at which ancient site?',
      hindiQuestion: 'प्रसिद्ध कांस्य प्रतिमा "नर्तकी" (Dancing Girl) किस प्राचीन स्थल से प्राप्त हुई थी?',
      options: ['Mohenjo-daro (मोहनजोदड़ो)', 'Chanhudaro (चन्हूदड़ों)', 'Banawali (बनावली)', 'Rakhigarhi (राखीगढ़ी)'],
      correctOption: 0,
      explanation: 'The Bronze Dancing Girl, created using the lost-wax casting technique (cire perdue), was discovered in Mohenjo-daro in 1926.',
      difficulty: 'easy',
      tags: ['history', 'art_culture'],
    },
    {
      subjectId: subPolityRef.id,
      topicId: topicPolity1Ref.id,
      question: 'Which Article of the Indian Constitution was termed the "Heart and Soul of the Constitution" by Dr. B.R. Ambedkar?',
      hindiQuestion: 'डॉ. बी.आर. अम्बेडकर ने भारतीय संविधान के किस अनुच्छेद को "संविधान का हृदय एवं आत्मा" कहा था?',
      options: ['Article 14 (समानता का अधिकार)', 'Article 19 (स्वतंत्रता का अधिकार)', 'Article 21 (प्राण एवं दैहिक स्वतंत्रता)', 'Article 32 (संवैधानिक उपचारों का अधिकार)'],
      correctOption: 3,
      explanation: 'Article 32 guarantees the Right to Constitutional Remedies, empowering citizens to approach the Supreme Court directly for the enforcement of Fundamental Rights via 5 types of Writs.',
      difficulty: 'easy',
      tags: ['polity', 'constitution', 'fundamental_rights'],
    },
    {
      subjectId: subPolityRef.id,
      topicId: topicPolity1Ref.id,
      question: 'The landmark "Basic Structure Doctrine" was propounded by the Supreme Court of India in which famous case?',
      hindiQuestion: 'सर्वोच्च न्यायालय ने किस ऐतिहासिक मामले में "मूल संरचना सिद्धांत" (Basic Structure Doctrine) प्रतिपादित किया था?',
      options: ['Golaknath Case (1967)', 'Kesavananda Bharati Case (1973)', 'Minerva Mills Case (1980)', 'Maneka Gandhi Case (1978)'],
      correctOption: 1,
      explanation: 'In Kesavananda Bharati v. State of Kerala (1973), a 13-judge constitutional bench ruled that Parliament cannot alter the basic features of the Constitution.',
      difficulty: 'medium',
      tags: ['polity', 'judiciary'],
    },
    {
      subjectId: subGeographyRef.id,
      topicId: topicGeo1Ref.id,
      question: 'Which of the following is the longest peninsular river in India, often referred to as "Dakshin Ganga"?',
      hindiQuestion: 'भारत की सबसे लंबी प्रायद्वीपीय नदी कौन सी है जिसे प्रायः "दक्षिण गंगा" कहा जाता है?',
      options: ['Mahanadi (महानदी)', 'Godavari (गोदावरी)', 'Krishna (कृष्णा)', 'Cauvery (कावेरी)'],
      correctOption: 1,
      explanation: 'The Godavari River (1,465 km) originates at Trimbakeshwar in Maharashtra and is the largest and longest river system of peninsular India.',
      difficulty: 'easy',
      tags: ['geography', 'rivers'],
    },
    {
      subjectId: subScienceRef.id,
      topicId: topicSci1Ref.id,
      question: 'Which cellular organelle is universally known as the "Powerhouse of the Cell"?',
      hindiQuestion: 'किस कोशिकांग को "कोशिका का ऊर्जा गृह" (Powerhouse of the Cell) कहा जाता है?',
      options: ['Ribosome (राइबोसोम)', 'Golgi Apparatus (गॉल्जीकाय)', 'Mitochondria (माइटोकॉन्ड्रिया)', 'Lysosome (लाइसोसोम)'],
      correctOption: 2,
      explanation: 'Mitochondria produce cellular energy in the form of Adenosine Triphosphate (ATP) through cellular respiration.',
      difficulty: 'easy',
      tags: ['science', 'biology'],
    },
    {
      subjectId: subMathRef.id,
      topicId: topicMath1Ref.id,
      question: 'If the selling price of an article is ₹840 with a profit of 20%, what was its cost price (CP)?',
      hindiQuestion: 'यदि किसी वस्तु का विक्रय मूल्य 20% लाभ के साथ ₹840 है, तो उसका क्रय मूल्य क्या था?',
      options: ['₹680', '₹700', '₹720', '₹750'],
      correctOption: 1, // 840 / 1.2 = 700
      explanation: 'Cost Price = Selling Price / (1 + Profit%) = ₹840 / 1.20 = ₹700.',
      difficulty: 'easy',
      tags: ['math', 'profit_loss'],
    },
  ];

  mcqsData.forEach((item, index) => {
    const ref = doc(collection(db, 'mcqs'));
    mcqRefs.push(ref.id);
    batch.set(ref, {
      ...item,
      order: index + 1,
      createdAt: now,
      updatedAt: now,
    });
  });

  // -------------------------------------------------------------
  // 6. MOCK TESTS (मॉक टेस्ट परीक्षा)
  // -------------------------------------------------------------
  const mockTest1Ref = doc(collection(db, 'mockTests'));
  const mockTest2Ref = doc(collection(db, 'mockTests'));

  batch.set(mockTest1Ref, {
    title: 'General Studies Foundation All-India Mock Test 2026',
    description: 'Comprehensive evaluation covering Indian History, Polity, Geography & Science designed on the latest competitive exam pattern.',
    subjectId: subHistoryRef.id,
    duration: 45, // 45 minutes
    totalMarks: 70,
    passingMarks: 35,
    mcqIds: mcqRefs,
    totalQuestions: mcqRefs.length,
    isPublished: true,
    attemptsCount: 148,
    averageScore: 48.5,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(mockTest2Ref, {
    title: 'Indian Polity & Constitutional Writs Speed Test',
    description: 'Focused test examining Articles 12-35, President powers, Supreme Court writs, and fundamental duties.',
    subjectId: subPolityRef.id,
    duration: 20,
    totalMarks: 40,
    passingMarks: 20,
    mcqIds: mcqRefs.slice(2, 4),
    totalQuestions: 2,
    isPublished: true,
    attemptsCount: 92,
    averageScore: 32.0,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();

  return {
    subjectsCount: 6,
    topicsCount: 8,
    lecturesCount: 4,
    notesCount: 3,
    mcqsCount: mcqsData.length,
    mockTestsCount: 2,
  };
}
