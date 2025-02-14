import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { timeTypes } from "@/data/timeTypes";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export function TimeTypesPage() {
  const [timeTypesList, setTimeTypesList] = useState(timeTypes);
  const [newTimeTypeName, setNewTimeTypeName] = useState("");

  const handleAddTimeType = () => {
    // Validate time type name
    if (!newTimeTypeName.trim()) {
      alert("Please enter a time type name");
      return;
    }

    // Check for duplicate time type names
    if (
      timeTypesList.some(
        (type) =>
          type.name.toLowerCase() === newTimeTypeName.trim().toLowerCase()
      )
    ) {
      alert("This time type already exists");
      return;
    }

    // Create new time type
    const newTimeType = {
      id: Math.max(...timeTypesList.map((type) => type.id)) + 1,
      name: newTimeTypeName.trim(),
    };

    // Add to list
    setTimeTypesList((prev) => [...prev, newTimeType]);

    // Reset input
    setNewTimeTypeName("");
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Time Types"
        description="Manage your time entry types."
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Time Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="time-type-name">Time Type Name</Label>
              <Input
                id="time-type-name"
                type="text"
                placeholder="Paid Time Off (PTO)"
                value={newTimeTypeName}
                onChange={(e) => setNewTimeTypeName(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={handleAddTimeType}
            disabled={!newTimeTypeName.trim()}
          >
            Add Time Type
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Type List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Time Type Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            {timeTypesList.map((timeType) => (
              <TableRow key={timeType.id}>
                <TableCell>{timeType.id}</TableCell>
                <TableCell>{timeType.name}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton />
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
