import { Injectable } from '@angular/core';
import { Router, CanActivate, UrlTree } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private supabase: SupabaseService, private router: Router) { }

    async canActivate(): Promise<boolean | UrlTree> {
        const session = await this.supabase.getSession();
        
        if (!session) {
            return this.router.createUrlTree(['/login']);
        }

        // Kullanıcı onay kontrolü
        const isApproved = await this.supabase.checkUserApproval();
        
        if (!isApproved) {
            // Onay bekleyen kullanıcıları bekleme sayfasına yönlendir
            return this.router.createUrlTree(['/pending-approval']);
        }

        return true;
    }
}
