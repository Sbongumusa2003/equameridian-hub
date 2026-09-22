export interface ChatbotIntentScore {
  intent: string;
  score: number;
}

export interface ChatbotEntities {
  bookingId?: number;
  invoiceNumber?: string;
}

export interface ChatbotReply {
  reply: string;
  intent: string;
  confidence: number;
  quickReplies: string[];
  topIntents?: ChatbotIntentScore[];
  sessionId?: string;
  entities?: ChatbotEntities;
}

export interface ChatbotModelInfo {
  algorithm: string;
  featurePipeline: string;
  trainingExampleCount: number;
  intentCount: number;
  intents: string[];
  holdoutAccuracy: number;
  trainedAtUtc: string;
  notes: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  quickReplies?: string[];
  intent?: string;
  confidence?: number;
  topIntents?: ChatbotIntentScore[];
}
