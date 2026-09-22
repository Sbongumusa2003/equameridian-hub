export interface PolicySection {
  heading: string;
  body: string[];
}

export interface PolicyDocument {
  key: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: PolicySection[];
}

// NOTE: This is starter/boilerplate legal content written to close the "empty page" gap.
// It has NOT been reviewed by a lawyer and must not go live as-is — get it checked against
// South African consumer-protection and e-commerce law (CPA, ECTA) before launch, and have
// Admin confirm the actual commission rate, cancellation window, and dispute process match
// what's implemented (48-hour fee window, RFQ + Fixed pricing, etc.).

export const TERMS_OF_SERVICE: PolicyDocument = {
  key: 'terms',
  title: 'Terms of Service',
  lastUpdated: 'Draft — pending legal review',
  intro:
    'These Terms of Service govern your use of the EquaMeridian Hub platform, which connects ' +
    'Contractors seeking construction and industrial machinery with Suppliers who list that ' +
    'machinery for hire. By creating an account or using the platform, you agree to these Terms.',
  sections: [
    {
      heading: '1. The Platform\'s Role',
      body: [
        'EquaMeridian Hub is a marketplace. We connect Contractors and Suppliers and provide the ' +
        'tools to browse listings, request quotes or book machinery directly, sign lease agreements, ' +
        'process payments, and manage disputes.',
        'We are not a party to the rental agreement itself — that agreement is between the Contractor ' +
        'and the Supplier, formalised through the Master Lease Agreement each booking generates.'
      ]
    },
    {
      heading: '2. Accounts',
      body: [
        'You must provide accurate registration information and keep your account credentials ' +
        'confidential. You are responsible for all activity under your account.',
        'Suppliers may be required to complete a verification process before listings become visible ' +
        'to Contractors.'
      ]
    },
    {
      heading: '3. Listings and Pricing',
      body: [
        'Suppliers may list machinery at a Fixed rate (bookable instantly) or as Request-for-Quote ' +
        '(requiring a negotiated quote before a booking is created). Listed rates, availability, and ' +
        'descriptions are the Supplier\'s responsibility and must be accurate.',
        'A platform commission is deducted from the amount a Contractor pays before the remainder is ' +
        'paid out to the Supplier. The current commission percentage is shown to Suppliers on each ' +
        'invoice.'
      ]
    },
    {
      heading: '4. Bookings, Payment, and Cancellation',
      body: [
        'A booking becomes binding once a lease agreement is signed and, where required, payment is ' +
        'made. Cancellation is permitted before the machinery has been handed over; cancellations made ' +
        'within 48 hours of the scheduled rental start may incur a cancellation fee, as noted on the ' +
        'lease agreement.',
        'Once machinery has been delivered or collected, a booking can no longer be cancelled — issues ' +
        'from that point are handled through a Return Request or a Dispute.'
      ]
    },
    {
      heading: '5. Disputes',
      body: [
        'Either party to a booking may raise a dispute if something goes wrong. Only one dispute may ' +
        'be open at a time per booking; further concerns about the same booking should be added to the ' +
        'existing dispute until it is resolved.',
        'Admin reviews and resolves disputes and may involve both parties in that process.'
      ]
    },
    {
      heading: '6. Limitation of Liability',
      body: [
        'EquaMeridian Hub is not liable for the condition, safety, or fitness for purpose of any listed ' +
        'machinery, nor for the acts or omissions of Contractors or Suppliers. Machinery-specific ' +
        'liability and insurance terms are set out in each booking\'s Master Lease Agreement.'
      ]
    },
    {
      heading: '7. Changes to These Terms',
      body: [
        'We may update these Terms from time to time. Continued use of the platform after an update ' +
        'constitutes acceptance of the revised Terms.'
      ]
    }
  ]
};

export const PRIVACY_POLICY: PolicyDocument = {
  key: 'privacy',
  title: 'Privacy Policy',
  lastUpdated: 'Draft — pending legal review',
  intro:
    'This Privacy Policy explains what personal information EquaMeridian Hub collects, why we ' +
    'collect it, and how it is used and protected.',
  sections: [
    {
      heading: '1. Information We Collect',
      body: [
        'Account information: name, email address, phone number, and role (Contractor, Supplier, or ' +
        'Admin).',
        'Transactional information: bookings, quotations, lease agreements, invoices, payment status, ' +
        'delivery addresses, disputes, and reviews you submit.',
        'Verification and business information Suppliers provide as part of onboarding.'
      ]
    },
    {
      heading: '2. How We Use Information',
      body: [
        'To operate the marketplace: matching Contractors with listings, processing quotations and ' +
        'bookings, generating invoices, and facilitating payment.',
        'To communicate with you about your bookings, disputes, and account.',
        'To maintain audit records of platform activity for security, dispute resolution, and legal ' +
        'compliance.'
      ]
    },
    {
      heading: '3. Who Can See What',
      body: [
        'Contractors and Suppliers can see each other\'s name and relevant booking details for ' +
        'bookings they share, and the delivery address associated with a booking.',
        'Financial details such as platform commission and Supplier payout amounts are visible only ' +
        'to the Supplier and to Admin — not to the Contractor.',
        'Admin can access platform data as needed for dispute resolution, fraud prevention, and legal ' +
        'compliance.'
      ]
    },
    {
      heading: '4. Data Retention',
      body: [
        'We retain account and transaction records for as long as your account is active and for a ' +
        'period afterward as required for accounting, tax, and legal purposes.'
      ]
    },
    {
      heading: '5. Your Rights',
      body: [
        'You may request access to, correction of, or deletion of your personal information, subject ' +
        'to our legal and contractual record-keeping obligations. Contact Admin support to make a ' +
        'request.'
      ]
    },
    {
      heading: '6. Security',
      body: [
        'We apply reasonable technical and organisational measures to protect your information, but no ' +
        'system is completely secure. Please use a strong, unique password for your account.'
      ]
    }
  ]
};

export const MASTER_LEASE_AGREEMENT: PolicyDocument = {
  key: 'mla',
  title: 'Master Lease Agreement',
  lastUpdated: 'Draft — pending legal review',
  intro:
    'This Master Lease Agreement ("MLA") sets out the standard terms that apply to every rental ' +
    'booking made through EquaMeridian Hub between a Contractor and a Supplier, in addition to any ' +
    'booking-specific terms shown on the individual lease agreement for that booking.',
  sections: [
    {
      heading: '1. Scope',
      body: [
        'This MLA applies to the hire of the machinery described in a specific booking, for the rental ' +
        'period, rate, and delivery method agreed at booking. Where booking-specific terms conflict ' +
        'with this MLA, the booking-specific terms take precedence for that booking only.'
      ]
    },
    {
      heading: '2. Delivery and Collection',
      body: [
        'Machinery is delivered by the Supplier or collected by the Contractor, as selected at ' +
        'booking. The Contractor is responsible for confirming delivery/collection through the ' +
        'platform once machinery is received.',
        'Risk in the machinery passes to the Contractor on delivery or collection and remains with the ' +
        'Contractor until the Supplier confirms its return.'
      ]
    },
    {
      heading: '3. Use of Machinery',
      body: [
        'The Contractor agrees to use the machinery only for its intended purpose, operate it safely ' +
        'and in accordance with any manufacturer guidance, and not sub-lease it to a third party ' +
        'without the Supplier\'s written consent.'
      ]
    },
    {
      heading: '4. Liability and Insurance',
      body: [
        'The Contractor is liable for loss of or damage to the machinery while in their care, fair ' +
        'wear and tear excepted. Where insurance is required for the machinery category, the ' +
        'Contractor must maintain adequate cover for the rental period.'
      ]
    },
    {
      heading: '5. Return',
      body: [
        'The Contractor must request a return through the platform at the end of the rental period (or ' +
        'return directly to the Supplier for self-collection bookings). The booking is not complete ' +
        'until the Supplier confirms the machinery has been returned in acceptable condition.'
      ]
    },
    {
      heading: '6. Cancellation Policy',
      body: [
        'Bookings may be cancelled by either party before delivery or collection has taken place. ' +
        'Cancellations made within 48 hours of the scheduled rental start date may incur a ' +
        'cancellation fee, to be assessed by Admin.',
        'Once machinery has been delivered or collected, the booking can no longer be cancelled under ' +
        'this clause — see Dispute Resolution below.'
      ]
    },
    {
      heading: '7. Dispute Resolution',
      body: [
        'Any dispute concerning a booking under this MLA should be raised through the platform\'s ' +
        'dispute process by either party. Only one dispute may be open per booking at a time.'
      ]
    }
  ]
};

export const POLICY_DOCUMENTS: Record<string, PolicyDocument> = {
  terms: TERMS_OF_SERVICE,
  privacy: PRIVACY_POLICY,
  mla: MASTER_LEASE_AGREEMENT
};
