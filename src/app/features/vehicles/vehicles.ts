import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { VehicleService } from '../../core/services/vehicle.service';
import { Vehicle } from '../../core/models/database.types';
import { SupabaseService } from '../../core/services/supabase.service';
import { ContractService } from '../../core/services/contract.service';
import { DailyLogService } from '../../core/services/daily-log.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    DialogModule,
    InputTextModule,
    InputMaskModule,
    TooltipModule
  ],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css',
})
export class Vehicles implements OnInit {
  vehicles: Vehicle[] = [];
  vehicleDialog: boolean = false;
  dependencyDialog: boolean = false;
  vehicleDependencies: { contracts: any[]; logs: any[] } = { contracts: [], logs: [] };
  vehicleToDelete: Vehicle | null = null;

  vehicleForm: FormGroup;
  selectedVehicle: Vehicle | null = null;
  submitted: boolean = false;
  loading: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private vehicleService: VehicleService,
    private contractService: ContractService,
    private dailyLogService: DailyLogService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private supabaseService: SupabaseService
  ) {
    this.vehicleForm = this.fb.group({
      id: [null],
      plate_number: ['', Validators.required],
      driver_name: [''],
      driver_phone: ['']
    });
  }

  async ngOnInit() {
    this.isAdmin = await this.supabaseService.isAdmin();
    await this.loadVehicles();
  }

  async loadVehicles() {
    this.loading = true;
    try {
      this.vehicles = await this.vehicleService.getVehicles();
      this.cdr.markForCheck();
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'vehicles',
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
    this.vehicleForm.reset();
    this.selectedVehicle = null;
    this.submitted = false;
    this.vehicleDialog = true;
  }

  editVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    this.vehicleForm.patchValue(vehicle);
    this.vehicleDialog = true;
  }

  async deleteVehicle(vehicle: Vehicle) {
    // Önce bağlı kayıtları kontrol et - hızlı kontrol
    try {
      const dependencies = await this.vehicleService.checkVehicleDependencies(vehicle.id);
      
      if (dependencies.contracts.length > 0 || dependencies.logs.length > 0) {
        // Bağlı kayıtlar var - detayları göster
        this.vehicleDependencies = dependencies;
        this.vehicleToDelete = vehicle;
        this.dependencyDialog = true;
        this.cdr.detectChanges(); // Change detection'ı tetikle
        return;
      }
    } catch (error: any) {
      console.error('Check dependencies error:', error);
      // Kontrol hatası - yine de silmeyi dene
    }

    // Bağlı kayıt yoksa direkt sil
    this.confirmDeleteVehicle(vehicle);
  }

  confirmDeleteVehicle(vehicle: Vehicle) {
    this.confirmationService.confirm({
      message: `${vehicle.plate_number} plakalı aracı silmek istediğinize emin misiniz?`,
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: async () => {
        try {
          await this.vehicleService.deleteVehicle(vehicle.id);
          this.vehicles = this.vehicles.filter(val => val.id !== vehicle.id);
          this.messageService.clear();
          this.messageService.add({ 
            key: 'vehicles',
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Araç silindi', 
            life: 3000 
          });
        } catch (error: any) {
          console.error('Delete vehicle error:', error); // Debug için
          this.messageService.clear();
          this.messageService.add({ 
            key: 'vehicles',
            severity: 'error', 
            summary: 'Hata', 
            detail: this.getErrorMessage(error),
            life: 5000
          });
        }
      }
    });
  }

  closeDependencyDialog() {
    this.dependencyDialog = false;
    this.vehicleDependencies = { contracts: [], logs: [] };
    this.vehicleToDelete = null;
  }

  async deleteVehicleFromDialog() {
    if (!this.vehicleToDelete) return;
    
    try {
      await this.vehicleService.deleteVehicle(this.vehicleToDelete.id);
      this.vehicles = this.vehicles.filter(val => val.id !== this.vehicleToDelete!.id);
      this.closeDependencyDialog();
      this.messageService.clear();
      this.messageService.add({ 
        key: 'vehicles',
        severity: 'success', 
        summary: 'Başarılı', 
        detail: 'Araç silindi', 
        life: 3000 
      });
    } catch (error: any) {
      console.error('Delete vehicle error:', error);
      this.messageService.clear();
      this.messageService.add({ 
        key: 'vehicles',
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
          if (this.vehicleToDelete) {
            const dependencies = await this.vehicleService.checkVehicleDependencies(this.vehicleToDelete.id);
            this.vehicleDependencies = dependencies;
            this.cdr.detectChanges();
            
            // Eğer tüm bağlı kayıtlar silindiyse, pop-up içinde silme onayı göster
            // Pop-up açık kalacak, kullanıcı pop-up içinden onaylayacak
          }
          this.messageService.clear();
          this.messageService.add({ 
            key: 'vehicles',
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Sözleşme silindi', 
            life: 3000 
          });
        } catch (error: any) {
          this.messageService.clear();
          this.messageService.add({ 
            key: 'vehicles',
            severity: 'error', 
            summary: 'Hata', 
            detail: this.getErrorMessage(error),
            life: 5000
          });
        }
      }
    });
  }

  async deleteLogFromDialog(log: any) {
    this.confirmationService.confirm({
      message: `Bu günlük kaydı silmek istediğinize emin misiniz?`,
      header: 'Günlük Kayıt Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: async () => {
        try {
          await this.dailyLogService.deleteDailyLog(log.id);
          // Bağlı kayıtları yeniden yükle
          if (this.vehicleToDelete) {
            const dependencies = await this.vehicleService.checkVehicleDependencies(this.vehicleToDelete.id);
            this.vehicleDependencies = dependencies;
            this.cdr.detectChanges();
            
            // Eğer tüm bağlı kayıtlar silindiyse, pop-up içinde silme onayı göster
            // Pop-up açık kalacak, kullanıcı pop-up içinden onaylayacak
          }
          this.messageService.clear();
          this.messageService.add({ 
            key: 'vehicles',
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Günlük kayıt silindi', 
            life: 3000 
          });
        } catch (error: any) {
          this.messageService.clear();
          this.messageService.add({ 
            key: 'vehicles',
            severity: 'error', 
            summary: 'Hata', 
            detail: this.getErrorMessage(error),
            life: 5000
          });
        }
      }
    });
  }

  async saveVehicle() {
    this.submitted = true;

    if (this.vehicleForm.invalid) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'vehicles',
        severity: 'warn', 
        summary: 'Uyarı', 
        detail: 'Lütfen plaka numarasını girin.', 
        life: 3000
      });
      return;
    }

    const vehicleData = this.vehicleForm.value;
    if (!vehicleData.id) delete vehicleData.id;

    try {
      await this.vehicleService.upsertVehicle(vehicleData);

      this.vehicleDialog = false;
      this.submitted = false;
      this.loadVehicles();
      this.messageService.clear();
      this.messageService.add({ 
        key: 'vehicles',
        severity: 'success', 
        summary: 'Başarılı', 
        detail: this.selectedVehicle ? 'Araç güncellendi' : 'Araç eklendi', 
        life: 3000 
      });
    } catch (error: any) {
      this.messageService.clear();
      this.messageService.add({ 
        key: 'vehicles',
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
    if (errorMessage.includes('bağlı kayıtlar') || errorMessage.includes('bağlı sözleşmeler') || errorMessage.includes('bağlı günlük kayıtlar')) {
      return errorMessage;
    }
    
    // Supabase hata mesajlarını Türkçe'ye çevir
    if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
      return 'Bu plaka numarası zaten mevcut. Lütfen farklı bir plaka deneyin.';
    }
    if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key') || errorMessage.includes('23503')) {
      return 'Bu araca bağlı sözleşmeler veya günlük kayıtlar bulunmaktadır. Önce bağlı kayıtları siliniz.';
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
      return 'Araç silinirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
    }
    
    return errorMessage;
  }

  hideDialog() {
    this.vehicleDialog = false;
    this.submitted = false;
  }
}

