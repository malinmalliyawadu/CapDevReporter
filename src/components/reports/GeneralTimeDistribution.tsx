import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface GeneralTimeDistributionProps {
  generalTimeAssignments: Array<{
    id: string;
    roleId: string;
    timeTypeId: string;
    hoursPerWeek: number;
    timeType: {
      id: string;
      name: string;
      isCapDev: boolean;
    };
  }>;
  timeTypes: Array<{
    id: string;
    name: string;
  }>;
  roles: Array<{
    id: string;
    name: string;
  }>;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#A4DE6C",
  "#D0ED57",
];

export function GeneralTimeDistribution({
  generalTimeAssignments,
  timeTypes,
  roles,
}: GeneralTimeDistributionProps) {
  const [selectedRole, setSelectedRole] = React.useState<string>("all");

  const filteredAssignments =
    selectedRole === "all"
      ? generalTimeAssignments
      : generalTimeAssignments.filter((a) => a.roleId === selectedRole);

  const chartData = timeTypes
    .map((type) => ({
      name: type.name,
      value: filteredAssignments
        .filter((a) => a.timeTypeId === type.id)
        .reduce((sum, a) => sum + a.hoursPerWeek, 0),
    }))
    .filter((d) => d.value > 0);

  const totalHours = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Time Distribution</CardTitle>
        <CardDescription>
          Default time allocation across different time types
        </CardDescription>
        <div className="mt-2">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) =>
                  `${name} (${Math.round((value / totalHours) * 100)}%)`
                }
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
