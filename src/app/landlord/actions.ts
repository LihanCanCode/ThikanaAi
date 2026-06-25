"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonthStart } from "@/lib/auth-utils";

export interface TenantWithPayment {
  id: string;
  listing_id: string | null;
  tenant_name: string;
  tenant_phone: string | null;
  room_label: string | null;
  monthly_rent: number;
  status: "paid" | "due" | "overdue";
  paid_on: string | null;
  payment_id: string | null;
}

export async function getLandlordDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", tenants: [], listings: [] };

  const monthStart = currentMonthStart();

  const [{ data: listings }, { data: tenants }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tenants")
      .select("*")
      .eq("landlord_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const tenantIds = (tenants ?? []).map((t) => t.id);
  let payments: { id: string; tenant_id: string; status: string; paid_on: string | null }[] = [];

  if (tenantIds.length > 0) {
    const { data } = await supabase
      .from("rent_payments")
      .select("id, tenant_id, status, paid_on")
      .in("tenant_id", tenantIds)
      .eq("month", monthStart);
    payments = data ?? [];
  }

  const paymentByTenant = new Map(payments.map((p) => [p.tenant_id, p]));

  const tenantsWithPayments: TenantWithPayment[] = (tenants ?? []).map((t) => {
    const payment = paymentByTenant.get(t.id);
    return {
      id: t.id,
      listing_id: t.listing_id,
      tenant_name: t.tenant_name,
      tenant_phone: t.tenant_phone,
      room_label: t.room_label,
      monthly_rent: t.monthly_rent,
      status: (payment?.status as TenantWithPayment["status"]) ?? "due",
      paid_on: payment?.paid_on ?? null,
      payment_id: payment?.id ?? null,
    };
  });

  return {
    tenants: tenantsWithPayments,
    listings: listings ?? [],
    monthLabel: new Date(monthStart).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

export async function markTenantPaid(tenantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const monthStart = currentMonthStart();
  const today = new Date().toISOString().split("T")[0];

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, monthly_rent")
    .eq("id", tenantId)
    .eq("landlord_id", user.id)
    .single();

  if (!tenant) return { error: "Tenant not found" };

  const { data: existing } = await supabase
    .from("rent_payments")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("month", monthStart)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("rent_payments")
      .update({ status: "paid", paid_on: today })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("rent_payments").insert({
      tenant_id: tenantId,
      month: monthStart,
      amount: tenant.monthly_rent,
      status: "paid",
      paid_on: today,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/landlord/dashboard");
  return { success: true };
}

export async function addTenant(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tenant_name = formData.get("tenant_name") as string;
  const tenant_phone = formData.get("tenant_phone") as string;
  const room_label = formData.get("room_label") as string;
  const monthly_rent = parseInt(formData.get("monthly_rent") as string, 10);
  const listing_id = (formData.get("listing_id") as string) || null;

  if (!tenant_name || !monthly_rent) {
    return { error: "Name and rent are required" };
  }

  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({
      landlord_id: user.id,
      listing_id,
      tenant_name,
      tenant_phone: tenant_phone || null,
      room_label: room_label || null,
      monthly_rent,
      is_active: true,
    })
    .select("id, monthly_rent")
    .single();

  if (error || !tenant) return { error: error?.message ?? "Failed to add tenant" };

  const monthStart = currentMonthStart();
  await supabase.from("rent_payments").insert({
    tenant_id: tenant.id,
    month: monthStart,
    amount: tenant.monthly_rent,
    status: "due",
  });

  revalidatePath("/landlord/dashboard");
  return { success: true };
}
