import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ExpensesComponent } from './components/expenses/expenses.component';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('../app/components/home/home.component').then(m => m.HomeComponent) },
  { path: 'expense-management', loadComponent: () => import('../app/components/expense-management/expense-management.component').then(m => m.ExpenseManagementComponent) },
  { path: 'allotment', loadComponent: () => import('../app/components/allotment/allotment.component').then(m => m.AllotmentComponent) },
  { path: 'reports', loadComponent: () => import('../app/components/reports/reports.component').then(m => m.ReportsComponent) },
  { path: 'setup', loadComponent: () => import('../app/components/setup/setup.component').then(m => m.SetupComponent) },
  // 🔹 Setup sub-pages
  { path: 'category-management', loadComponent: () => import('../app/components/category-management/category-management.component').then(m => m.CategoryManagementComponent) },
  { path: 'income-management', loadComponent: () => import('../app/components/income-management/income-management.component').then(m => m.IncomeManagementComponent) },
  { path: 'savings-management', loadComponent: () => import('../app/components/savings-management/savings-management.component').then(m => m.SavingsManagementComponent) },

  //{ path: '**', redirectTo: 'home' },

  { path: 'login', loadComponent: () =>
    import('./components/login/login.component').then(m => m.LoginComponent) },

];
