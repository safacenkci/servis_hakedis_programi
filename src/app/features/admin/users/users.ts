import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';

import { SupabaseService } from '../../../core/services/supabase.service';
import { Profile } from '../../../core/models/database.types';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    DatePickerModule,
    SelectModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ToolbarModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  users: Profile[] = [];
  filteredUsers: Profile[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  
  // Dialog
  showEditDialog: boolean = false;
  selectedUser: Profile | null = null;
  
  // Form
  editForm = {
    full_name: '',
    email: '',
    role: 'user',
    is_approved: false,
    subscription_active: false,
    subscription_expires_at: null as Date | null
  };

  roles = [
    { label: 'Kullanıcı', value: 'user' },
    { label: 'Admin', value: 'admin' }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    try {
      this.users = await this.supabaseService.getAllProfiles();
      this.filteredUsers = [...this.users];
      this.messageService.clear();
    } catch (error: any) {
      this.messageService.add({
        key: 'users',
        severity: 'error',
        summary: 'Hata',
        detail: this.getErrorMessage(error),
        life: 4000
      });
    } finally {
      this.loading = false;
    }
  }

  filterUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.email?.toLowerCase().includes(term) ||
      user.full_name?.toLowerCase().includes(term)
    );
  }

  openEditDialog(user: Profile) {
    this.selectedUser = user;
    this.editForm = {
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'user',
      is_approved: user.is_approved || false,
      subscription_active: user.subscription_active || false,
      subscription_expires_at: user.subscription_expires_at 
        ? new Date(user.subscription_expires_at) 
        : null
    };
    this.showEditDialog = true;
  }

  closeEditDialog() {
    this.showEditDialog = false;
    this.selectedUser = null;
  }

  async saveUser() {
    if (!this.selectedUser) return;

    try {
      const updates: Partial<Profile> = {
        full_name: this.editForm.full_name,
        role: this.editForm.role,
        is_approved: this.editForm.is_approved,
        subscription_active: this.editForm.subscription_active,
        subscription_expires_at: this.editForm.subscription_expires_at 
          ? this.editForm.subscription_expires_at.toISOString() 
          : undefined
      };

      await this.supabaseService.updateUserProfile(this.selectedUser.id, updates);
      
      this.messageService.clear();
      this.messageService.add({
        key: 'users',
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Kullanıcı bilgileri güncellendi.',
        life: 3000
      });

      this.closeEditDialog();
      await this.loadUsers();
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({
        key: 'users',
        severity: 'error',
        summary: 'Hata',
        detail: this.getErrorMessage(error),
        life: 4000
      });
    }
  }

  async approveUser(user: Profile) {
    this.confirmationService.confirm({
      message: `${user.email} adresli kullanıcıyı onaylamak istediğinize emin misiniz?`,
      header: 'Kullanıcı Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      accept: async () => {
        try {
          await this.supabaseService.approveUser(user.id);
          this.messageService.clear();
          this.messageService.add({
            key: 'users',
            severity: 'success',
            summary: 'Başarılı',
            detail: 'Kullanıcı onaylandı.',
            life: 3000
          });
          await this.loadUsers();
        } catch (error: any) {
          this.messageService.clear();
          this.messageService.add({
            key: 'users',
            severity: 'error',
            summary: 'Hata',
            detail: this.getErrorMessage(error),
            life: 4000
          });
        }
      }
    });
  }

  async rejectUser(user: Profile) {
    this.confirmationService.confirm({
      message: `${user.email} adresli kullanıcının onayını kaldırmak istediğinize emin misiniz?`,
      header: 'Onayı Kaldır',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      accept: async () => {
        try {
          await this.supabaseService.rejectUser(user.id);
          this.messageService.clear();
          this.messageService.add({
            key: 'users',
            severity: 'success',
            summary: 'Başarılı',
            detail: 'Kullanıcı onayı kaldırıldı.',
            life: 3000
          });
          await this.loadUsers();
        } catch (error: any) {
          this.messageService.clear();
          this.messageService.add({
            key: 'users',
            severity: 'error',
            summary: 'Hata',
            detail: this.getErrorMessage(error),
            life: 4000
          });
        }
      }
    });
  }

  getStatusSeverity(user: Profile): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    if (!user.is_approved) return 'danger';
    if (user.subscription_active) {
      if (user.subscription_expires_at) {
        const expiry = new Date(user.subscription_expires_at);
        if (expiry < new Date()) return 'warn';
      }
      return 'success';
    }
    return 'info';
  }

  getStatusLabel(user: Profile): string {
    if (!user.is_approved) return 'Onay Bekliyor';
    if (user.subscription_active) {
      if (user.subscription_expires_at) {
        const expiry = new Date(user.subscription_expires_at);
        if (expiry < new Date()) return 'Abonelik Süresi Dolmuş';
        return 'Aktif';
      }
      return 'Aktif (Süresiz)';
    }
    return 'Onaylı (Abonelik Yok)';
  }

  getRoleLabel(role?: string): string {
    return role === 'admin' ? 'Admin' : 'Kullanıcı';
  }

  getRoleSeverity(role?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    return role === 'admin' ? 'danger' : 'info';
  }

  getErrorMessage(error: any): string {
    if (error?.message) {
      const msg = error.message.toLowerCase();
      if (msg.includes('permission') || msg.includes('policy')) {
        return 'Bu işlem için yetkiniz yok.';
      }
      if (msg.includes('network') || msg.includes('fetch')) {
        return 'Bağlantı hatası. Lütfen tekrar deneyin.';
      }
      return error.message;
    }
    return 'Beklenmeyen bir hata oluştu.';
  }
}

