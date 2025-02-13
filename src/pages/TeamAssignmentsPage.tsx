import { Trash2 } from "lucide-react";
import { CardHeader } from "@/components/ui/card";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectValue } from "@/components/ui/select";
import { SelectItem, SelectTrigger } from "@/components/ui/select";
import { teams } from "@/data";
import { DatePicker } from "@/components/ui/datepicker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
export function TeamAssignmentsPage() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Team Assignments"
        description="Assign employees to teams."
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Assign Employee to Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="employee-name">Employee Name</Label>
              <Input
                id="employee-name"
                type="text"
                placeholder="Employee Name"
              />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="start-date">Start Date</Label>
              <DatePicker />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="end-date">End Date</Label>
              <DatePicker />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>Team</Label>
              <Select>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Payroll ID</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="w-[160px]">Hours per week</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
              <TableRow>
                <TableCell>John Doe</TableCell>
                <TableCell>123456</TableCell>
                <TableCell>Team A</TableCell>
                <TableCell>40</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger>
                      <Button
                        variant="destructive"
                        size="sm"
                        // onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently
                          delete your account and remove your data from our
                          servers.
                        </DialogDescription>
                        <div className="flex gap-2 mt-24 justify-end">
                          <Button variant="destructive">Delete</Button>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                        </div>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
