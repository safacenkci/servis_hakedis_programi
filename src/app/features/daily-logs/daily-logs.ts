import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ConfirmationService, MessageService } from 'primeng/api';

import { DailyLogService } from '../../core/services/daily-log.service';
import { CompanyService } from '../../core/services/company.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { ContractService } from '../../core/services/contract.service';
import { DailyLog, Company, Vehicle } from '../../core/models/database.types';
import { SupabaseService } from '../../core/services/supabase.service';

// Interface for vehicle monthly summary
interface VehicleMonthlySummary {
  vehicle_id: number;
  plate_number: string;
  driver_name: string;
  total_fee: number;
  log_count: number;
  overtime_count: number;
}

@Component({
  selector: 'app-daily-logs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    CheckboxModule,
    TextareaModule,
    CardModule
  ],
  templateUrl: './daily-logs.html',
  styleUrl: './daily-logs.css',
})
export class DailyLogs implements OnInit {
  logs: DailyLog[] = [];
  companies: Company[] = [];
  vehicles: Vehicle[] = [];
  vehicleSummary: VehicleMonthlySummary[] = [];

  logDialog: boolean = false;
  logForm: FormGroup;
  selectedLog: DailyLog | null = null;
  submitted: boolean = false;
  loading: boolean = false;

  // Month/Year selection
  selectedMonth: Date = new Date();
  monthOptions: { label: string; value: Date }[] = [];

  // To display calculated fee in UI before saving
  currentContractRate: number = 0;
  currentOvertimeRate: number = 0;

  // Grand total for the month
  grandTotal: number = 0;
  isAdmin: boolean = false;

  constructor(
    private dailyLogService: DailyLogService,
    private companyService: CompanyService,
    private vehicleService: VehicleService,
    private contractService: ContractService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private supabaseService: SupabaseService
  ) {
    this.logForm = this.fb.group({
      id: [null],
      date: [new Date(), Validators.required],
      company_id: [null, Validators.required],
      vehicle_id: [null, Validators.required],
      is_overtime: [false],
      calculated_fee: [0, Validators.required],
      description: ['']
    });

    // Generate month options (last 12 months)
    this.generateMonthOptions();
  }

  async ngOnInit() {
    this.isAdmin = await this.supabaseService.isAdmin();
    await this.loadData();
  }

  generateMonthOptions() {
    const now = new Date();
    // Current month plus last 11 months = 12 months total
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
      this.monthOptions.push({ label, value: date });
    }
  }

  getSelectedMonthLabel(): string {
    return this.selectedMonth.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
  }

  async loadData() {
    this.loading = true;
    try {
      const [companies, vehicles] = await Promise.all([
        this.companyService.getCompanies(),
        this.vehicleService.getVehicles()
      ]);

      this.companies = companies;
      this.vehicles = vehicles;

      // Load logs and summary for selected month
      await this.loadMonthData();
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'daily-logs',
        severity: 'error', 
        summary: 'Hata', 
        detail: this.getErrorMessage(error) 
      });
    } finally {
      this.loading = false;
    }
  }

  async loadMonthData() {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth() + 1; // JavaScript months are 0-indexed

    try {
      // Load logs for selected month
      const logs = await this.dailyLogService.getDailyLogs(year, month);
      this.logs = logs as DailyLog[];

      // Load vehicle summary for selected month
      this.vehicleSummary = await this.dailyLogService.getMonthlyVehicleSummary(year, month);

      // Calculate grand total
      this.grandTotal = this.vehicleSummary.reduce((sum, v) => sum + v.total_fee, 0);

      // Trigger Change Detection to update view
      this.cdr.markForCheck();
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'daily-logs',
        severity: 'error', 
        summary: 'Hata', 
        detail: this.getErrorMessage(error),
        life: 4000
      });
    }
  }

  async onMonthChange() {
    this.loading = true;
    try {
      await this.loadMonthData();
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'daily-logs',
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

  previousMonth() {
    const newDate = new Date(this.selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    this.selectedMonth = newDate;
    this.onMonthChange();
  }

  nextMonth() {
    const now = new Date();
    const newDate = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);

    // Don't allow future months - compare year and month separately
    const isCurrentOrPast = newDate.getFullYear() < now.getFullYear() ||
      (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() <= now.getMonth());

    if (isCurrentOrPast) {
      this.selectedMonth = newDate;
      this.onMonthChange();
    }
  }

  isCurrentMonth(): boolean {
    const now = new Date();
    return this.selectedMonth.getFullYear() === now.getFullYear() &&
      this.selectedMonth.getMonth() === now.getMonth();
  }

  openNew() {
    this.logForm.reset({
      date: new Date(),
      is_overtime: false,
      calculated_fee: 0
    });
    this.selectedLog = null;
    this.submitted = false;
    this.currentContractRate = 0;
    this.currentOvertimeRate = 0;
    this.logDialog = true;
  }

  // Calculate Fee Trigger
  async calculateFee() {
    const { date, company_id, vehicle_id, is_overtime } = this.logForm.value;

    if (!date || !company_id) return;

    const dateStr = this.formatDate(date);

    try {
      const contract = await this.contractService.getActiveContract(company_id, vehicle_id || null, dateStr);

      if (contract) {
        this.currentContractRate = contract.daily_rate;
        this.currentOvertimeRate = contract.overtime_rate || 0;

        let total = Number(contract.daily_rate);
        if (is_overtime) {
          total += Number(contract.overtime_rate || 0);
        }

        this.logForm.patchValue({ calculated_fee: total }, { emitEvent: false });
      } else {
        this.messageService.clear();
        this.messageService.add({ 
          key: 'daily-logs',
          severity: 'warn', 
          summary: 'Uyarı', 
          detail: 'Bu tarih ve kriterlere uygun sözleşme bulunamadı. Ücret 0 olarak ayarlandı.', 
          life: 4000 
        });
        this.logForm.patchValue({ calculated_fee: 0 }, { emitEvent: false });
      }
    } catch (error: any) {
      this.messageService.add({ 
        key: 'daily-logs',
        severity: 'error', 
        summary: 'Hata', 
        detail: this.getErrorMessage(error),
        life: 4000
      });
    }
  }

  async saveLog() {
    this.submitted = true;

    if (this.logForm.invalid) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'daily-logs',
        severity: 'warn', 
        summary: 'Uyarı', 
        detail: 'Lütfen tüm zorunlu alanları doldurun.', 
        life: 3000
      });
      return;
    }

    const formValue = this.logForm.value;

    const payload = {
      ...formValue,
      date: this.formatDate(formValue.date)
    };

    if (!payload.id) delete payload.id;

    try {
      await this.dailyLogService.addDailyLog(payload);

      this.logDialog = false;
      this.submitted = false;

      // Reload data for the current selected month
      await this.loadMonthData();

      this.messageService.clear();
      this.messageService.add({ 
        key: 'daily-logs',
        severity: 'success', 
        summary: 'Başarılı', 
        detail: 'Günlük kayıt başarıyla eklendi', 
        life: 3000 
      });
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'daily-logs',
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

  deleteLog(log: DailyLog) {
    this.confirmationService.confirm({
      message: 'Kaydı silmek istediğinize emin misiniz?',
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: async () => {
        try {
          await this.dailyLogService.deleteDailyLog(log.id);
          this.logs = this.logs.filter(val => val.id !== log.id);

          // Reload summary
          await this.loadMonthData();

          this.messageService.clear();
          this.messageService.add({ 
            key: 'daily-logs',
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Kayıt silindi', 
            life: 3000 
          });
        } catch (error: any) {
          this.messageService.clear();
          this.messageService.add({ 
            key: 'daily-logs',
            severity: 'error', 
            summary: 'Hata', 
            detail: this.getErrorMessage(error),
            life: 4000
          });
        }
      }
    });
  }

  hideDialog() {
    this.logDialog = false;
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
