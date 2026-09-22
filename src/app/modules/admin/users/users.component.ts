import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';
import { UserDto } from '../../../core/models/user.models';
import { RoleService } from '../../../core/services/role.service';
import { RoleDto } from '../../../core/models/role.models';
import {
  DocumentService,
  DocumentReviewListItemDto,
  RequiredDocumentStatusDto
} from '../../../core/services/document.service';
import { environment } from '../../../../environments/environment';

export interface AuditLogEntry {
  auditID: number;
  transactionType: string;
  description: string;
  timestamp: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: false,
})
export class UsersComponent implements OnInit, OnDestroy {
  users: UserDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  search = '';
  roleFilter = '';
  statusFilter = '';
  loading = false;

  selectedUser: UserDto | null = null;
  showManageModal = false;
  manageTab: 'overview' | 'documents' | 'audit' = 'overview';
  auditLogs: AuditLogEntry[] = [];
  loadingAudit = false;
  statusError = '';

  // --- Document review (folded into Manage modal) ---
  documents: DocumentReviewListItemDto[] = [];
  checklist: RequiredDocumentStatusDto[] = [];
  allRequiredApproved = false;
  loadingDocuments = false;
  reviewingDocId: number | null = null;
  rejectingDocId: number | null = null;
  rejectReason = '';
  docMessage = '';
  docError = '';
  readonly fileBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  // --- Create internal (admin) user ---
  showCreateModal = false;
  createForm = { fullName: '', email: '', role: 'admin' };
  creatingUser = false;
  createError = '';
  createSuccess = '';

  // --- Change role (assign into 'admin' or a custom role) ---
  assignableRoles: RoleDto[] = [];
  selectedRoleName = '';
  changingRole = false;
  roleChangeError = '';
  roleChangeMessage = '';

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(
    private userService: UserService,
    private documentService: DocumentService,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(value => {
      this.search = value;
      this.page = 1;
      this.load();
    });

    this.load();

    this.roleService.getAll().subscribe({
      next: roles => this.assignableRoles = roles.filter(r => r.roleName.toLowerCase() !== 'supplier'
                                                            && r.roleName.toLowerCase() !== 'contractor'),
      error: () => { this.assignableRoles = []; }
    });
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  load() {
    this.loading = true;
    this.userService.getAll({
      search: this.search,
      role: this.roleFilter,
      status: this.statusFilter,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe(res => {
      this.users = res.users ?? [];
      this.totalCount = res.totalCount;
      this.loading = false;
    });
  }

  onSearch(value: string) {
    this.searchSubject.next(value);
  }

  openCreateUser() {
    this.showCreateModal = true;
    this.createForm = { fullName: '', email: '', role: 'admin' };
    this.createError = '';
    this.createSuccess = '';
  }

  closeCreateUser() {
    this.showCreateModal = false;
  }

  submitCreateUser() {
    if (!this.createForm.fullName || !this.createForm.email) return;
    this.creatingUser = true;
    this.createError = '';
    this.userService.createInternalUser(this.createForm).subscribe({
      next: () => {
        this.creatingUser = false;
        this.createSuccess = `Account created for ${this.createForm.email}. A temporary password has been emailed to them.`;
        this.load();
      },
      error: err => {
        this.creatingUser = false;
        this.createError = err?.error?.message ?? 'Could not create the account.';
      }
    });
  }

  openManage(user: UserDto) {
    this.selectedUser = user;
    this.showManageModal = true;
    this.manageTab = 'overview';
    this.statusError = '';
    this.selectedRoleName = user.role;
    this.roleChangeError = '';
    this.roleChangeMessage = '';
    this.loadAuditLog(user.userID);
    // Admins and other internal/company-side roles are never required to
    // upload verification documents, so don't fetch or show that panel for them.
    if (this.isDocGatedRole(user.role)) {
      this.loadDocuments(user.userID);
    } else {
      this.documents = [];
      this.checklist = [];
      this.allRequiredApproved = false;
    }
  }

  closeManage() {
    this.showManageModal = false;
    this.selectedUser = null;
    this.manageTab = 'overview';
    this.auditLogs = [];
    this.documents = [];
    this.checklist = [];
    this.rejectingDocId = null;
    this.docMessage = '';
    this.docError = '';
    this.roleChangeError = '';
    this.roleChangeMessage = '';
  }

  private isDocGatedRole(role: string): boolean {
    const r = role.toLowerCase();
    return r === 'supplier' || r === 'contractor';
  }

  get selectedUserRequiresDocuments(): boolean {
    return !!this.selectedUser && this.isDocGatedRole(this.selectedUser.role);
  }

  get canChangeSelectedUserRole(): boolean {
    if (!this.selectedUser) return false;
    const role = this.selectedUser.role.toLowerCase();
    return role !== 'supplier' && role !== 'contractor';
  }

  changeRole() {
    if (!this.selectedUser || !this.selectedRoleName) return;
    this.changingRole = true;
    this.roleChangeError = '';
    this.roleChangeMessage = '';

    this.userService.changeRole(this.selectedUser.userID, this.selectedRoleName).subscribe({
      next: () => {
        this.changingRole = false;
        this.roleChangeMessage = `Role updated to ${this.selectedRoleName}.`;
        if (this.selectedUser) {
          this.selectedUser = { ...this.selectedUser, role: this.selectedRoleName };
          this.loadAuditLog(this.selectedUser.userID);
        }
        this.load();
      },
      error: err => {
        this.changingRole = false;
        this.roleChangeError = err?.error?.message ?? 'Could not update this user\'s role.';
      }
    });
  }

  loadAuditLog(userId: number) {
    this.loadingAudit = true;
    this.auditLogs = [];
    this.userService.getAuditLog(userId).subscribe({
      next: logs => {
        this.auditLogs = logs;
        this.loadingAudit = false;
      },
      error: () => { this.loadingAudit = false; }
    });
  }

  // --- Documents (part of the Manage modal — not a separate tab) ---

  loadDocuments(userId: number) {
    this.loadingDocuments = true;
    this.documentService.adminGetAll({ userId, page: 1, pageSize: 50 }).subscribe({
      next: res => {
        this.documents = res.documents ?? [];
        this.loadingDocuments = false;
      },
      error: () => { this.loadingDocuments = false; }
    });

    this.documentService.adminGetChecklist(userId).subscribe({
      next: res => {
        this.checklist = res.checklist ?? [];
        this.allRequiredApproved = res.allRequiredApproved;
      },
      error: () => { this.checklist = []; this.allRequiredApproved = false; }
    });
  }

  viewDocument(docId: number) {
    this.documentService.adminGetById(docId).subscribe({
      next: doc => window.open(`${this.fileBaseUrl}${doc.filePath}`, '_blank'),
      error: () => { this.docError = 'Could not open this document.'; }
    });
  }

  approveDocument(docId: number) {
    this.reviewDocument(docId, 'Accepted');
  }

  startReject(docId: number) {
    this.rejectingDocId = docId;
    this.rejectReason = '';
    this.docError = '';
  }

  cancelReject() {
    this.rejectingDocId = null;
    this.rejectReason = '';
  }

  confirmReject(docId: number) {
    if (!this.rejectReason.trim()) {
      this.docError = 'Please provide a reason for rejecting this document.';
      return;
    }
    this.reviewDocument(docId, 'Rejected', this.rejectReason.trim());
  }

  private reviewDocument(docId: number, decision: 'Accepted' | 'Rejected', reason?: string) {
    this.reviewingDocId = docId;
    this.docMessage = '';
    this.docError = '';

    this.documentService.adminReview(docId, decision, reason).subscribe({
      next: (res: any) => {
        this.reviewingDocId = null;
        this.rejectingDocId = null;
        this.docMessage = res?.accountActivated
          ? `Document ${decision.toLowerCase()}. All required documents are now approved — the account has been activated.`
          : `Document ${decision.toLowerCase()}.`;
        if (this.selectedUser) this.loadDocuments(this.selectedUser.userID);
        this.load();
      },
      error: err => {
        this.reviewingDocId = null;
        this.docError = err?.error?.message ?? 'Could not review this document. Please try again.';
      }
    });
  }

  // --- Account status ---

  onStatusChange(userId: number, newStatus: string) {
    this.statusError = '';
    this.userService.updateStatus(userId, { newStatus }).subscribe({
      next: () => {
        this.load();
        if (this.selectedUser && this.selectedUser.userID === userId) {
          this.selectedUser = { ...this.selectedUser, accountStatus: newStatus };
          this.loadAuditLog(userId);
        }
      },
      error: err => {
        this.statusError = err?.error?.message ?? 'Could not update account status. Please try again.';
      }
    });
  }

  get canActivateSelectedUser(): boolean {
    if (!this.selectedUser) return false;
    return !this.isDocGatedRole(this.selectedUser.role) || this.allRequiredApproved;
  }

  get totalPages(): number { return Math.ceil(this.totalCount / this.pageSize); }
}