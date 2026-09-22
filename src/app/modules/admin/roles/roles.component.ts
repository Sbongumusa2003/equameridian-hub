import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../../core/services/role.service';
import { RoleDto, PermissionDto } from '../../../core/models/role.models';

@Component({
  selector: 'app-admin-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
  standalone: false,
})
export class AdminRolesComponent implements OnInit {
  roles: RoleDto[] = [];
  allPermissions: PermissionDto[] = [];
  loading = false;
  error = '';
  message = '';

  editingRole: RoleDto | null = null;
  editPermissionKeys: Set<string> = new Set();
  saving = false;

  showCreateModal = false;
  createForm = { roleName: '', description: '' };
  createPermissionKeys: Set<string> = new Set();
  creating = false;
  createError = '';

  deleteTarget: RoleDto | null = null;
  deleting = false;

  constructor(private roleService: RoleService) {}

  ngOnInit() {
    this.load();
    this.roleService.getAllPermissions().subscribe({
      next: perms => this.allPermissions = perms,
      error: () => {}
    });
  }

  load() {
    this.loading = true;
    this.roleService.getAll().subscribe({
      next: roles => { this.roles = roles; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openEdit(role: RoleDto) {
    this.editingRole = role;
    this.editPermissionKeys = new Set(role.permissionKeys);
    this.error = '';
  }

  closeEdit() { this.editingRole = null; }

  toggleEditPermission(key: string) {
    if (this.editPermissionKeys.has(key)) this.editPermissionKeys.delete(key);
    else this.editPermissionKeys.add(key);
  }

  saveEdit() {
    if (!this.editingRole) return;
    this.saving = true;
    this.error = '';
    this.roleService.updatePermissions(this.editingRole.roleID, {
      permissionKeys: Array.from(this.editPermissionKeys)
    }).subscribe({
      next: () => {
        this.saving = false;
        this.message = `Permissions updated for ${this.editingRole?.roleName}.`;
        this.editingRole = null;
        this.load();
      },
      error: err => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Could not save permissions.';
      }
    });
  }

  openCreate() {
    this.showCreateModal = true;
    this.createForm = { roleName: '', description: '' };
    this.createPermissionKeys = new Set();
    this.createError = '';
  }

  closeCreate() { this.showCreateModal = false; }

  toggleCreatePermission(key: string) {
    if (this.createPermissionKeys.has(key)) this.createPermissionKeys.delete(key);
    else this.createPermissionKeys.add(key);
  }

  submitCreate() {
    if (!this.createForm.roleName.trim()) return;
    this.creating = true;
    this.createError = '';
    this.roleService.create({
      roleName: this.createForm.roleName.trim(),
      description: this.createForm.description.trim(),
      permissionKeys: Array.from(this.createPermissionKeys)
    }).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateModal = false;
        this.message = 'Role created.';
        this.load();
      },
      error: err => {
        this.creating = false;
        this.createError = err?.error?.message ?? 'Could not create the role.';
      }
    });
  }

  openDelete(role: RoleDto) { this.deleteTarget = role; }
  closeDelete() { this.deleteTarget = null; }

  confirmDelete() {
    if (!this.deleteTarget) return;
    this.deleting = true;
    this.roleService.delete(this.deleteTarget.roleID).subscribe({
      next: () => {
        this.deleting = false;
        this.message = `Role "${this.deleteTarget?.roleName}" deleted.`;
        this.deleteTarget = null;
        this.load();
      },
      error: err => {
        this.deleting = false;
        this.error = err?.error?.message ?? 'Could not delete this role.';
        this.deleteTarget = null;
      }
    });
  }
}
