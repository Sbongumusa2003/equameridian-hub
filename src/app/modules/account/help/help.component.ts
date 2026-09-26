import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HelpService, HelpSection } from '../../../core/services/help.service';

/**
 * Full Help document (rubric: "6. Help" — the "complete help document" + its search facility).
 * Reached from the sidebar "Help" link and the topbar "?" control (both open this same route),
 * and linked into from every <app-context-help> popover across the app via ?section=<id>.
 */
@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
  standalone: false,
})
export class HelpComponent implements OnInit {
  query = '';
  results: HelpSection[] = [];
  activeSectionId: string | null = null;

  constructor(private help: HelpService, private route: ActivatedRoute) {}

  get categories(): string[] {
    return Array.from(new Set(this.results.map(s => s.category)));
  }

  ngOnInit() {
    this.results = this.help.search('');
    this.route.queryParams.subscribe(params => {
      if (params['section']) {
        this.activeSectionId = params['section'];
        setTimeout(() => {
          document.getElementById('help-' + params['section'])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    });
  }

  onSearch() {
    this.results = this.help.search(this.query);
  }

  sectionsFor(category: string): HelpSection[] {
    return this.results.filter(s => s.category === category);
  }
}
