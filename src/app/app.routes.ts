import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { AuthGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { 
        path: 'pending-approval', 
        loadComponent: () => import('./features/auth/pending-approval/pending-approval').then(m => m.PendingApproval)
    },
    {
        path: '',
        component: MainLayout,
        canActivate: [AuthGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
            },
            {
                path: 'companies',
                loadComponent: () => import('./features/companies/companies').then(m => m.Companies)
            },
            {
                path: 'vehicles',
                loadComponent: () => import('./features/vehicles/vehicles').then(m => m.Vehicles)
            },
            {
                path: 'contracts',
                loadComponent: () => import('./features/contracts/contracts').then(m => m.Contracts)
            },
            {
                path: 'daily-logs',
                loadComponent: () => import('./features/daily-logs/daily-logs').then(m => m.DailyLogs)
            },
            {
                path: 'admin/users',
                loadComponent: () => import('./features/admin/users/users').then(m => m.Users),
                canActivate: [adminGuard]
            }
        ]
    },
    { path: '**', redirectTo: 'login' }
];
