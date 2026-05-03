import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { format } from "date-fns";
import { 
  useGetEmployee, 
  useDeleteEmployee,
  getListEmployeesQueryKey,
  getGetDashboardStatsQueryKey,
  getGetEmployeesByDepartmentQueryKey,
  getGetEmployeesByBranchQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Building2, MapPin, Mail, Phone, Calendar, 
  Pencil, Trash2, CheckCircle2, XCircle, Briefcase
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const empId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDeleting, setIsDeleting] = useState(false);

  const { data: employee, isLoading, error } = useGetEmployee(empId, {
    query: { enabled: !!empId && !isNaN(empId), queryKey: ["employee", empId] }
  });

  const deleteMutation = useDeleteEmployee({
    mutation: {
      onSuccess: () => {
        toast({ title: "Employee deleted successfully." });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetEmployeesByDepartmentQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetEmployeesByBranchQueryKey() });
        setLocation("/employees");
      },
      onError: () => {
        toast({ title: "Failed to delete employee.", variant: "destructive" });
        setIsDeleting(false);
      }
    }
  });

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Employee not found</h2>
        <p className="text-slate-500 mb-6">The employee you're looking for doesn't exist or has been deleted.</p>
        <Button asChild>
          <Link href="/employees">Back to Directory</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !employee) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="h-32 w-32 rounded-full shrink-0" />
              <div className="space-y-4 flex-1">
                <Skeleton className="h-8 w-[300px]" />
                <Skeleton className="h-5 w-[200px]" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent" data-testid="link-back-employees">
          <Link href="/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild data-testid="btn-edit-employee">
            <Link href={`/employees/${employee.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleting(true)} data-testid="btn-delete-employee">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-t-4 border-t-primary">
            <div className="bg-slate-50 p-6 flex flex-col items-center text-center border-b">
              <Avatar className="h-32 w-32 border-4 border-white shadow-md mb-4">
                <AvatarImage src={employee.photoUrl ? `/api/storage${employee.photoUrl}` : undefined} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl font-medium">
                  {employee.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold text-foreground mb-1" data-testid="text-emp-name">{employee.fullName}</h1>
              <p className="text-primary font-medium mb-3" data-testid="text-emp-title">{employee.jobTitle}</p>
              
              {employee.status === 'active' ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 gap-1 font-medium">
                  <XCircle className="h-3 w-3" /> Inactive
                </Badge>
              )}
            </div>
            
            <CardContent className="p-0">
              <div className="divide-y text-sm">
                <div className="p-4 flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Department</p>
                    <p className="font-medium truncate text-foreground">{employee.departmentName || "Unassigned"}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Branch</p>
                    <p className="font-medium truncate text-foreground">{employee.branchName || "Unassigned"}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hire Date</p>
                    <p className="font-medium truncate text-foreground">
                      {format(new Date(employee.dateOfEmployment), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/5 p-2 rounded-md">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Email Address</p>
                    <a href={`mailto:${employee.email}`} className="text-foreground hover:text-primary font-medium break-all">
                      {employee.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/5 p-2 rounded-md">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Phone Number</p>
                    <a href={`tel:${employee.phone}`} className="text-foreground hover:text-primary font-medium">
                      {employee.phone}
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
              <CardDescription>Key record details available in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Professional Summary</p>
                  <p className="font-medium text-foreground">{employee.summary || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Record Type</p>
                  <p className="font-medium text-foreground">Employee profile</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-xs text-muted-foreground text-center pt-4">
            System Record ID: {employee.id} • Created: {format(new Date(employee.createdAt), 'MMM d, yyyy')}
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {employee.fullName}? This action cannot be undone and will remove all associated data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate({ id: employee.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="btn-confirm-delete-emp"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}