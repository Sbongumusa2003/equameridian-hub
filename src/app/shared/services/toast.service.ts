import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly _items = new BehaviorSubject<ToastItem[]>([]);
  readonly items$ = this._items.asObservable();

  show(message: string, type: ToastItem['type'] = 'info'): void {
    const id = ++this.seq;
    this._items.next([...this._items.value, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
  success(m: string): void { this.show(m, 'success'); }
  error(m: string): void { this.show(m, 'error'); }
  dismiss(id: number): void {
    this._items.next(this._items.value.filter(t => t.id !== id));
  }
}
