"use client";

import { useState } from "react";
import { Clock, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { trpc } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function GeneralTimeTypesPage() {
  const [newTypeName, setNewTypeName] = useState("");
  const [open, setOpen] = useState(false);

  const { data: timeTypes, refetch: refetchTimeTypes } =
    trpc.timeType.getAll.useQuery();
  const { mutate: createTimeType } = trpc.timeType.create.useMutation({
    onSuccess: () => {
      refetchTimeTypes();
      setNewTypeName("");
      toast.success("Time type created successfully");
    },
    onError: () => {
      toast.error("Failed to create time type");
    },
  });
  const { mutate: deleteTimeType } = trpc.timeType.delete.useMutation({
    onSuccess: () => {
      refetchTimeTypes();
      toast.success("Time type deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete time type");
    },
  });

  const handleAddTimeType = () => {
    if (!newTypeName.trim()) {
      toast.error("Please enter a time type name");
      return;
    }

    if (
      timeTypes?.some(
        (type) => type.name.toLowerCase() === newTypeName.trim().toLowerCase()
      )
    ) {
      toast.error("This time type already exists");
      return;
    }

    createTimeType({
      name: newTypeName.trim(),
    });
    setOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-500" />
              General Time Types
            </span>
          }
          description="Manage general time tracking categories."
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Time Type</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="time-type-name">Time Type Name</Label>
                <Input
                  id="time-type-name"
                  type="text"
                  placeholder="Administrative"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddTimeType}
                disabled={!newTypeName.trim()}
              >
                Add Time Type
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Type List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type Name</TableHead>
                <TableHead>Time Entries</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeTypes?.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-100">
                      {type.timeEntries.length} entries
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => deleteTimeType(type.id)}
                      disabled={type.timeEntries.length > 0}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
