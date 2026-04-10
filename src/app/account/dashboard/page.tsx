import styles from "@/components/account/ResourceList.module.css";
import DashboardMapClient from "./DashboardMapClient";

export default function AccountDashboardMapPage() {
  return (
    <div>
      <h1 className={styles.h1}>Station map</h1>
      <p className={styles.muted}>
        Charge boxes with latitude and longitude appear as markers. Pan and zoom to explore;
        click a marker for details and a link to edit.
      </p>
      <DashboardMapClient />
    </div>
  );
}
