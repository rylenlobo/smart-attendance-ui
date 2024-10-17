"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

const chartConfig = {
  present: {
    label: "Present",
    color: "#2662d9" // Updated color for present
  },
  absent: {
    label: "Absent",
    color: "#e23670" // Updated color for absent
  }
} satisfies ChartConfig;

interface InteractiveBarChartProps {
  attendanceData: { date: string; present: number; absent: number }[];
  activeChart: keyof typeof chartConfig;
  courseId: string;
  setActiveChart: React.Dispatch<
    React.SetStateAction<keyof typeof chartConfig>
  >;
}

export function InteractiveBarChart({
  attendanceData,
  activeChart,
  setActiveChart,
  courseId
}: InteractiveBarChartProps) {
  const handleSetActiveChart = React.useCallback(
    (chart: keyof typeof chartConfig) => {
      setActiveChart(chart);
    },
    [setActiveChart]
  );

  const formattedData = React.useMemo(
    () =>
      attendanceData.map((data) => ({
        ...data,
        date: new Date(data.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        })
      })),
    [attendanceData]
  );

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Bar Chart</CardTitle>
          <CardDescription>{`Showing attendance data ${courseId}`}</CardDescription>
        </div>
        <div className="flex">
          {["present", "absent"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => handleSetActiveChart(chart)}
              >
                <span className="text-lg ">{chartConfig[chart].label}</span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={formattedData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
