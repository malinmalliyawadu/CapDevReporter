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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TimeTypesPage() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Time Types</h1>
        <p className="text-muted-foreground">Manage your time entry types.</p>
      </div>

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
              />
            </div>
          </div>
          <Button className="mt-4">Add Time Type</Button>
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
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>Regular Hours</TableCell>
              <TableCell>
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
                        This action cannot be undone. This will permanently
                        delete this time type from the system.
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
            <TableRow>
              <TableCell>2</TableCell>
              <TableCell>Paid Time Off (PTO)</TableCell>
              <TableCell>
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
                        This action cannot be undone. This will permanently
                        delete this time type from the system.
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
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
