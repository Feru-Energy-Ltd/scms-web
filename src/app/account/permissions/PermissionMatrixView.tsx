"use client";

import { getRoleLabel } from "@/lib/auth/roles";
import {
  type MatrixColumn,
  type RoleMatrixRow,
} from "@/lib/security/permissionMatrix";
import matrixStyles from "./permissions.module.css";

function cellClass(shorthand: string): string {
  if (shorthand === "—") {
    return `${matrixStyles.accessCell} ${matrixStyles.accessNone}`;
  }
  return matrixStyles.accessCell;
}

type Props = {
  rows: RoleMatrixRow[];
  columns: MatrixColumn[];
};

export default function PermissionMatrixView({ rows, columns }: Props) {
  return (
    <div className={matrixStyles.matrixWrap}>
      <table className={matrixStyles.matrix}>
        <thead>
          <tr>
            <th className={matrixStyles.roleColHeader}>Role</th>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.roleName}>
              <td className={matrixStyles.roleCol}>{getRoleLabel(row.roleName)}</td>
              {columns.map((col) => {
                const cell = row.cells[col.key];
                const shorthand = cell?.shorthand ?? "—";
                const title =
                  cell && cell.permissions.length > 0
                    ? cell.permissions.join("\n")
                    : "No permissions";
                return (
                  <td key={col.key} className={cellClass(shorthand)} title={title}>
                    {shorthand}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
