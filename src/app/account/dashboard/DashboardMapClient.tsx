"use client";

import dynamic from "next/dynamic";
import styles from "@/components/account/ResourceList.module.css";
import mapStyles from "./dashboard-map.module.css";

const ChargingStationsMap = dynamic(() => import("./ChargingStationsMap"), {
  ssr: false,
  loading: () => (
    <div className={mapStyles.mapWrap}>
      <p className={styles.muted} style={{ padding: 24 }}>
        Loading map…
      </p>
    </div>
  ),
});

export default function DashboardMapClient() {
  return <ChargingStationsMap />;
}
