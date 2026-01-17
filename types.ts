
export interface PracticalExample {
  title: string;
  description: string;
  analogy: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  studied: boolean;
}

export interface TimelineItem {
  date: string;
  event: string;
  description: string;
}

export interface MindMapNode {
  concept: string;
  details: string[];
  subConcepts?: MindMapNode[];
}

export interface CourseAnalysis {
  topicTitle: string;
  summary: string;
  keyPoints: string[];
  examples: PracticalExample[];
  quiz: QuizQuestion[];
  chapterId?: string;
  groundingUrls?: { title: string; uri: string }[];
  commonQuestions?: string[];
  timeline?: TimelineItem[];
  mindMap?: MindMapNode[];
}

export type AnalysisStyle = 'internet' | 'basic' | 'medium' | 'hard';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SELECTING_LANGUAGE = 'SELECTING_LANGUAGE',
  PARSING = 'PARSING',
  CONFIGURING = 'CONFIGURING',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
