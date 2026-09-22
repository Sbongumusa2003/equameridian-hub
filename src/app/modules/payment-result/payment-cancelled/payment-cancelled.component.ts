import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-cancelled',
  templateUrl: './payment-cancelled.component.html',
  styleUrls: ['../payment-success/payment-success.component.scss'],
  standalone: false,
})
export class PaymentCancelledComponent implements OnInit {
  invoiceId: number | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const raw = params.get('invoiceId');
      this.invoiceId = raw ? Number(raw) : null;
    });
  }
}
