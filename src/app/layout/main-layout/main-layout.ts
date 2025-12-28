import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    DrawerModule,
    ButtonModule,
    MenuModule,
    ToastModule,
    ConfirmDialogModule
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  sidebarVisible: boolean = false;
  items: MenuItem[] | undefined;

  constructor(private supabaseService: SupabaseService, private router: Router) { }

  currentUser: any = null;
  userInitial: string = '';
  userDisplay: string = '';
  isAdmin: boolean = false;

  ngOnInit() {
    this.supabaseService.currentUser$.subscribe(async user => {
      this.currentUser = user;
      if (user) {
        const fullName = user.user_metadata?.['full_name'];
        const email = user.email || '';
        this.userDisplay = fullName || email || 'Kullanıcı';
        this.userInitial = (this.userDisplay[0] || 'U').toUpperCase();
        
        // Admin kontrolü
        try {
          const { data } = await this.supabaseService.client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          this.isAdmin = data?.role === 'admin';
        } catch (error) {
          this.isAdmin = false;
        }
      }
    });

    this.items = [
      {
        label: 'Anasayfa',
        icon: 'pi pi-home',
        routerLink: '/dashboard',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Şirketler',
        icon: 'pi pi-building',
        routerLink: '/companies',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Araçlar',
        icon: 'pi pi-car',
        routerLink: '/vehicles',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Sözleşmeler',
        icon: 'pi pi-file',
        routerLink: '/contracts',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Günlük Kayıtlar',
        icon: 'pi pi-calendar',
        routerLink: '/daily-logs',
        command: () => this.sidebarVisible = false
      }
    ];
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/login']);
  }
}
