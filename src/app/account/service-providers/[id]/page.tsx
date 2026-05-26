"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Tabs from "@/components/account/Tabs";
import { fetchProvider, type ProviderDetail } from "@/lib/api/serviceProviders";
import { fetchProviderStations, type ProviderStation } from "@/lib/api/providerConsole";
import { showApiErrorToast } from "@/lib/toast/showApiErrorToast";
import ProviderHeader from "./ProviderHeader";
import StationsTab from "./StationsTab";
import TeamTab from "./TeamTab";
import PricingTab from "./PricingTab";

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const providerId = Number(id);
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [stations, setStations] = useState<ProviderStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, s] = await Promise.all([
          fetchProvider(providerId),
          fetchProviderStations(providerId, { size: 500 }),
        ]);
        if (!alive) return;
        setProvider(p);
        setStations(s.content ?? []);
      } catch (e) {
        showApiErrorToast(e, { fallbackMessage: "Could not load provider." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [providerId]);

  const totalChargers = stations.reduce((n, s) => n + (s.chargeBoxCount ?? 0), 0);

  return (
    <div>
      <ProviderHeader
        provider={provider}
        loading={loading}
        stats={{ stations: stations.length, chargers: totalChargers }}
        onRefresh={setProvider}
      />
      <Tabs
        tabs={[
          {
            id: "stations",
            label: "Charging Stations",
            content: <StationsTab providerId={providerId} />,
          },
          { id: "team", label: "Team Members", content: <TeamTab providerId={providerId} /> },
          { id: "pricing", label: "Pricing Plan", content: <PricingTab providerId={providerId} /> },
        ]}
      />
    </div>
  );
}
