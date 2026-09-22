import { Component, OnInit } from '@angular/core';
import { ContentRulesService, BlockedTermDto } from '../../../core/services/content-rules.service';

@Component({
  selector: 'app-admin-content-rules',
  templateUrl: './content-rules.component.html',
  styleUrls: ['./content-rules.component.scss'],
  standalone: false,
})
export class AdminContentRulesComponent implements OnInit {
  terms: BlockedTermDto[] = [];
  loading = false;
  newTerm = '';
  adding = false;
  removingId: number | null = null;
  error = '';
  message = '';

  constructor(private contentRulesService: ContentRulesService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.contentRulesService.getAll().subscribe({
      next: terms => { this.terms = terms; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  addTerm() {
    const term = this.newTerm.trim();
    if (!term) return;
    this.adding = true;
    this.error = '';
    this.message = '';
    this.contentRulesService.add(term).subscribe({
      next: () => {
        this.adding = false;
        this.newTerm = '';
        this.message = 'Term added.';
        this.load();
      },
      error: err => {
        this.adding = false;
        this.error = err?.error?.message ?? 'Could not add this term.';
      }
    });
  }

  removeTerm(blockedTermId: number) {
    this.removingId = blockedTermId;
    this.error = '';
    this.message = '';
    this.contentRulesService.remove(blockedTermId).subscribe({
      next: () => {
        this.removingId = null;
        this.message = 'Term removed.';
        this.load();
      },
      error: err => {
        this.removingId = null;
        this.error = err?.error?.message ?? 'Could not remove this term.';
      }
    });
  }
}
