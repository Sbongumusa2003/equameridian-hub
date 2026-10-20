import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private seq = 0;
  private readonly _request = new BehaviorSubject<ConfirmRequest | null>(null);
  readonly request$ = this._request.asObservable();

  confirm(opts: ConfirmOptions | string): Promise<boolean> {
    const o = typeof opts === 'string' ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => {
      const id = ++this.seq;
      this._request.next({
        id,
        title: o.title ?? 'Confirm',
        message: o.message,
        confirmLabel: o.confirmLabel ?? 'Confirm',
        cancelLabel: o.cancelLabel ?? 'Cancel',
        danger: o.danger ?? true,
        resolve
      });
    });
  }

  respond(id: number, ok: boolean): void {
    const cur = this._request.value;
    if (cur && cur.id === id) {
      cur.resolve(ok);
      this._request.next(null);
    }
  }
}
