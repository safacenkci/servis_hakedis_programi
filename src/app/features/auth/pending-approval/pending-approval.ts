import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-pending-approval',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule
    ],
    template: `
        <div class="auth-container">
            <div class="auth-wrapper">
                <div class="auth-card">
                    <div class="text-center">
                        <div class="pending-icon mb-4">
                            <i class="pi pi-clock text-5xl text-500"></i>
                        </div>
                        <h1 class="auth-title mb-3">Hesap Onayı Bekleniyor</h1>
                        <p class="auth-subtitle mb-4">
                            Hesabınız admin tarafından onaylanmayı bekliyor. 
                            Onaylandıktan sonra sisteme giriş yapabileceksiniz.
                        </p>
                        <p class="text-600 text-sm mb-4">
                            Onay süreci genellikle 24 saat içinde tamamlanır. 
                            E-posta adresinizi kontrol etmeyi unutmayın.
                        </p>
                        <button 
                            pButton 
                            label="Çıkış Yap" 
                            icon="pi pi-sign-out"
                            class="auth-button-secondary"
                            (click)="logout()">
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 2rem 1rem;
            position: relative;
            overflow: hidden;
        }

        .auth-wrapper {
            width: 100%;
            max-width: 420px;
            position: relative;
            z-index: 1;
        }

        .auth-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
            padding: 2.5rem;
            border: 1px solid #e2e8f0;
        }

        .auth-title {
            font-size: 1.875rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 0.5rem 0;
            letter-spacing: -0.02em;
        }

        .auth-subtitle {
            font-size: 0.9375rem;
            color: #64748b;
            margin: 0;
            font-weight: 400;
        }

        .pending-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: #f1f5f9;
        }

        .auth-button-secondary {
            background: #ffffff !important;
            border: 1.5px solid #e2e8f0 !important;
            color: #475569 !important;
        }

        .auth-button-secondary:hover {
            background: #f8fafc !important;
            border-color: #cbd5e1 !important;
        }
    `]
})
export class PendingApproval implements OnInit {
    constructor(private supabaseService: SupabaseService) {}

    ngOnInit() {
        // Kullanıcı onaylandıysa dashboard'a yönlendir
        this.checkApprovalStatus();
    }

    async checkApprovalStatus() {
        const isApproved = await this.supabaseService.checkUserApproval();
        if (isApproved) {
            window.location.href = '/dashboard';
        }
    }

    async logout() {
        await this.supabaseService.signOut();
        window.location.href = '/login';
    }
}

