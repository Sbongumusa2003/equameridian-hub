import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatbotModelInfo, ChatbotReply } from '../models/chatbot.models';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/chatbot`;
  /** Stable session id for multi-turn context (anonymous + logged-in). */
  readonly sessionId: string;

  constructor(private http: HttpClient) {
    const key = 'em_chat_session';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    this.sessionId = id;
  }

  ask(message: string): Observable<ChatbotReply> {
    return this.http.post<ChatbotReply>(`${this.apiUrl}/ask`, {
      message,
      sessionId: this.sessionId
    });
  }

  modelInfo(): Observable<ChatbotModelInfo> {
    return this.http.get<ChatbotModelInfo>(`${this.apiUrl}/model-info`);
  }

  feedback(helpful: boolean, intent?: string, comment?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/feedback`, {
      sessionId: this.sessionId,
      intent,
      helpful,
      comment
    });
  }
}
