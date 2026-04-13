import type { ReactNode } from "react";
import styles from "./ResourceList.module.css";

export type DataTableColumn<Row> = {
  id: string;
  header: ReactNode;
  cell: (row: Row, rowIndex: number) => ReactNode;
};

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row, rowIndex: number) => React.Key;
};

export default function DataTable<Row>({
  columns,
  rows,
  getRowKey,
}: DataTableProps<Row>) {
  return (
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
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((col) => (
                <td key={col.id} className={styles.td}>
                  {col.cell(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
