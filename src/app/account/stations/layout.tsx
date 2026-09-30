import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Charging stations",
    template: "%s · Safaricharge",
  },
};

export { default } from "@/components/SegmentLayout";
