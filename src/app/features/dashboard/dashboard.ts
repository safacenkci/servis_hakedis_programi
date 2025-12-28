import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { SupabaseService } from '../../core/services/supabase.service';

import { CompanyService } from '../../core/services/company.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { ContractService } from '../../core/services/contract.service';
import { DailyLogService } from '../../core/services/daily-log.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  counts = {
    companies: 0,
    vehicles: 0,
    contracts: 0,
    logs: 0
  };
  todayDate = new Date();
  loading: boolean = true;
  userName: string = '';

  constructor(
    private supabaseService: SupabaseService,
    private companyService: CompanyService,
    private vehicleService: VehicleService,
    private contractService: ContractService,
    private dailyLogService: DailyLogService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.supabaseService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.user_metadata?.['full_name'] || user.email || '';
        this.refreshStats();
      }
    });
  }

  async refreshStats() {
    this.loading = true;
    try {
      const companies = await this.companyService.getCompanies();
      const vehicles = await this.vehicleService.getVehicles();
      const contracts = await this.contractService.getContracts();
      const logs = await this.dailyLogService.getDailyLogs();

      this.counts = {
        companies: companies?.length || 0,
        vehicles: vehicles?.length || 0,
        contracts: contracts?.length || 0,
        logs: logs?.length || 0
      };
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}

