"use client";

import * as React from "react";
import { Label, Pie, PieChart, Cell } from "recharts";
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

const COLORS = ["#361041", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export const description = "A donut chart with text";

interface DonutChartWithTextProps {
  departmentData: { department: string; count: number }[];
  totalStudents: number;
}

const chartConfig = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))"
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))"
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))"
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))"
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))"
  }
} satisfies ChartConfig;

export function DonutChartWithText({
  departmentData,
  totalStudents
}: DonutChartWithTextProps) {
  const memoizedDepartmentData = React.useMemo(
    () => departmentData,
    [departmentData]
  );
  const memoizedTotalStudents = React.useMemo(
    () => totalStudents,
    [totalStudents]
  );

  const renderLabel = React.useCallback(
    ({ viewBox }: { viewBox: { cx: number; cy: number } }) => {
      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
        return (
          <text
            x={viewBox.cx}
            y={viewBox.cy}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            <tspan
              x={viewBox.cx}
              y={viewBox.cy}
              className="fill-foreground text-3xl font-bold"
            >
              {memoizedTotalStudents.toLocaleString()}
            </tspan>
            <tspan
              x={viewBox.cx}
              y={(viewBox.cy || 0) + 24}
              className="fill-muted-foreground"
            >
              Students
            </tspan>
          </text>
        );
      }
    },
    [memoizedTotalStudents]
  );

  return (
    <Card className="flex flex-col min-w-96 ">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart </CardTitle>
        <CardDescription>No. Of Students</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={memoizedDepartmentData}
              dataKey="count"
              nameKey="department"
              innerRadius={60}
              strokeWidth={5}
            >
              {memoizedDepartmentData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
              <Label content={renderLabel} />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
