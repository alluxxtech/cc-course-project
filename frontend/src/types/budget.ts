export type BudgetResponse =
  | { budgetSet: false }
  | {
      budgetSet: true;
      amount: number;
      spent: number;
      remaining: number;
      usagePercent: number;
    };
