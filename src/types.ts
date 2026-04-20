export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number; // Index of the correct option
  explanation: string;
}

export interface StudyLog {
  id?: string;
  userId: string;
  duration: number;
  quizzesSolved: number;
  type: 'work' | 'break';
  timestamp: string;
}

export interface TimelinePost {
  id?: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  stats?: {
    duration: number;
    quizzes: number;
  };
  reactions: number;
  timestamp: string;
}

export interface TimelineComment {
  id?: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  timestamp: string;
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: '1',
    question: '親会社が子会社の株式を60%保有している場合に、個別貸借対照表の資本金から控除される勘定科目は？',
    options: ['非支配株主持分', '資本金', '利益剰余金', 'のれん'],
    answer: 0,
    explanation: '連結会計において、親会社以外の株主に属する持分は「非支配株主持分」として表示されます。'
  },
  {
    id: '2',
    question: '税効果会計において、将来の税金負担額を減らす効果を持つ資産、負債の差異は？',
    options: ['将来加算一時差異', '将来減算一時差異', '永久差異', '税率差異'],
    answer: 1,
    explanation: '将来の課税所得を減額する効果があるものは「将来減算一時差異」です。'
  },
  {
    id: '3',
    question: '直接材料費が10,000円、直接労務費が5,000円、製造間接費が3,000円の場合、製造原価は？',
    options: ['15,000円', '13,000円', '18,000円', '10,000円'],
    answer: 2,
    explanation: '製造原価 = 直接材料費 + 直接労務費 + 製造間接費 = 10,000 + 5,000 + 3,000 = 18,000円です。'
  },
  {
    id: '4',
    question: '連結財務諸表において、親会社の投資と子会社の資本を相殺消去した際に生じる、投資額が資本額を上回っている場合の差額は？',
    options: ['負ののれん', 'のれん', '利益剰余金', '資本剰余金'],
    answer: 1,
    explanation: '投資が資本を上回る場合の正の差額は「のれん」として資産に計上されます。'
  }
];
