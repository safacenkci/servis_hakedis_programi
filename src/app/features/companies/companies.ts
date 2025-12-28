import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CompanyService } from '../../core/services/company.service';
import { Company } from '../../core/models/database.types';
import { SupabaseService } from '../../core/services/supabase.service';
import { ContractService } from '../../core/services/contract.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    TooltipModule
  ],
  templateUrl: './companies.html',
  styleUrl: './companies.css'
})
export class Companies implements OnInit {
  companies: Company[] = [];
  companyDialog: boolean = false;
  deleteDialog: boolean = false;
  dependencyDialog: boolean = false;
  companyDependencies: { contracts: any[] } = { contracts: [] };
  companyToDelete: Company | null = null;

  companyForm: FormGroup;
  selectedCompany: Company | null = null;
  submitted: boolean = false;
  loading: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private companyService: CompanyService,
    private contractService: ContractService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private supabaseService: SupabaseService
  ) {
    this.companyForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      address: ['']
    });
  }

  async ngOnInit() {
    this.isAdmin = await this.supabaseService.isAdmin();
    await this.loadCompanies();
  }

  async loadCompanies() {
    this.loading = true;
    try {
      this.companies = await this.companyService.getCompanies();
      this.cdr.markForCheck();
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'companies',
        severity: 'error', 
        summary: 'Hata', 
        detail: this.getErrorMessage(error),
        life: 4000
      });
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  openNew() {
    this.companyForm.reset();
    this.selectedCompany = null;
    this.submitted = false;
    this.companyDialog = true;
  }

  editCompany(company: Company) {
    this.selectedCompany = company;
    this.companyForm.patchValue(company);
    this.companyDialog = true;
  }

  async deleteCompany(company: Company) {
    this.selectedCompany = company;
    
    // Önce bağlı kayıtları kontrol et - hızlı kontrol
    try {
      const dependencies = await this.companyService.checkCompanyDependencies(company.id);
      
      if (dependencies.contracts.length > 0) {
        // Bağlı kayıtlar var - detayları göster
        this.companyDependencies = dependencies;
        this.companyToDelete = company;
        this.dependencyDialog = true;
        this.cdr.detectChanges(); // Change detection'ı tetikle
        return;
      }
    } catch (error: any) {
      console.error('Check dependencies error:', error);
      // Kontrol hatası - yine de silmeyi dene
    }

    // Bağlı kayıt yoksa direkt sil
    this.confirmDeleteCompany(company);
  }

  confirmDeleteCompany(company: Company) {
    this.confirmationService.confirm({
      message: `${company.name} şirketini silmek istediğinize emin misiniz?`,
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: async () => {
        try {
          await this.companyService.deleteCompany(company.id);
          this.companies = this.companies.filter(val => val.id !== company.id);
          this.messageService.clear();
          this.messageService.add({ 
            key: 'companies',
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Şirket silindi', 
            life: 3000 
          });
        } catch (error: any) {
          console.error('Delete company error:', error); // Debug için
          this.messageService.clear();
          this.messageService.add({ 
            key: 'companies',
            severity: 'error', 
            summary: 'Hata', 
            detail: this.getErrorMessage(error),
            life: 5000
          });
        }
        this.selectedCompany = null;
      }
    });
  }

  closeDependencyDialog() {
    this.dependencyDialog = false;
    this.companyDependencies = { contracts: [] };
    this.companyToDelete = null;
  }

  confirmDeleteCompanyFromDialog() {
    if (this.companyToDelete) {
      this.closeDependencyDialog();
      this.confirmDeleteCompany(this.companyToDelete);
    }
  }

  async deleteCompanyFromDialog() {
    if (!this.companyToDelete) return;
    
    try {
      await this.companyService.deleteCompany(this.companyToDelete.id);
      this.companies = this.companies.filter(val => val.id !== this.companyToDelete!.id);
      this.closeDependencyDialog();
      this.messageService.clear();
      this.messageService.add({ 
        key: 'companies',
        severity: 'success', 
        summary: 'Başarılı', 
        detail: 'Şirket silindi', 
        life: 3000 
      });
    } catch (error: any) {
      console.error('Delete company error:', error);
      this.messageService.clear();
      this.messageService.add({ 
        key: 'companies',
        severity: 'error', 
        summary: 'Hata', 
        detail: this.getErrorMessage(error),
        life: 5000
      });
    }
  }

  async deleteContractFromDialog(contract: any) {
    this.confirmationService.confirm({
      message: `Bu sözleşmeyi silmek istediğinize emin misiniz?`,
      header: 'Sözleşme Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: async () => {
        try {
          await this.contractService.deleteContract(contract.id);
          // Bağlı kayıtları yeniden yükle
          if (this.companyToDelete) {
            const dependencies = await this.companyService.checkCompanyDependencies(this.companyToDelete.id);
            this.companyDependencies = dependencies;
            this.cdr.detectChanges();
            
            // Eğer tüm bağlı kayıtlar silindiyse, pop-up içinde silme onayı göster
            // Pop-up açık kalacak, kullanıcı pop-up içinden onaylayacak
          }
          this.messageService.clear();
          this.messageService.add({ 
            key: 'companies',
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Sözleşme silindi', 
            life: 3000 
          });
        } catch (error: any) {
          this.messageService.clear();
          this.messageService.add({ 
            key: 'companies',
            severity: 'error', 
            summary: 'Hata', 
            detail: this.getErrorMessage(error),
            life: 5000
          });
        }
      }
    });
  }

  async saveCompany() {
    this.submitted = true;

    if (this.companyForm.invalid) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'companies',
        severity: 'warn', 
        summary: 'Uyarı', 
        detail: 'Lütfen şirket adını girin.', 
        life: 3000
      });
      return;
    }

    const companyData = this.companyForm.value;

    // Remove id from payload if it's null (for insert)
    if (!companyData.id) {
      delete companyData.id;
    }

    try {
      const result = await this.companyService.upsertCompany(companyData);

      this.companyDialog = false;
      this.submitted = false;
      this.loadCompanies(); // Reload to refresh list
      this.messageService.clear();
      this.messageService.add({ 
        key: 'companies',
        severity: 'success', 
        summary: 'Başarılı', 
        detail: this.selectedCompany ? 'Şirket güncellendi' : 'Şirket eklendi', 
        life: 3000 
      });
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'companies',
        severity: 'error', 
        summary: 'Hata', 
        detail: this.getErrorMessage(error),
        life: 4000
      });
    }
  }

  private getErrorMessage(error: any): string {
    if (!error) return 'Bilinmeyen bir hata oluştu.';
    
    // Error objesi içinden mesajı çıkar
    const errorMessage = error.message || error.details || error.toString() || '';
    
    // Eğer error mesajı zaten Türkçe ve açıklayıcıysa direkt döndür
    if (errorMessage.includes('bağlı kayıtlar') || errorMessage.includes('bağlı sözleşmeler')) {
      return errorMessage;
    }
    
    // Supabase hata mesajlarını Türkçe'ye çevir
    if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
      return 'Bu şirket adı zaten mevcut. Lütfen farklı bir isim deneyin.';
    }
    if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key') || errorMessage.includes('23503')) {
      return 'Bu şirkete bağlı sözleşmeler bulunmaktadır. Önce sözleşmeleri siliniz.';
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
    }
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorMessage.includes('policy') || errorMessage.includes('row-level security') || errorMessage.includes('yetkiniz')) {
      return errorMessage.includes('yetkiniz') 
        ? errorMessage 
        : 'Bu işlem için yetkiniz bulunmamaktadır. Lütfen admin yetkilerinizi kontrol edin.';
    }
    
    // Eğer hata mesajı boşsa veya anlamsızsa
    if (!errorMessage || errorMessage.trim() === '') {
      return 'Şirket silinirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
    }
    
    return errorMessage;
  }

  hideDialog() {
    this.companyDialog = false;
    this.submitted = false;
  }
}

