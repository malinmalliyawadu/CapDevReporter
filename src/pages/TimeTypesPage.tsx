import { useState } from "react";
import { Pencil, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { timeTypes } from "@/data/timeTypes";
import { TimeType } from "@/types/timeType";

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
              checked={editedTimeType.isCapDev}
              onCheckedChange={(checked) =>
                setEditedTimeType({ ...editedTimeType, isCapDev: checked })
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

export function TimeTypesPage() {
  const [timeTypesList, setTimeTypesList] = useState(timeTypes);
  const [editingTimeType, setEditingTimeType] = useState<TimeType | null>(null);
  const [newTimeType, setNewTimeType] = useState({
    name: "",
    isCapDev: false,
  });

  const handleAddTimeType = () => {
    if (!newTimeType.name.trim()) {
      alert("Please enter a time type name");
      return;
    }

    if (
      timeTypesList.some(
        (type) =>
          type.name.toLowerCase() === newTimeType.name.trim().toLowerCase()
      )
    ) {
      alert("This time type already exists");
      return;
    }

    const timeType = {
      id: Math.max(...timeTypesList.map((type) => type.id)) + 1,
      name: newTimeType.name.trim(),
      isCapDev: newTimeType.isCapDev,
    };

    setTimeTypesList((prev) => [...prev, timeType]);
    setNewTimeType({ name: "", isCapDev: false });
  };

  const handleEditTimeType = (editedTimeType: TimeType) => {
    setTimeTypesList((prev) =>
      prev.map((timeType) =>
        timeType.id === editedTimeType.id ? editedTimeType : timeType
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-500" />
            Time Types
          </span>
        }
        description="Manage your time tracking categories."
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Time Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid items-center gap-1.5">
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
            <div className="flex items-center gap-2">
              <Label htmlFor="is-capdev">CapDev</Label>
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
            <Button
              onClick={handleAddTimeType}
              disabled={!newTimeType.name.trim()}
            >
              Add Time Type
            </Button>
          </div>
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
                <TableHead>Name</TableHead>
                <TableHead>CapDev</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeTypesList.map((timeType) => (
                <TableRow key={timeType.id}>
                  <TableCell>{timeType.id}</TableCell>
                  <TableCell>{timeType.name}</TableCell>
                  <TableCell>{timeType.isCapDev ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTimeType(timeType)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
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
                          <div className="flex justify-end gap-4 mt-4">
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button variant="destructive">Delete</Button>
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
          onSave={handleEditTimeType}
          open={!!editingTimeType}
          onOpenChange={(open) => !open && setEditingTimeType(null)}
        />
      )}
    </div>
  );
}
