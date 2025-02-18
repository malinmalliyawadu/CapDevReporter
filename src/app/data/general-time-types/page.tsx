"use client";

import { useState } from "react";
import { Pencil, Trash2, Clock, Plus } from "lucide-react";
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
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { trpc, type RouterOutputs } from "@/trpc/client";

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
  const { data: timeTypes } = trpc.timeType.getAll.useQuery();
  const [editingTimeType, setEditingTimeType] = useState<TimeType | null>(null);
  const [, setIsAddDialogOpen] = useState(false);

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

  const handleUpdateTimeType = (timeType: TimeType) => {
    updateTimeType.mutate({
      id: timeType.id,
      name: timeType.name,
      isCapDev: timeType.isCapDev ?? false,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-purple-500" />
            Time Types
          </span>
        }
        description="Manage time tracking categories."
      />

      <div className="flex justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Time Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeTypes?.map((timeType) => (
                <TableRow key={timeType.id}>
                  <TableCell>{timeType.name}</TableCell>
                  <TableCell>
                    {timeType.isCapDev ? "CapDev" : "Non-CapDev"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTimeType(timeType)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTimeType.mutate(timeType.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
