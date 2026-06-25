import type { UserRole } from "@/types";

export function getRoleHomePath(role: UserRole | string | undefined): string {
  switch (role) {
    case "landlord":
      return "/landlord/dashboard";
    case "professional":
      return "/listings/family";
    case "student":
    default:
      return "/listings";
  }
}

export function currentMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function paymentStatusFromDue(isPaid: boolean, monthStart: string): "paid" | "due" | "overdue" {
  if (isPaid) return "paid";
  const due = new Date(monthStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setDate(5); // due by 5th of month
  return today > due ? "overdue" : "due";
}
