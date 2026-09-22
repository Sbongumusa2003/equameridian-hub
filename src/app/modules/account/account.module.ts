import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { RoleGuard } from '../../core/guards/role.guard';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { DocumentsComponent } from './documents/documents.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { MessagesComponent } from './messages/messages.component';
import { ThreadDetailComponent } from './messages/thread-detail/thread-detail.component';
import { HelpComponent } from './help/help.component';

const routes: Routes = [
  { path: 'profile',   component: MyProfileComponent },
  {
    path: 'documents',
    component: DocumentsComponent,
    canActivate: [RoleGuard],
    data: { roles: ['supplier', 'contractor'] }
  },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'messages', component: MessagesComponent },
  { path: 'messages/:threadId', component: ThreadDetailComponent },
  { path: 'help', component: HelpComponent },
  { path: '', redirectTo: 'profile', pathMatch: 'full' }
];

@NgModule({
  declarations: [MyProfileComponent, DocumentsComponent, NotificationsComponent, MessagesComponent, ThreadDetailComponent, HelpComponent],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class AccountModule {}