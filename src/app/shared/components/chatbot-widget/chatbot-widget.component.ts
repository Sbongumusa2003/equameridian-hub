import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { ChatMessage, ChatbotModelInfo } from '../../../core/models/chatbot.models';

/**
 * Floating assistant — talks to the self-trained ML.NET intent classifier
 * (POST /api/chatbot/ask). Multi-turn session, confidence, and feedback support exam demos.
 */
@Component({
  selector: 'app-chatbot-widget',
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.scss'],
  standalone: false,
})
export class ChatbotWidgetComponent implements AfterViewChecked {
  @ViewChild('scrollBox') scrollBox?: ElementRef<HTMLDivElement>;

  open = false;
  sending = false;
  draft = '';
  showModelInfo = false;
  modelInfo: ChatbotModelInfo | null = null;
  lastBotIntent: string | undefined;
  private shouldScroll = false;

  messages: ChatMessage[] = [
    {
      sender: 'bot',
      text: "Hi! I'm the EquaMeridian assistant — trained on our hire marketplace (bookings, quotes, invoices, VAT, delivery, disputes). Ask me anything about the platform.",
      quickReplies: [
        'How do bookings work?',
        'What is the status of my booking?',
        'Where is my invoice?',
        'What is EquaMeridian?'
      ]
    }
  ];

  constructor(private chatbot: ChatbotService) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollBox) {
      const el = this.scrollBox.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  toggle() {
    this.open = !this.open;
  }

  toggleModelInfo() {
    this.showModelInfo = !this.showModelInfo;
    if (this.showModelInfo && !this.modelInfo) {
      this.chatbot.modelInfo().subscribe({
        next: info => (this.modelInfo = info),
        error: () => (this.modelInfo = null)
      });
    }
  }

  send(text?: string) {
    const message = (text ?? this.draft).trim();
    if (!message || this.sending) return;

    this.messages.push({ sender: 'user', text: message });
    this.draft = '';
    this.sending = true;
    this.shouldScroll = true;

    this.chatbot.ask(message).subscribe({
      next: res => {
        this.lastBotIntent = res.intent;
        this.messages.push({
          sender: 'bot',
          text: res.reply,
          quickReplies: res.quickReplies,
          intent: res.intent,
          confidence: res.confidence,
          topIntents: res.topIntents
        });
        this.sending = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.messages.push({
          sender: 'bot',
          text: "Sorry, I couldn't reach the assistant just now. Please try again in a moment."
        });
        this.sending = false;
        this.shouldScroll = true;
      }
    });
  }

  feedback(helpful: boolean) {
    this.chatbot.feedback(helpful, this.lastBotIntent).subscribe({
      next: () => {
        this.messages.push({
          sender: 'bot',
          text: helpful
            ? 'Thanks — your feedback helps improve the assistant.'
            : 'Thanks — we logged that this reply was not helpful.'
        });
        this.shouldScroll = true;
      }
    });
  }

  confidencePct(c?: number): string {
    if (c == null) return '';
    return Math.round(c * 100) + '%';
  }
}
