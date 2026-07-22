import type { DataTableFilter } from "@/components/account/DataTable";
import type { ProviderListItem } from "@/lib/api/serviceProviders";

/** Admin-only provider drill-down filter for DataTable toolbars. */
export function providerDataTableFilter(
  providers: ProviderListItem[],
): DataTableFilter<unknown> {
  return {
    id: "provider",
    label: "Provider",
    options: [
      { value: "", label: "All providers" },
      ...providers.map((p) => ({
        value: String(p.id),
        label: p.businessName || p.displayName || `Provider ${p.id}`,
      })),
    ],
  };
}

/** Appends the provider filter when the caller is a system admin. */
export function withOptionalProviderFilter<Row>(
  filters: DataTableFilter<Row>[],
  isAdmin: boolean,
  providers: ProviderListItem[],
): DataTableFilter<Row>[] {
  if (!isAdmin) return filters;
  return [...filters, providerDataTableFilter(providers) as DataTableFilter<Row>];
}
