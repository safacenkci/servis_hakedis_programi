import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ContractService } from '../../core/services/contract.service';
import { CompanyService } from '../../core/services/company.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { Contract, Company, Vehicle } from '../../core/models/database.types';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule
  ],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css',
})
export class Contracts implements OnInit {
  contracts: Contract[] = [];
  companies: Company[] = [];
  vehicles: Vehicle[] = [];

  contractDialog: boolean = false;
  contractForm: FormGroup;
  selectedContract: Contract | null = null;
  submitted: boolean = false;
  loading: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private contractService: ContractService,
    private companyService: CompanyService,
    private vehicleService: VehicleService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private supabaseService: SupabaseService
  ) {
    this.contractForm = this.fb.group({
      id: [null],
      company_id: [null, Validators.required],
      vehicle_id: [null], // Optional (null = all vehicles)
      daily_rate: [null, Validators.required],
      overtime_rate: [0],
      start_date: [null, Validators.required],
      end_date: [null]
    });
  }

  async ngOnInit() {
    this.isAdmin = await this.supabaseService.isAdmin();
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      // Fetch dropdown data first then contracts
      const [companies, vehicles] = await Promise.all([
        this.companyService.getCompanies(),
        this.vehicleService.getVehicles()
      ]);

      const contracts = await this.contractService.getContracts();

      this.companies = companies;
      this.vehicles = vehicles;
      this.contracts = contracts as Contract[];
      this.cdr.markForCheck();
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'contracts',
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
    this.contractForm.reset({
      overtime_rate: 0
    });
    this.selectedContract = null;
    this.submitted = false;
    this.contractDialog = true;
  }

  editContract(contract: Contract) {
    this.selectedContract = contract;
    // Convert date strings to Date objects for Calendar
    const formData = {
      ...contract,
      start_date: new Date(contract.start_date),
      end_date: contract.end_date ? new Date(contract.end_date) : null
    };
    this.contractForm.patchValue(formData);
    this.contractDialog = true;
  }

  deleteContract(contract: Contract) {
    this.confirmationService.confirm({
      message: 'Sözleşmeyi silmek istediğinize emin misiniz?',
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: async () => {
        try {
          await this.contractService.deleteContract(contract.id);
          this.contracts = this.contracts.filter(val => val.id !== contract.id);
          this.messageService.clear();
          this.messageService.add({ 
            key: 'contracts',
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Sözleşme silindi', 
            life: 3000 
          });
        } catch (error: any) {
          this.messageService.clear();
          this.messageService.add({ 
            key: 'contracts',
            severity: 'error', 
            summary: 'Hata', 
            detail: this.getErrorMessage(error),
            life: 4000
          });
        }
      }
    });
  }

  async saveContract() {
    this.submitted = true;

    if (this.contractForm.invalid) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'contracts',
        severity: 'warn', 
        summary: 'Uyarı', 
        detail: 'Lütfen tüm zorunlu alanları doldurun.', 
        life: 3000
      });
      return;
    }

    const formValue = this.contractForm.value;

    // Validate dates: end_date cannot be before start_date
    if (formValue.end_date && formValue.start_date) {
      const startDate = new Date(formValue.start_date);
      const endDate = new Date(formValue.end_date);
      
      if (endDate < startDate) {
        this.messageService.clear();
        this.messageService.add({ 
          key: 'contracts',
          severity: 'error', 
          summary: 'Hata', 
          detail: 'Bitiş tarihi, başlangıç tarihinden önce olamaz.', 
          life: 4000
        });
        return;
      }
    }

    // Format dates back to YYYY-MM-DD for Supabase
    // Note: PrimeNG Calendar returns Date object.
    const payload = {
      ...formValue,
      start_date: this.formatDate(formValue.start_date),
      end_date: formValue.end_date ? this.formatDate(formValue.end_date) : null
    };

    if (!payload.id) delete payload.id;

    try {
      await this.contractService.upsertContract(payload);

      this.contractDialog = false;
      this.submitted = false;
      this.loadData();
      this.messageService.clear();
      this.messageService.add({ 
        key: 'contracts',
        severity: 'success', 
        summary: 'Başarılı', 
        detail: this.selectedContract ? 'Sözleşme güncellendi' : 'Sözleşme eklendi', 
        life: 3000 
      });
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'contracts',
        severity: 'error', 
        summary: 'Hata', 
        detail: this.getErrorMessage(error),
        life: 4000
      });
    }
  }

  private getErrorMessage(error: any): string {
    if (!error) return 'Bilinmeyen bir hata oluştu.';
    
    const errorMessage = error.message || error.toString();
    
    // Supabase hata mesajlarını Türkçe'ye çevir
    if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
      return 'Bu kayıt zaten mevcut. Lütfen farklı bir değer deneyin.';
    }
    if (errorMessage.includes('foreign key constraint')) {
      return 'Seçilen kayıt bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.';
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
    }
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'Bu işlem için yetkiniz bulunmamaktadır.';
    }
    
    return errorMessage || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }

  hideDialog() {
    this.contractDialog = false;
    this.submitted = false;
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}
