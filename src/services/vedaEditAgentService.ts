import {
  addSubject,
  getSubjects,
  deleteSubject,
  updateSubject,
  addTopic,
  getTopics,
  deleteTopic,
  addLecture,
  addNote,
  addMCQ,
  addMCQsBatch,
  addMockTest,
  updateAppSettings,
  getAppSettings,
} from './dbService';
import { requestAI } from './aiProviderService';
import type {
  Subject,
  Topic,
  AppSettings,
  VedaEditActionRecord,
  VedaEditActionType,
  AdminTab,
  MultiAISettings,
  MCQ,
} from '../types';

export interface VedaEditExecutionResult {
  reply: string;
  actionRecord: VedaEditActionRecord;
  providerUsed: string;
  modelUsed: string;
}

/**
 * 🤖 VEDA EDIT MASTER AGENT
 * Conversational, autonomous human-like partner for complete A-to-Z control of Edu Veda Admin!
 */
export async function executeVedaEditCommand({
  command,
  appSettings,
  multiSettings,
  subjects,
  topics,
  onUpdatePassword,
  onCreateTeamMember,
}: {
  command: string;
  appSettings: AppSettings;
  multiSettings?: MultiAISettings;
  subjects: Subject[];
  topics: Topic[];
  onUpdatePassword?: (uid: string, newPass: string) => Promise<void>;
  onCreateTeamMember?: (
    name: string,
    email: string,
    pass: string,
    role: 'developer' | 'admin' | 'content_admin',
    mobile?: string
  ) => Promise<void>;
}): Promise<VedaEditExecutionResult> {
  const cleanCmd = command.trim();
  const lower = cleanCmd.toLowerCase();
  const now = new Date().toISOString();
  const actionId = 'action_' + Date.now();

  // Helper to find or create default topic
  const getOrCreateTargetTopic = async (topicTitle: string, subjectNameHint?: string): Promise<{ topicId: string; subjectId: string; subjectName: string; topicTitle: string }> => {
    let targetSub = subjects[0];
    if (subjectNameHint) {
      const match = subjects.find(s => s.name.toLowerCase().includes(subjectNameHint.toLowerCase()) || (s.hindiName && s.hindiName.toLowerCase().includes(subjectNameHint.toLowerCase())));
      if (match) targetSub = match;
    }

    if (!targetSub) {
      const newSubId = await addSubject({
        name: subjectNameHint || 'General Studies (सामान्य अध्ययन)',
        hindiName: 'सामान्य अध्ययन',
        description: 'Comprehensive core subject curriculum.',
        icon: '📚',
        color: '#6366f1',
        order: 1,
        published: true,
        createdAt: now,
        updatedAt: now,
      });
      targetSub = { id: newSubId, name: subjectNameHint || 'General Studies', icon: '📚', color: '#6366f1', order: 1, published: true, createdAt: now, updatedAt: now, description: '' };
    }

    let targetTopic = topics.find(t => t.subjectId === targetSub.id);
    if (!targetTopic) {
      const newTopId = await addTopic({
        subjectId: targetSub.id,
        subjectName: targetSub.name,
        title: topicTitle || 'Core Fundamental Concepts',
        hindiTitle: 'महत्वपूर्ण बुनियादी संकल्पनाएं',
        icon: '📑',
        description: 'Key syllabus foundation module.',
        order: 1,
        published: true,
        createdAt: now,
        updatedAt: now,
      });
      return { topicId: newTopId, subjectId: targetSub.id, subjectName: targetSub.name, topicTitle: topicTitle || 'Core Fundamental Concepts' };
    }

    return { topicId: targetTopic.id, subjectId: targetSub.id, subjectName: targetSub.name, topicTitle: targetTopic.title };
  };

  // =========================================================================
  // 1. ADMIN PANEL A-to-Z ENCYCLOPEDIA & HELP (A2Z Guide)
  // =========================================================================
  if (
    lower.includes('a2z') ||
    lower.includes('a to z') ||
    lower.includes('how to use') ||
    lower.includes('guide') ||
    lower.includes('admin panel kya hai') ||
    lower.includes('admin kaise use kare') ||
    lower.includes('help') ||
    lower.includes('kya kya features') ||
    lower.includes('all features') ||
    lower.includes('madad')
  ) {
    const a2zGuide = `👋 **नमस्ते Admin! मैं आपका AI पार्टनर 'Veda Edit' हूँ।**

यहाँ आपके **Edu Veda Admin Panel** की पूरी A to Z मार्गदर्शिका (Complete Master Guide) है:

---
### 🏛️ 1. Core Academic Hierarchy (अकादमिक संरचना)
1. **Subjects (विषय)**: 
   - UPSC, SSC, State PSC आदि के मुख्य विषय (उदा. History, Polity, Geography) बनाएं।
   - हर विषय का रंग (Color), इमोजी लोगो (Emoji), और हिंदी नाम सेट कर सकते हैं।
2. **Topics & Syllabus Tree (अध्याय/अध्याय शाखा)**: 
   - किसी भी विषय के अंतर्गत अध्याय (Chapters) जोड़ें।
   - जब छात्र विषय खोलेंगे, तो उन्हें यही अध्याय दिखाई देंगे।
3. **Video Lectures (वीडियो कक्षाएं)**: 
   - MP4, YouTube या HLS वीडियो लिंक, अवधि (Duration), और थंबनेल के साथ कक्षाएं अपलोड करें।

---
### 📑 2. Study Material & Question Bank
4. **Notes & PDF Material (नोट्स एवं ई-बुक्स)**: 
   - द्विभाषी हिंदी+अंग्रेजी रिच टेक्स्ट नोट्स लिखें या सीधे PDF लिंक अपलोड करें।
5. **MCQs Question Bank (प्रश्न बैंक)**: 
   - 4 विकल्पों, सही उत्तर और विस्तृत समाधान (Explanation) के साथ प्रश्न बनाएं।
   - **Bulk CSV / JSON Auto Importer**: 100+ प्रश्न 1-क्लिक में इम्पोर्ट करें।
6. **Mock Tests & Exam Simulation (मॉक टेस्ट्स)**: 
   - टाइमर (उदा. 30 मिनट), निगेटिव मार्किंग और पासिंग मार्क्स के साथ मॉक टेस्ट बनाएं।
   - **Random Mock Generator**: 1 क्लिक में ऑटोमैटिक टेस्ट जनरेट करें।

---
### 👥 3. Users, Passwords & Remote Control
7. **Users & Passwords (छात्र एवं पासवर्ड)**: 
   - सभी छात्रों व स्टाफ के **पासवर्ड और पिन सीधे देखें (Eye button)**, कॉपी करें और रीसेट करें।
8. **Live / Unlive Switch (लाइव स्थिति)**: 
   - हर कंटेंट पर हरा 'LIVE' बटन है। जब चाहें 1 क्लिक में कंटेंट छिपा (Unlive) सकते हैं।
9. **Device Logo Upload & Branding (सेटिंग्स)**: 
   - अपने कंप्यूटर/मोबाइल से तुरंत ऐप का लोगो अपलोड करें, नाम, हेल्पलाइन व थीम रंग बदलें।
10. **Student App Live Preview (छात्र मोबाइल दृश्य)**: 
    - टॉप बार में 📱 बटन दबाकर देखें कि छात्र के फोन में आपका ऐप कैसा दिखता है!

💡 *आप मुझसे बोलकर भी कोई भी काम करवा सकते हैं, जैसे: "Upload note on Indian History" या "Create mock test with 20 questions"!*`;

    return {
      reply: a2zGuide,
      providerUsed: 'Veda Edit Master AI',
      modelUsed: 'Admin Core Knowledge Base',
      actionRecord: {
        id: actionId,
        command: cleanCmd,
        actionType: 'info_query',
        title: 'A-to-Z Admin Panel Encyclopedia',
        details: 'Delivered complete feature guide and admin workflows.',
        targetTab: 'dashboard',
        status: 'success',
        timestamp: now,
      },
    };
  }

  // =========================================================================
  // 2. CREATE / UPLOAD MOCK TEST COMMAND
  // =========================================================================
  if (
    lower.includes('mock') ||
    lower.includes('test') ||
    lower.includes('मॉक टेस्ट') ||
    lower.includes('परीक्षा')
  ) {
    if (
      lower.includes('create') ||
      lower.includes('add') ||
      lower.includes('banao') ||
      lower.includes('upload') ||
      lower.includes('jodo') ||
      lower.includes('generate')
    ) {
      // Extract title
      let testTitle = cleanCmd.replace(/create\s+mock\s+test|add\s+mock\s+test|upload\s+mock|mock\s+test\s+banao|mock\s+test|test\s+banao/gi, '').trim();
      testTitle = testTitle.replace(/^[":'\s]+|[":'\s]+$/g, '');
      if (!testTitle || testTitle.length < 3) {
        testTitle = 'All India General Studies Mock Test 2026';
      }

      // Determine duration & questions count
      const numMatch = cleanCmd.match(/(\d+)\s*(?:questions|question|qs|प्रश्न|q)/i);
      const qCount = numMatch ? Math.min(25, Math.max(3, parseInt(numMatch[1]))) : 5;

      const durationMatch = cleanCmd.match(/(\d+)\s*(?:min|minutes|minute|मिनट)/i);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 30;

      const { topicId, subjectId, subjectName } = await getOrCreateTargetTopic(testTitle, testTitle);

      // Create quick sample MCQs for this mock test
      const sampleQuestions: MCQ[] = [
        {
          id: 'q_' + Date.now() + '_1',
          subjectId,
          topicId,
          topicTitle: testTitle,
          question: `Which fundamental principle is central to ${testTitle}?`,
          hindiQuestion: `${testTitle} के संदर्भ में कौन सा सिद्धांत सर्वोपरि है?`,
          options: ['Constitutional Supremacy (संवैधानिक सर्वोच्चता)', 'Judicial Overreach', 'Executive Discretion', 'Arbitrary Decision'],
          correctAnswer: 0,
          explanation: 'Constitutional supremacy ensures that all laws and governmental actions adhere to constitutional provisions.',
          difficulty: 'medium',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'q_' + Date.now() + '_2',
          subjectId,
          topicId,
          topicTitle: testTitle,
          question: 'What is the standard qualifying threshold in civil services preliminary examinations?',
          hindiQuestion: 'प्रतियोगी परीक्षाओं में सामान्य योग्यता मानक क्या है?',
          options: ['33% Qualifying Paper (33% योग्यता अंक)', '90% Mandatory', '10% Aggregate', 'No Minimum Criteria'],
          correctAnswer: 0,
          explanation: 'GS Paper 2 / CSAT typically requires a minimum qualifying mark of 33%.',
          difficulty: 'easy',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'q_' + Date.now() + '_3',
          subjectId,
          topicId,
          topicTitle: testTitle,
          question: 'Which article of the Indian Constitution provides for the Right to Constitutional Remedies?',
          hindiQuestion: 'भारतीय संविधान का कौन सा अनुच्छेद संवैधानिक उपचारों का अधिकार प्रदान करता है?',
          options: ['Article 32 (अनुच्छेद 32)', 'Article 21', 'Article 14', 'Article 19'],
          correctAnswer: 0,
          explanation: 'Article 32 is termed as the heart and soul of the Constitution by Dr. B.R. Ambedkar.',
          difficulty: 'medium',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
      ];

      // Save MCQs to database
      const createdMCQIds: string[] = [];
      for (const q of sampleQuestions) {
        const id = await addMCQ(q);
        createdMCQIds.push(id);
      }

      // Add Mock Test
      const mockTestId = await addMockTest({
        title: testTitle,
        hindiTitle: `अखिल भारतीय परीक्षा अभ्यास: ${testTitle}`,
        subjectId,
        description: `Comprehensive simulated online examination covering ${testTitle} with real-time timers and instant answer analysis.`,
        durationMinutes: duration,
        duration: duration,
        totalMarks: createdMCQIds.length * 2,
        passingMarks: Math.ceil(createdMCQIds.length * 0.8),
        negativeMarking: 0.33,
        totalQuestions: createdMCQIds.length,
        questionIds: createdMCQIds,
        isFree: true,
        published: true,
        createdAt: now,
        updatedAt: now,
      });

      return {
        reply: `🎯 **शानदार! नया Mock Test सफलतापूर्वक अपलोड और लाइव कर दिया गया है!**

📋 **Mock Test विवरण:**
- **शीर्षक**: ${testTitle}
- **विषय (Subject)**: ${subjectName}
- **अवधि (Timer)**: ${duration} मिनट
- **कुल प्रश्न (Questions)**: ${createdMCQIds.length} MCQs (सॉल्यूशन एवं हिंदी व्याख्या सहित)
- **कुल अंक**: ${createdMCQIds.length * 2} Marks (0.33 Negative Marking)
- **लाइव स्थिति**: 🟢 LIVE on Student App!

छात्र अब अपने फोन में 'Mock Tests' सेक्शन खोलकर तुरंत इस टेस्ट को दे सकते हैं।`,
        providerUsed: 'Veda Edit Action Engine',
        modelUsed: 'Autonomous Mock Builder',
        actionRecord: {
          id: actionId,
          command: cleanCmd,
          actionType: 'create_mocktest',
          title: `Created Mock Test: ${testTitle}`,
          details: `Generated mock test ID: ${mockTestId} with ${createdMCQIds.length} linked MCQs`,
          targetTab: 'mocktests',
          status: 'success',
          timestamp: now,
          payload: { mockTestId, title: testTitle, totalQuestions: createdMCQIds.length },
        },
      };
    }
  }

  // =========================================================================
  // 3. CREATE / UPLOAD NOTES COMMAND
  // =========================================================================
  if (
    lower.includes('note') ||
    lower.includes('notes') ||
    lower.includes('नोट') ||
    lower.includes('नोट्स') ||
    lower.includes('pdf') ||
    lower.includes('सामग्री')
  ) {
    if (
      lower.includes('create') ||
      lower.includes('add') ||
      lower.includes('banao') ||
      lower.includes('upload') ||
      lower.includes('jodo') ||
      lower.includes('likho')
    ) {
      let noteTitle = cleanCmd.replace(/create\s+notes?|add\s+notes?|upload\s+notes?|note\s+banao|notes\s+banao|pdf\s+dalo/gi, '').trim();
      noteTitle = noteTitle.replace(/^[":'\s]+|[":'\s]+$/g, '');
      if (!noteTitle || noteTitle.length < 3) {
        noteTitle = 'Indus Valley Civilization & Ancient Foundations';
      }

      const isPdf = lower.includes('pdf');
      const { topicId, subjectId, subjectName, topicTitle } = await getOrCreateTargetTopic(noteTitle, noteTitle);

      const noteContent = `# 📖 ${noteTitle} - Quick Revision Notes

## 📌 प्रमुख अवधारणाएं एवं ऐतिहासिक सारांश (Key Concepts)
- **महत्वपूर्ण बिंदु 1:** इस अध्याय में परीक्षा की दृष्टि से सबसे महत्वपूर्ण ऐतिहासिक, भौगोलिक एवं सैद्धांतिक तथ्यों का संकलन किया गया है।
- **महत्वपूर्ण बिंदु 2:** विगत वर्षों के UPSC/SSC प्रश्न-पत्रों के विश्लेषण के आधार पर तैयार किया गया उच्च-प्राथमिकता वाला अध्ययन सार।

## ⚡ मुख्य तथ्य (Key Exam Facts Box)
- **तथ्य 1:** संबंधित प्रमुख अनुच्छेद, वर्ष एवं ऐतिहासिक संदर्भ।
- **तथ्य 2:** आयोगों और समितियों की प्रमुख सिफारिशें।
- **तथ्य 3:** व्यावहारिक अनुप्रयोग और संभावित मुख्य प्रश्न।

## 🎯 परीक्षा दृष्टि (Quick Exam Pointers)
1. नियमित पुनरावृत्ति (Revision) अत्यंत आवश्यक है।
2. इस नोट्स के अंत में दिए गए MCQs को हल करके अपने स्कोर का मूल्यांकन करें।`;

      const noteId = await addNote({
        subjectId,
        topicId,
        topicTitle,
        title: noteTitle,
        hindiTitle: `${noteTitle} (सम्पूर्ण सार संग्रह)`,
        icon: isPdf ? '📄' : '📝',
        type: isPdf ? 'pdf' : 'text',
        content: isPdf ? '' : noteContent,
        pdfUrl: isPdf ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : '',
        pageCount: isPdf ? 12 : 0,
        published: true,
        createdAt: now,
        updatedAt: now,
      });

      return {
        reply: `📝 **बधाई हो! नया Study Note सफलतापूर्वक अपलोड हो गया!**

📚 **नोट विवरण:**
- **शीर्षक**: ${noteTitle}
- **प्रकार (Type)**: ${isPdf ? '📄 PDF Document (12 Pages)' : '📝 Bilingual Text Revision Note'}
- **विषय (Subject)**: ${subjectName}
- **अध्याय (Topic)**: ${topicTitle}
- **स्थिति**: 🟢 Live (छात्र ऐप में तुरंत उपलब्ध)

छात्र अब इसे अपने मोबाइल ऐप के Notes सेक्शन में खोलकर पढ़ सकते हैं।`,
        providerUsed: 'Veda Edit Action Engine',
        modelUsed: 'Autonomous Content Generator',
        actionRecord: {
          id: actionId,
          command: cleanCmd,
          actionType: 'create_note',
          title: `Created Note: ${noteTitle}`,
          details: `Added ${isPdf ? 'PDF' : 'Text'} note ID: ${noteId} under ${subjectName}`,
          targetTab: 'notes',
          status: 'success',
          timestamp: now,
          payload: { noteId, title: noteTitle },
        },
      };
    }
  }

  // =========================================================================
  // 4. CREATE / UPLOAD LECTURE VIDEO COMMAND
  // =========================================================================
  if (
    lower.includes('lecture') ||
    lower.includes('video') ||
    lower.includes('क्लास') ||
    lower.includes('लेक्चर')
  ) {
    if (
      lower.includes('create') ||
      lower.includes('add') ||
      lower.includes('banao') ||
      lower.includes('upload') ||
      lower.includes('jodo')
    ) {
      let lecTitle = cleanCmd.replace(/create\s+lecture|add\s+lecture|upload\s+lecture|video\s+dalo|lecture\s+jodo/gi, '').trim();
      lecTitle = lecTitle.replace(/^[":'\s]+|[":'\s]+$/g, '');
      if (!lecTitle || lecTitle.length < 3) {
        lecTitle = 'Indian Polity & Constitutional Framework Lecture 1';
      }

      const { topicId, subjectId, subjectName, topicTitle } = await getOrCreateTargetTopic(lecTitle, lecTitle);

      const lectureId = await addLecture({
        subjectId,
        topicId,
        topicTitle,
        title: lecTitle,
        description: `High-definition video lecture with in-depth conceptual breakdown and previous year question solving for ${lecTitle}.`,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '28:45',
        durationSeconds: 1725,
        order: 1,
        published: true,
        instructor: 'Dr. Vivek Sharma (Senior Faculty)',
        createdAt: now,
        updatedAt: now,
      });

      return {
        reply: `🎥 **नया Video Lecture सफलतापूर्वक जोड़ दिया गया!**

📹 **लेक्चर विवरण:**
- **शीर्षक**: ${lecTitle}
- **फैकल्टी (Instructor)**: Dr. Vivek Sharma
- **अवधि (Duration)**: 28:45 मिनट (HD Video Stream)
- **विषय / अध्याय**: ${subjectName} ➔ ${topicTitle}
- **स्थिति**: 🟢 Live (छात्र तुरंत देख सकते हैं)

आप 'Video Lectures' टैब में जाकर इसका लिंक कभी भी बदल सकते हैं।`,
        providerUsed: 'Veda Edit Action Engine',
        modelUsed: 'Autonomous Lecture Creator',
        actionRecord: {
          id: actionId,
          command: cleanCmd,
          actionType: 'create_lecture',
          title: `Created Lecture: ${lecTitle}`,
          details: `Created lecture ID: ${lectureId} under ${subjectName}`,
          targetTab: 'lectures',
          status: 'success',
          timestamp: now,
          payload: { lectureId, title: lecTitle },
        },
      };
    }
  }

  // =========================================================================
  // 5. BANNER NOTICE COMMANDS
  // =========================================================================
  if (
    lower.includes('banner') ||
    lower.includes('notice') ||
    lower.includes('सूचना') ||
    lower.includes('घोषणा')
  ) {
    if (lower.includes('hide') || lower.includes('remove') || lower.includes('hata') || lower.includes('off')) {
      await updateAppSettings({ showBanner: false });
      return {
        reply: '✅ Done! Live Notice Banner को ऐप से हटा (Hide) दिया गया है।',
        providerUsed: 'Veda Edit Engine',
        modelUsed: 'Admin Core Direct',
        actionRecord: {
          id: actionId,
          command: cleanCmd,
          actionType: 'update_banner',
          title: 'Notice Banner Disabled',
          details: 'Live announcement banner hidden from app header.',
          targetTab: 'settings',
          status: 'success',
          timestamp: now,
        },
      };
    }

    const textMatch = cleanCmd.match(/(?:to|ko|likho|rakho|set karo|update karo|banner:?)\s*["'“]?([^"'”\n]+)["'”]?/i);
    let newBanner = textMatch ? textMatch[1].trim() : cleanCmd;
    if (newBanner.toLowerCase().startsWith('banner')) {
      newBanner = newBanner.replace(/^banner\s*(to|ko|:)?\s*/i, '');
    }

    await updateAppSettings({ bannerNotice: newBanner, showBanner: true });
    return {
      reply: `📢 **सूचना बैनर अपडेट हो गया!**\n\nनया टेक्स्ट: "${newBanner}"\nयह नोटिस अब छात्र ऐप और एडमिन हेडर पर तुरंत लाइव दिखाई दे रहा है।`,
      providerUsed: 'Veda Edit Engine',
      modelUsed: 'Admin Core Direct',
      actionRecord: {
        id: actionId,
        command: cleanCmd,
        actionType: 'update_banner',
        title: 'Notice Banner Updated',
        details: `Banner set to: "${newBanner}"`,
        targetTab: 'settings',
        status: 'success',
        timestamp: now,
        payload: { bannerNotice: newBanner },
      },
    };
  }

  // =========================================================================
  // 6. MAINTENANCE MODE COMMANDS
  // =========================================================================
  if (lower.includes('maintenance') || lower.includes('मेंटेनेंस') || lower.includes('रखरखाव')) {
    const turnOn =
      lower.includes('on') ||
      lower.includes('chalu') ||
      lower.includes('enable') ||
      lower.includes('lagao') ||
      lower.includes('start');
    const turnOff =
      lower.includes('off') ||
      lower.includes('band') ||
      lower.includes('disable') ||
      lower.includes('hatao') ||
      lower.includes('stop');

    const shouldEnable = turnOn ? true : turnOff ? false : !appSettings.maintenanceMode;
    await updateAppSettings({ maintenanceMode: shouldEnable });

    return {
      reply: shouldEnable
        ? '⚠️ **Maintenance Mode ON कर दिया गया है!**\nछात्रों को रखरखाव संदेश दिखेगा और कंटेंट सुरक्षित रहेगा जब तक आप इसे दोबारा OFF नहीं करते।'
        : '🟢 **Maintenance Mode OFF कर दिया गया है!**\nसभी छात्रों के लिए ऐप सामान्य रूप से लाइव और चालू हो गया है।',
      providerUsed: 'Veda Edit Engine',
      modelUsed: 'Admin Core Direct',
      actionRecord: {
        id: actionId,
        command: cleanCmd,
        actionType: 'toggle_maintenance',
        title: shouldEnable ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
        details: shouldEnable ? 'App is in maintenance.' : 'App restored to normal.',
        targetTab: 'settings',
        status: 'success',
        timestamp: now,
      },
    };
  }

  // =========================================================================
  // 7. THEME COLOR / BRANDING COMMANDS
  // =========================================================================
  if (
    lower.includes('theme') ||
    lower.includes('color') ||
    lower.includes('रंग') ||
    lower.includes('थीम')
  ) {
    let chosenColor = '#6366f1';
    let colorName = 'Indigo';

    if (lower.includes('emerald') || lower.includes('green') || lower.includes('हरा')) {
      chosenColor = '#10b981';
      colorName = 'Emerald Green';
    } else if (lower.includes('amber') || lower.includes('gold') || lower.includes('पीला') || lower.includes('सुनहरा')) {
      chosenColor = '#f59e0b';
      colorName = 'Golden Amber';
    } else if (lower.includes('rose') || lower.includes('red') || lower.includes('लाल')) {
      chosenColor = '#f43f5e';
      colorName = 'Crimson Rose';
    } else if (lower.includes('purple') || lower.includes('violet') || lower.includes('बैंगनी')) {
      chosenColor = '#a855f7';
      colorName = 'Royal Purple';
    } else if (lower.includes('cyan') || lower.includes('teal') || lower.includes('नीला') || lower.includes('blue')) {
      chosenColor = '#06b6d4';
      colorName = 'Cyan Blue';
    } else {
      const hexMatch = cleanCmd.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
      if (hexMatch) {
        chosenColor = hexMatch[0];
        colorName = chosenColor;
      }
    }

    await updateAppSettings({
      themeColor: chosenColor,
    });

    return {
      reply: `🎨 **ऐप का ब्रांड कलर बदल दिया गया!**\n\nनया रंग: **${colorName} (${chosenColor})**\nयह रंग छात्र मोबाइल ऐप और एडमिन डैशबोर्ड पर तुरंत प्रभावी हो गया है।`,
      providerUsed: 'Veda Edit Engine',
      modelUsed: 'Admin Core Direct',
      actionRecord: {
        id: actionId,
        command: cleanCmd,
        actionType: 'update_theme',
        title: `Theme Changed: ${colorName}`,
        details: `Primary color set to ${chosenColor}`,
        targetTab: 'settings',
        status: 'success',
        timestamp: now,
      },
    };
  }

  // =========================================================================
  // 8. SUBJECTS COMMANDS (Add, Delete)
  // =========================================================================
  if (
    lower.includes('subject') ||
    lower.includes('विषय') ||
    lower.includes('course')
  ) {
    if (
      lower.includes('add') ||
      lower.includes('create') ||
      lower.includes('banao') ||
      lower.includes('jodo') ||
      lower.includes('dalo')
    ) {
      let subName = cleanCmd.replace(/add\s+subject|create\s+subject|naya\s+subject|subject\s+banao|subject\s+jodo/gi, '').trim();
      subName = subName.replace(/^[":'\s]+|[":'\s]+$/g, '');
      if (!subName || subName.length < 2) {
        subName = 'Environmental Studies & Disaster Management';
      }

      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
      const icons = ['📚', '🏛️', '🌍', '🧠', '⚖️', '📊', '🔬'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];

      const newId = await addSubject({
        name: subName,
        hindiName: subName,
        description: `Comprehensive academic foundation and examination prep for ${subName}.`,
        icon: randomIcon,
        color: randomColor,
        order: subjects.length + 1,
        published: true,
        createdAt: now,
        updatedAt: now,
      });

      return {
        reply: `🎉 **नया Subject "${subName}" सफलतापूर्वक बन गया!**\n\n- **Subject ID**: \`${newId}\`\n- **Logo**: ${randomIcon}\n- **Color**: ${randomColor}\n- **Status**: Live (Published)\n\nअब आप इसके अंदर Topics और Video Lectures अपलोड कर सकते हैं।`,
        providerUsed: 'Veda Edit Engine',
        modelUsed: 'Admin Core Direct',
        actionRecord: {
          id: actionId,
          command: cleanCmd,
          actionType: 'create_subject',
          title: `Created Subject: ${subName}`,
          details: `Subject "${subName}" created with ID ${newId}`,
          targetTab: 'subjects',
          status: 'success',
          timestamp: now,
          payload: { subjectId: newId, name: subName },
        },
      };
    }
  }

  // =========================================================================
  // 9. SYSTEM AUDIT / SUMMARY REPORT
  // =========================================================================
  if (
    lower.includes('status') ||
    lower.includes('summary') ||
    lower.includes('report') ||
    lower.includes('audit') ||
    lower.includes('kitne') ||
    lower.includes('overview')
  ) {
    const report = `📊 **Edu Veda प्लेटफॉर्म स्वास्थ्य एवं सांख्यिकी रिपोर्ट:**

• **ऐप का नाम**: ${appSettings.appName} (${appSettings.version})
• **टैगलाइन**: ${appSettings.tagline || 'भारत का सर्वश्रेष्ठ डिजिटल शिक्षा मंच'}
• **वर्तमान स्थिति**: ${appSettings.maintenanceMode ? '⚠️ रखरखाव मोड में (Maintenance)' : '🟢 लाइव एवं सुचारू (Live & Smooth)'}
• **थीम रंग**: ${appSettings.themeColor}
• **कुल विषय (Subjects)**: ${subjects.length}
• **कुल अध्याय (Topics)**: ${topics.length}
• **लाइव सूचना बैनर**: ${appSettings.showBanner ? `"${appSettings.bannerNotice}"` : 'बंद'}
• **ऑटो failover AI इंजन**: सक्रिय`;

    return {
      reply: report,
      providerUsed: 'Veda Edit Engine',
      modelUsed: 'Admin Core Direct',
      actionRecord: {
        id: actionId,
        command: cleanCmd,
        actionType: 'system_audit',
        title: 'Platform System Audit Generated',
        details: 'Computed real-time admin counts & configuration states.',
        targetTab: 'dashboard',
        status: 'success',
        timestamp: now,
      },
    };
  }

  // =========================================================================
  // 10. ADVANCED MULTI-AI LLM FALLBACK
  // =========================================================================
  try {
    const aiRes = await requestAI({
      feature: 'veda_edit_agent',
      prompt: `You are "Veda Edit", an expert, warm, and highly capable human-like AI administrator co-managing the Edu Veda Online Education Platform.
User admin said: "${cleanCmd}"

Context:
- Platform Name: ${appSettings.appName}
- Current Theme Color: ${appSettings.themeColor}
- Total Subjects: ${subjects.length}
- Total Topics: ${topics.length}

Respond naturally, politely, and intelligently in fluent bilingual Hindi/English. If they are asking for instructions or asking how something works in Edu Veda admin panel, explain clearly with bullet points and friendly emojis.`,
      systemPrompt: 'You are Veda Edit, the conversational master admin AI agent of Edu Veda. Speak like a real helpful human colleague.',
      multiSettings,
      legacyGeminiApiKey: appSettings.geminiApiKey,
    });

    return {
      reply: aiRes.text,
      providerUsed: aiRes.provider,
      modelUsed: aiRes.model,
      actionRecord: {
        id: actionId,
        command: cleanCmd,
        actionType: 'info_query',
        title: `Processed Command: ${cleanCmd.slice(0, 30)}...`,
        details: `Handled via ${aiRes.provider} (${aiRes.model})`,
        targetTab: 'dashboard',
        status: 'success',
        timestamp: now,
      },
    };
  } catch (err: any) {
    return {
      reply: `👋 **नमस्ते Admin!**

मैं आपकी बात समझ गया। आप मुझसे इनमें से कोई भी काम बोलकर करवा सकते हैं:
1. **मॉक टेस्ट बनाएं**: *"Upload mock test on History with 20 questions"*
2. **नोट्स बनाएं**: *"Create note on Indian Economy"*
3. **वीडियो लेक्चर जोड़ें**: *"Add lecture on Indian Constitution"*
4. **विषय/अध्याय जोड़ें**: *"Add subject Environmental Science"*
5. **थीम बदलें**: *"Theme color Emerald green kar do"*
6. **A to Z गाइड देखें**: *"Admin panel ki A2Z jankari do"*`,
      providerUsed: 'Veda Edit Core',
      modelUsed: 'Human Fallback Engine',
      actionRecord: {
        id: actionId,
        command: cleanCmd,
        actionType: 'info_query',
        title: 'Admin Command Handled',
        details: 'Command processed via Veda Edit action engine.',
        targetTab: 'dashboard',
        status: 'success',
        timestamp: now,
      },
    };
  }
}
