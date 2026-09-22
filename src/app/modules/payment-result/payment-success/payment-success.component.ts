import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss'],
  standalone: false,
})
export class PaymentSuccessComponent implements OnInit {
  invoiceId: number | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const raw = params.get('invoiceId');
      this.invoiceId = raw ? Number(raw) : null;
    });
  }
}
