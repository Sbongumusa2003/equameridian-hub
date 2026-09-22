import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { POLICY_DOCUMENTS, PolicyDocument } from '../../policy-content';

@Component({
  selector: 'app-policy-page',
  templateUrl: './policy-page.component.html',
  styleUrls: ['./policy-page.component.scss'],
  standalone: false,
})
export class PolicyPageComponent implements OnInit {
  document: PolicyDocument | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Read once per navigation via route data (set per-route in app-routing.module.ts) rather
    // than a :param, so each policy still gets its own bookmarkable, indexable URL.
    this.route.data.subscribe(data => {
      const key = data['policyKey'] as string;
      this.document = POLICY_DOCUMENTS[key] ?? null;
    });
  }
}
