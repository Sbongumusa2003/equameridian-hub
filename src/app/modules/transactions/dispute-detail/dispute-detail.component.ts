import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DisputeService } from '../../../core/services/dispute.service';
import { DisputeDetailDto } from '../../../core/models/dispute.models';

@Component({
  selector: 'app-dispute-detail',
  templateUrl: './dispute-detail.component.html',
  styleUrls: ['./dispute-detail.component.scss'],
  standalone: false,
})
export class DisputeDetailComponent implements OnInit {
  dispute: DisputeDetailDto | null = null;
  loading = true;

  constructor(private route: ActivatedRoute, private disputeService: DisputeService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.disputeService.getMineById(id).subscribe({
      next: d => { this.dispute = d; this.loading = false; },
      error: () => { this.dispute = null; this.loading = false; }
    });
  }

  get isResolved(): boolean {
    return !!this.dispute && (this.dispute.status === 'Resolved' || this.dispute.status === 'Escalated');
  }
}
