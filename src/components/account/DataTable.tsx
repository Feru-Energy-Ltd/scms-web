import { useEffect, useMemo, useState, type ReactNode } from "react";
import Pagination from "./Pagination";
import styles from "./ResourceList.module.css";

export type DataTableColumn<Row> = {
  id: string;
  header: ReactNode;
  cell: (row: Row, rowIndex: number) => ReactNode;
};

export type DataTableFilter<Row> = {
  id: string;
  label?: string;
  options: { value: string; label: string }[];
  predicate: (row: Row, value: string) => boolean;
  defaultValue?: string;
};

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row, rowIndex: number) => React.Key;
  /** Show a search bar above the table. Requires `searchAccessor` to know what text to match. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Returns the searchable text for a row. Defaults to matching everything. */
  searchAccessor?: (row: Row) => string;
  /** Dropdown filters rendered next to the search bar. */
  filters?: DataTableFilter<Row>[];
  /** Extra controls rendered on the right of the toolbar (e.g. an "Add" button). */
  toolbarActions?: ReactNode;
  /** Message shown when there are no rows to display after search/filter. */
  emptyMessage?: ReactNode;
  /** When set, paginate the (searched/filtered) rows client-side at this page size. */
  pageSize?: number;
};

export default function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  searchable = false,
  searchPlaceholder = "Search…",
  searchAccessor,
  filters,
  toolbarActions,
  emptyMessage = "No results found.",
  pageSize,
}: DataTableProps<Row>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        (filters ?? []).map((f) => [f.id, f.defaultValue ?? f.options[0]?.value ?? ""]),
      ),
  );

  const hasToolbar = searchable || (filters?.length ?? 0) > 0 || toolbarActions != null;

  const visibleRows = useMemo(() => {
    let result = rows;

    if (searchable && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((row) =>
        (searchAccessor ? searchAccessor(row) : "").toLowerCase().includes(q),
      );
    }

    for (const filter of filters ?? []) {
      const value = filterValues[filter.id];
      if (value == null || value === "") continue;
      result = result.filter((row) => filter.predicate(row, value));
    }

    return result;
  }, [rows, searchable, search, searchAccessor, filters, filterValues]);

  const totalPages =
    pageSize && pageSize > 0 ? Math.max(1, Math.ceil(visibleRows.length / pageSize)) : 1;

  useEffect(() => {
    setPage(0);
  }, [search, filterValues]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  const pagedRows =
    pageSize && pageSize > 0
      ? visibleRows.slice(page * pageSize, page * pageSize + pageSize)
      : visibleRows;

  return (
    <div>
      {hasToolbar && (
        <div className={styles.toolbarBetween}>
          <div className={styles.toolbarGrow}>
            {searchable && (
              <input
                className={styles.searchInput}
                type="search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search"
              />
            )}
            {filters?.map((filter) => (
              <select
                key={filter.id}
                className={styles.filterSelect}
                value={filterValues[filter.id] ?? ""}
                onChange={(e) =>
                  setFilterValues((prev) => ({ ...prev, [filter.id]: e.target.value }))
                }
                aria-label={filter.label ?? "Filter"}
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
          {toolbarActions != null && (
            <div className={styles.rowActions}>{toolbarActions}</div>
          )}
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.id} className={styles.th}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td className={styles.td} colSpan={columns.length}>
                  <span className={styles.muted}>{emptyMessage}</span>
                </td>
              </tr>
            ) : (
              pagedRows.map((row, rowIndex) => (
                <tr key={getRowKey(row, rowIndex)}>
                  {columns.map((col) => (
                    <td key={col.id} className={styles.td}>
                      {col.cell(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pageSize && pageSize > 0 && visibleRows.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
