export interface IncomeType {
  id: number;          // PK from income_type table
  name: string;        // e.g., Salary, Bonus, Rent
  status: boolean;     // active/inactive
}
