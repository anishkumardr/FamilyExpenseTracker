import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * =============================
   *   DASHBOARD MAIN AGGREGATES
   * =============================
   */

  async getTotalExpense(month: number, year: number): Promise<number> {
    const familyId = this.authService.familyId;

    const { data, error } = await this.supabase.rpc('get_total_expense', {
      p_family_id: familyId,
      p_month: month,
      p_year: year
    });

    if (error) throw error;
    return data ?? 0;
  }

  async getTotalIncome(month: number, year: number): Promise<number> {
    const familyId = this.authService.familyId;

    const { data, error } = await this.supabase.rpc('get_total_income', {
      p_family_id: familyId,
      p_month: month,
      p_year: year
    });

    if (error) throw error;
    return data ?? 0;
  }

  async getTotalSavings(month: number, year: number): Promise<number> {
    const familyId = this.authService.familyId;

    const { data, error } = await this.supabase.rpc('get_total_savings', {
      p_family_id: familyId,
      p_month: month,
      p_year: year
    });

    if (error) throw error;
    return data ?? 0;
  }

  /**
   * =============================
   *     BUDGET VS SPENDING
   * =============================
   */
  async getBudgetVsSpending(month: number, year: number): Promise<any[]> {
    const familyId = this.authService.familyId;

    const { data, error } = await this.supabase.rpc('get_budget_vs_spending', {
      p_family_id: familyId,
      p_month: month,
      p_year: year
    });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * =============================
   *       RECENT TRANSACTIONS
   * =============================
   */
  async getRecentTransactions(limit: number = 10): Promise<any[]> {
    const familyId = this.authService.familyId;

    const { data, error } = await this.supabase.rpc('get_recent_transactions', {
      p_family_id: familyId,
      p_limit: limit
    });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * =============================
   *       CATEGORY INSIGHTS
   * =============================
   */
  async getCategoryInsights(month: number, year: number): Promise<any[]> {
    const familyId = this.authService.familyId;

    const { data, error } = await this.supabase.rpc('get_category_insights', {
      p_family_id: familyId,
      p_month: month,
      p_year: year
    });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * =========================================
   *         DASHBOARD MAIN COMBINED CALL
   * =========================================
   */
  async getDashboardData(month: number, year: number) {
    try {
      const [
        totalExpense,
        totalIncome,
        totalSavings,
        recentTransactions,
        categoryInsights,
        budgetVsSpending
      ] = await Promise.all([
        this.getTotalExpense(month, year),
        this.getTotalIncome(month, year),
        this.getTotalSavings(month, year),
        this.getRecentTransactions(),
        this.getCategoryInsights(month, year),
        this.getBudgetVsSpending(month, year)
      ]);

      return {
        totalExpense,
        totalIncome,
        totalSavings,
        recentTransactions,
        categoryInsights,
        budgetVsSpending
      };

    } catch (err) {
      console.error('Dashboard loading failed:', err);
      throw err;
    }
  }

}
