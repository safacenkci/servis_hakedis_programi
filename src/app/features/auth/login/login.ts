import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';

import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        CheckboxModule
    ],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    loginForm: FormGroup;
    loading: boolean = false;

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private router: Router,
        private messageService: MessageService
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    async onLogin() {
        if (this.loginForm.invalid) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Uyarı', 
                detail: 'Lütfen e-posta ve şifre alanlarını doldurun.', 
                life: 3000 
            });
            return;
        }

        this.loading = true;
        const { email, password } = this.loginForm.value;

        try {
            const { error } = await this.supabaseService.signIn(email, password);

            if (error) throw error;

            this.messageService.add({ 
                severity: 'success', 
                summary: 'Başarılı', 
                detail: 'Giriş başarılı. Yönlendiriliyorsunuz...', 
                life: 2000 
            });
            setTimeout(() => {
                this.router.navigate(['/dashboard']);
            }, 500);
        } catch (error: any) {
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Giriş Hatası', 
                detail: this.getErrorMessage(error) 
            });
        } finally {
            this.loading = false;
        }
    }

    private getErrorMessage(error: any): string {
        if (!error) return 'Bilinmeyen bir hata oluştu.';
        
        const errorMessage = error.message || error.toString();
        
        // Supabase auth hata mesajlarını Türkçe'ye çevir
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid_credentials')) {
            return 'E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.';
        }
        if (errorMessage.includes('Email not confirmed')) {
            return 'E-posta adresiniz henüz doğrulanmamış. Lütfen e-posta kutunuzu kontrol edin.';
        }
        if (errorMessage.includes('User not found')) {
            return 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
        }
        if (errorMessage.includes('Too many requests')) {
            return 'Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.';
        }
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
        }
        
        return errorMessage || 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
    }
}
