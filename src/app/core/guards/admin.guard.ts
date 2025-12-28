import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const adminGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const session = await supabase.getSession();
  
  if (!session) {
    return router.createUrlTree(['/login']);
  }

  // Kullanıcının admin olup olmadığını kontrol et
  const user = supabase.currentUser;
  if (!user) {
    return router.createUrlTree(['/dashboard']);
  }

  try {
    const { data, error } = await supabase.client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || data?.role !== 'admin') {
      return router.createUrlTree(['/dashboard']);
    }

    return true;
  } catch (error) {
    return router.createUrlTree(['/dashboard']);
  }
};

