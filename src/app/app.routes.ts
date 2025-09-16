import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ExpensesComponent } from './components/expenses/expenses.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'expenses', component: ExpensesComponent }
];
