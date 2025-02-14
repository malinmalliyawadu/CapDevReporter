import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminTimeAssignment } from "@/types/adminTimeAssignment";
import { roles } from "@/data/roles";
import { timeTypes } from "@/data/timeTypes";
import { useState, useEffect } from "react";

interface EditAssignmentModalProps {
  assignment: AdminTimeAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (assignment: AdminTimeAssignment) => void;
}

export function EditAssignmentModal({
  assignment,
  open,
  onOpenChange,
  onSave,
}: EditAssignmentModalProps) {
  const [editedAssignment, setEditedAssignment] =
    useState<AdminTimeAssignment | null>(null);

  useEffect(() => {
    setEditedAssignment(assignment);
  }, [assignment]);

  if (!editedAssignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select
            onValueChange={(value) =>
              setEditedAssignment({
                ...editedAssignment,
                roleId: Number(value),
              })
            }
            value={String(editedAssignment.roleId)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) =>
              setEditedAssignment({
                ...editedAssignment,
                timeTypeId: Number(value),
              })
            }
            value={String(editedAssignment.timeTypeId)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Time Type" />
            </SelectTrigger>
            <SelectContent>
              {timeTypes.map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            min={0}
            value={editedAssignment.hoursPerWeek}
            onChange={(e) =>
              setEditedAssignment({
                ...editedAssignment,
                hoursPerWeek: parseInt(e.target.value) || 0,
              })
            }
            placeholder="Hours per week"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editedAssignment)}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
