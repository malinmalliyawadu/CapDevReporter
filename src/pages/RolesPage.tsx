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
import { PageHeader } from "@/components/ui/page-header";

export function RolesPage() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader title="Roles" description="Manage your roles." />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                type="text"
                placeholder="Software Engineer"
              />
            </div>
          </div>
          <Button className="mt-4">Add Role</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Role Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>Software Engineer</TableCell>
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
                        delete this role from the system.
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
