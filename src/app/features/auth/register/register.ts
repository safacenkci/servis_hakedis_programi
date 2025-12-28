import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';

import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        PasswordModule
    ],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class Register {
    registerForm: FormGroup;
    loading: boolean = false;

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private router: Router,
        private messageService: MessageService
    ) {
        this.registerForm = this.fb.group({
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    async onRegister() {
        if (this.registerForm.invalid) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Uyarı', 
                detail: 'Lütfen tüm alanları doldurun. Şifre en az 6 karakter olmalıdır.', 
                life: 3000 
            });
            return;
        }

        this.loading = true;
        const { email, password, fullName } = this.registerForm.value;

        try {
            const { error } = await this.supabaseService.signUp(email, password, fullName);

            if (error) throw error;

            this.messageService.add({ 
                severity: 'success', 
                summary: 'Başarılı', 
                detail: 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...', 
                life: 3000 
            });
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 1500);
        } catch (error: any) {
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Kayıt Hatası', 
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
        if (errorMessage.includes('User already registered') || errorMessage.includes('already registered')) {
            return 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapmayı deneyin.';
        }
        if (errorMessage.includes('Password should be at least')) {
            return 'Şifre en az 6 karakter olmalıdır.';
        }
        if (errorMessage.includes('Invalid email')) {
            return 'Geçersiz e-posta adresi. Lütfen doğru bir e-posta adresi girin.';
        }
        if (errorMessage.includes('Email rate limit')) {
            return 'Çok fazla kayıt denemesi yapıldı. Lütfen bir süre sonra tekrar deneyin.';
        }
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
        }
        
        return errorMessage || 'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.';
    }
}
