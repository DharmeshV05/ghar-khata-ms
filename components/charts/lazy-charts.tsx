"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";

export const SpendTrendChart = dynamic(
  () => import("@/components/charts/spend-trend").then((m) => m.SpendTrendChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const CategoryPie = dynamic(
  () => import("@/components/charts/category-pie").then((m) => m.CategoryPie),
  { loading: () => <ChartSkeleton />, ssr: false }
);
