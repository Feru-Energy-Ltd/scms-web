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
  /** Client-side predicate. Ignored in manual (server-side) mode. */
  predicate?: (row: Row, value: string) => boolean;
  defaultValue?: string;
};

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row, rowIndex: number) => React.Key;
  /** Show a search bar above the table. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Client-side: returns the searchable text for a row. */
  searchAccessor?: (row: Row) => string;
  /** Controlled search value (server-side mode). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Dropdown filters rendered next to the search bar. */
  filters?: DataTableFilter<Row>[];
  /** Controlled filter values keyed by filter id (server-side mode). */
  filterValues?: Record<string, string>;
  onFilterChange?: (id: string, value: string) => void;
  /** Extra controls rendered on the right of the toolbar (e.g. an "Add" button). */
  toolbarActions?: ReactNode;
  /** Message shown when there are no rows to display. */
  emptyMessage?: ReactNode;
  /** Client-side page size. Ignored when pagination is controlled. */
  pageSize?: number;
  /** Controlled pagination (server-side mode). */
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  /**
   * When true, the component does not filter or paginate rows itself; it renders
   * exactly the `rows` given and delegates search/filter/paging to the parent via
   * the controlled props above. Use for server-side data.
   */
  manual?: boolean;
  /** Show a loading state inside the table body (keeps the toolbar mounted). */
  loading?: boolean;
};

export default function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  searchable = false,
  searchPlaceholder = "Search…",
  searchAccessor,
  searchValue,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  toolbarActions,
  emptyMessage = "No results found.",
  pageSize,
  page,
  totalPages,
  onPageChange,
  manual = false,
  loading = false,
}: DataTableProps<Row>) {
  const controlledSearch = onSearchChange != null;
  const controlledFilters = onFilterChange != null;
  const controlledPage = onPageChange != null;

  const [internalSearch, setInternalSearch] = useState("");
  const [internalPage, setInternalPage] = useState(0);
  const [internalFilterValues, setInternalFilterValues] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        (filters ?? []).map((f) => [f.id, f.defaultValue ?? f.options[0]?.value ?? ""]),
      ),
  );

  const searchVal = controlledSearch ? (searchValue ?? "") : internalSearch;
  const setSearchVal = (v: string) =>
    controlledSearch ? onSearchChange!(v) : setInternalSearch(v);

  const activeFilterValues = controlledFilters
    ? (filterValues ?? {})
    : internalFilterValues;
  const setFilterVal = (id: string, v: string) =>
    controlledFilters
      ? onFilterChange!(id, v)
      : setInternalFilterValues((prev) => ({ ...prev, [id]: v }));

  const hasToolbar = searchable || (filters?.length ?? 0) > 0 || toolbarActions != null;

  const visibleRows = useMemo(() => {
    if (manual) return rows;
    let result = rows;

    if (searchable && searchVal.trim()) {
      const q = searchVal.trim().toLowerCase();
      result = result.filter((row) =>
        (searchAccessor ? searchAccessor(row) : "").toLowerCase().includes(q),
      );
    }

    for (const filter of filters ?? []) {
      const value = activeFilterValues[filter.id];
      if (value == null || value === "" || !filter.predicate) continue;
      result = result.filter((row) => filter.predicate!(row, value));
    }

    return result;
  }, [manual, rows, searchable, searchVal, searchAccessor, filters, activeFilterValues]);

  const clientPaged = !manual && pageSize != null && pageSize > 0;

  const computedTotalPages = manual
    ? Math.max(1, totalPages ?? 1)
    : clientPaged
      ? Math.max(1, Math.ceil(visibleRows.length / pageSize!))
      : 1;

  const currentPage = controlledPage ? (page ?? 0) : internalPage;

  useEffect(() => {
    if (!controlledPage) setInternalPage(0);
  }, [controlledPage, searchVal, internalFilterValues]);

  useEffect(() => {
    if (!controlledPage && currentPage > computedTotalPages - 1) setInternalPage(0);
  }, [controlledPage, currentPage, computedTotalPages]);

  const pagedRows = clientPaged
    ? visibleRows.slice(currentPage * pageSize!, currentPage * pageSize! + pageSize!)
    : visibleRows;

  const showPagination = manual
    ? controlledPage && totalPages != null
    : clientPaged && visibleRows.length > 0;

  const handlePageChange = (p: number) =>
    controlledPage ? onPageChange!(p) : setInternalPage(p);

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
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                aria-label="Search"
              />
            )}
            {filters?.map((filter) => (
              <select
                key={filter.id}
                className={styles.filterSelect}
                value={activeFilterValues[filter.id] ?? ""}
                onChange={(e) => setFilterVal(filter.id, e.target.value)}
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
            {loading ? (
              <tr>
                <td className={styles.td} colSpan={columns.length}>
                  <span className={styles.muted}>Loading…</span>
                </td>
              </tr>
            ) : pagedRows.length === 0 ? (
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
      {showPagination && (
        <Pagination
          page={currentPage}
          totalPages={computedTotalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
