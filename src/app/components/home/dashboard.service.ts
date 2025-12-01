import { Injectable } from '@angular/core';
import { SupabaseClient, PostgrestSingleResponse } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environments';
import { AuthService } from './../../services/auth.service';
import {
  TotalAmountResponse,
  CategoryBreakdown,
  BudgetVsSpending,
  PaymentMethodUsage,
  MonthlyTrend,
  SavingSummary,
  EmiExpense,
  RecentExpense
} from './models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Utility
  private requireFamilyId() {
    if (!this.authService?.familyId) {
      console.error('No family_id found in profile:', this.authService.profile);
      throw new Error('No family_id found');
    }
    return this.authService.familyId;
  }

  // =========================
  // 1. TOTAL MONTHLY EXPENSE
  // =========================
  async getMonthlyExpense(month: number, year: number): Promise<number> {
    const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('get_total_expense', {
      p_family_id: familyId,
      p_month: 10,
      p_year: 2025
    });
      console.log('Monthly Expense Data:', data, 'Error:', error);
    if (error) throw error;
    return data ?? 0;
  }

  // =========================
  // 2. TOTAL MONTHLY INCOME
  // =========================
  async getMonthlyIncome(month: number, year: number): Promise<number> {
    const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('get_total_income', {
      p_family_id: familyId,
      p_month: month,
      p_year: year
    });

    if (error) throw error;
    return data ?? 0;
  }

  // ============================
  // 3. TOP CATEGORY BREAKDOWN
  // ============================
  async getCategoryBreakdown(month: number, year: number): Promise<CategoryBreakdown[]> {
    const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('category_spending_breakdown', {
      p_family_id: familyId,
      p_month: month,
      p_year: year
    });

    if (error) throw error;
    return data ?? [];
  }

  // =============================
  // 4. RECENT TRANSACTIONS
  // =============================
  
  async getRecentExpense(): Promise<RecentExpense[]> {
    const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('get_recent_transactions', {
      p_family_id: familyId
    });
console.log('Recent Expense Data:', data, 'Error:', error);
    if (error) throw error;
    return data ?? [];
  }
  // =============================
  // 5. BUDGET VS SPENDING
  // =============================
  async getBudgetVsSpending(month: number, year: number): Promise<BudgetVsSpending[]> {
    const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('get_budget_vs_spending', {
      p_family_id: familyId,
      p_month: 10,
      p_year: 2025
    });
    console.log('Budget Vs Spending Data:', data, 'Error:', error);
    if (error) throw error;
    return data ?? [];
  }

  // =============================
  // 6. PAYMENT METHOD USAGE
  // =============================
  async getPaymentMethodUsage(): Promise<PaymentMethodUsage[]> {
    const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('payment_method_usage', {
      p_family_id: familyId
    });

    if (error) throw error;
    return data ?? [];
  }

  // =============================
  // 7. MONTHLY TREND (LINE CHART)
  // =============================
  async getMonthlyTrend(year: number): Promise<MonthlyTrend[]> {
    const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('monthly_trend', {
      p_family_id: familyId,
      p_year: year
    });

    if (error) throw error;
    return data ?? [];
  }

  // =============================
  // 8. CREDIT CARD MONTHLY EXPENSE
  // =============================
  async getCreditCardExpense(month: number, year: number): Promise<number> {
    const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('creditcard_expense', {
      p_family_id: familyId,
      p_month: month,
      p_year: year
    });

    if (error) throw error;
    return data ?? 0;
  }

  // =============================
  // 9. EMI / RECURRING EXPENSES
  // =============================
  async getEmiExpenses(): Promise<EmiExpense[]> {
    const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('emi_expenses', {
      p_family_id: familyId
    });

    if (error) throw error;
    return data ?? [];
  }

  // =============================
  // 10. SAVINGS SUMMARY
  // =============================
  async getMonthlySavings(month: number, year: number): Promise<number> {
    // const income = await this.getMonthlyIncome(month, year);
    // const expense = await this.getMonthlyExpense(month, year);

    // return income - expense;

     const familyId = this.requireFamilyId();

    const { data, error } = await this.supabase.rpc('get_total_savings', {
      p_family_id: familyId,
      p_month: 10,
      p_year: 2025
    });
      console.log('Monthly savings Data:', data, 'Error:', error);
    if (error) throw error;
    return data ?? 0;
  }

  async getDashboard(month: number, year: number) {
    console.log('Fetching dashboard data for month:', month, 'year:', year);
  const [
    summaryExpense,
    summaryIncome,
    //categoryWise,
    budget,
    //credit,
    recentTxns,
    //emi,
    savings
  ] = await Promise.all([
    this.getMonthlyExpense(month, year),
    this.getMonthlyIncome(month, year),
    //this.getCategoryBreakdown(month, year),
    this.getBudgetVsSpending(month, year),
    //this.getCreditCardExpense(month, year),
    this.getRecentExpense(),
    //this.getEmiExpenses(),
    this.getMonthlySavings(month, year)
  ]);
  console.log('monthly summaryIncome :', summaryIncome);
console.log('monthly summaryExpense :', summaryExpense);
  return {
    summary: {
      income: summaryIncome,
      expense: summaryExpense,
      savings: savings
    },
    //categoryWise,
    budget,
    //credit,
    recentTxns,
    //emi
  };
}

}
