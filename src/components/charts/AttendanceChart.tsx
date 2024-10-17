import React from "react";
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
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface AttendanceChartProps {
  studentName: string;
  attendanceData: { month: string; present: number; absent: number }[];
}

const chartConfig = {
  present: {
    label: "Present",
    color: "hsl(var(--chart-1))"
  },
  absent: {
    label: "Absent",
    color: "hsl(var(--chart-2))"
  }
} satisfies ChartConfig;

export const AttendanceChart: React.FC<AttendanceChartProps> = ({
  studentName,
  attendanceData
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Chart</CardTitle>
        <CardDescription>Monthly Attendance for {studentName}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={attendanceData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="present"
              type="monotone"
              stroke="var(--color-present)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="absent"
              type="monotone"
              stroke="var(--color-absent)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
