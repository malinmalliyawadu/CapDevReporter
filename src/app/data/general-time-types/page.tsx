"use client";

import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { Pencil, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import type { RouterOutputs } from "@/utils/trpc";

type TimeType = RouterOutputs["timeType"]["getAll"][number];

interface EditTimeTypeDialogProps {
  timeType: TimeType;
  onSave: (timeType: TimeType) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditTimeTypeDialog({
  timeType,
  onSave,
  open,
  onOpenChange,
}: EditTimeTypeDialogProps) {
  const [editedTimeType, setEditedTimeType] = useState<TimeType>(timeType);

  const handleSave = () => {
    onSave(editedTimeType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Time Type</DialogTitle>
          <DialogDescription>
            Make changes to the time type details here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="edit-time-type-name">Time Type Name</Label>
            <Input
              id="edit-time-type-name"
              value={editedTimeType.name}
              onChange={(e) =>
                setEditedTimeType({ ...editedTimeType, name: e.target.value })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-is-capdev">CapDev Time</Label>
            <Switch
              id="edit-is-capdev"
              checked={editedTimeType.isCapDev ?? false}
              onCheckedChange={(checked) =>
                setEditedTimeType((prev) => ({
                  ...prev,
                  isCapDev: checked,
                }))
              }
            />
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TimeTypesPage() {
  const { toast } = useToast();
  const utils = trpc.useContext();
  const { data: timeTypes, isLoading } = trpc.timeType.getAll.useQuery();
  const [editingTimeType, setEditingTimeType] = useState<TimeType | null>(null);
  const [newTimeType, setNewTimeType] = useState({
    name: "",
    isCapDev: false,
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const createTimeType = trpc.timeType.create.useMutation({
    onSuccess: () => {
      utils.timeType.getAll.invalidate();
      setIsAddDialogOpen(false);
      setNewTimeType({ name: "", isCapDev: false });
      toast({
        title: "Success",
        description: "Time type created successfully",
      });
    },
  });

  const updateTimeType = trpc.timeType.update.useMutation({
    onSuccess: () => {
      utils.timeType.getAll.invalidate();
      setEditingTimeType(null);
      toast({
        title: "Success",
        description: "Time type updated successfully",
      });
    },
  });

  const deleteTimeType = trpc.timeType.delete.useMutation({
    onSuccess: () => {
      utils.timeType.getAll.invalidate();
      toast({
        title: "Success",
        description: "Time type deleted successfully",
      });
    },
  });

  const handleCreateTimeType = () => {
    if (!newTimeType.name.trim()) {
      toast({
        title: "Error",
        description: "Time type name is required",
        variant: "destructive",
      });
      return;
    }

    createTimeType.mutate(newTimeType);
  };

  const handleUpdateTimeType = (timeType: TimeType) => {
    updateTimeType.mutate({
      id: timeType.id,
      name: timeType.name,
      isCapDev: timeType.isCapDev ?? false,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-500" />
            Time Types
          </span>
        }
        description="Manage your time tracking categories."
      />

      <div className="mb-6 flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Time Type</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Time Type</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="time-type-name">Time Type Name</Label>
                <Input
                  id="time-type-name"
                  value={newTimeType.name}
                  onChange={(e) =>
                    setNewTimeType({ ...newTimeType, name: e.target.value })
                  }
                  placeholder="Enter time type name"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-capdev">CapDev Time</Label>
                <Switch
                  id="is-capdev"
                  checked={newTimeType.isCapDev}
                  onCheckedChange={(checked) =>
                    setNewTimeType({
                      ...newTimeType,
                      isCapDev: checked,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCreateTimeType}
                disabled={createTimeType.isPending}
              >
                {createTimeType.isPending ? "Creating..." : "Create Time Type"}
              </Button>
            </div>
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
                <TableHead>Name</TableHead>
                <TableHead>CapDev</TableHead>
                <TableHead>Time Entries</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeTypes?.map((timeType) => (
                <TableRow key={timeType.id}>
                  <TableCell>{timeType.name}</TableCell>
                  <TableCell>{timeType.isCapDev ? "Yes" : "No"}</TableCell>
                  <TableCell>{timeType.timeEntries.length}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog
                        open={editingTimeType?.id === timeType.id}
                        onOpenChange={(open) =>
                          !open && setEditingTimeType(null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTimeType(timeType)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Time Type</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="edit-time-type-name">
                                Time Type Name
                              </Label>
                              <Input
                                id="edit-time-type-name"
                                value={editingTimeType?.name}
                                onChange={(e) =>
                                  setEditingTimeType((prev) =>
                                    prev
                                      ? { ...prev, name: e.target.value }
                                      : null
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit-is-capdev">
                                CapDev Time
                              </Label>
                              <Switch
                                id="edit-is-capdev"
                                checked={editingTimeType?.isCapDev ?? false}
                                onCheckedChange={(checked) =>
                                  setEditingTimeType((prev) =>
                                    prev ? { ...prev, isCapDev: checked } : null
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              onClick={() =>
                                editingTimeType &&
                                handleUpdateTimeType(editingTimeType)
                              }
                              disabled={updateTimeType.isPending}
                            >
                              {updateTimeType.isPending
                                ? "Updating..."
                                : "Update Time Type"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will
                              permanently delete this time type from the system.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-4">
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              onClick={() => deleteTimeType.mutate(timeType.id)}
                              disabled={deleteTimeType.isPending}
                            >
                              {deleteTimeType.isPending
                                ? "Deleting..."
                                : "Delete"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingTimeType && (
        <EditTimeTypeDialog
          timeType={editingTimeType}
          onSave={handleUpdateTimeType}
          open={!!editingTimeType}
          onOpenChange={(open) => !open && setEditingTimeType(null)}
        />
      )}
    </div>
  );
}
