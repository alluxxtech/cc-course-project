export type Transaction = {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  amount: string; // Prisma Decimal serializes to string
  currency: string;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionFilters = {
  search: string;
  categoryId: string;
  preset: "this_month" | "last_month" | "";
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
};
