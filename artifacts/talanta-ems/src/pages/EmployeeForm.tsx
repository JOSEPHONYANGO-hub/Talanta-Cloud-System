import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetEmployee, 
  useCreateEmployee, 
  useUpdateEmployee,
  useListDepartments,
  useListBranches,
  CreateEmployeeBodyStatus,
  UpdateEmployeeBodyStatus,
  getGetEmployeeQueryKey,
  getListEmployeesQueryKey,
  getGetDashboardStatsQueryKey,
  getGetEmployeesByDepartmentQueryKey,
  getGetEmployeesByBranchQueryKey
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, CalendarIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const employeeSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  departmentId: z.coerce.number().min(1, "Department is required"),
  branchId: z.coerce.number().min(1, "Branch is required"),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  dateOfEmployment: z.date({ required_error: "Date of employment is required" }),
  isActive: z.boolean().default(true),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const empId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: departments, isLoading: isLoadingDepts } = useListDepartments();
  const { data: branches, isLoading: isLoadingBranches } = useListBranches();
  
  const { data: employee, isLoading: isLoadingEmp } = useGetEmployee(empId, {
    query: { enabled: isEditing && !isNaN(empId), queryKey: ["employee", empId] }
  });

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      jobTitle: "",
      departmentId: 0,
      branchId: 0,
      phone: "",
      email: "",
      dateOfEmployment: new Date(),
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditing && employee) {
      form.reset({
        fullName: employee.fullName,
        jobTitle: employee.jobTitle,
        departmentId: employee.departmentId,
        branchId: employee.branchId,
        phone: employee.phone,
        email: employee.email,
        dateOfEmployment: new Date(employee.dateOfEmployment),
        isActive: employee.status === 'active',
      });
      setPhotoUrl(employee.photoUrl || null);
    }
  }, [isEditing, employee, form]);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setPhotoUrl(response.objectPath.startsWith("/api") ? response.objectPath : `/api${response.objectPath}`);
      toast({ title: "Photo uploaded successfully." });
    },
    onError: (err) => {
      toast({ title: "Failed to upload photo.", description: err.message, variant: "destructive" });
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Quick validation
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type. Please select an image.", variant: "destructive" });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large. Maximum size is 5MB.", variant: "destructive" });
      return;
    }

    try {
      const uploaded = await uploadFile(file);
      if (!uploaded) throw new Error("Upload failed");
      const { objectPath } = uploaded;
      setPhotoUrl(objectPath.startsWith("/api") ? objectPath : `/api${objectPath}`);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const createMutation = useCreateEmployee({
    mutation: {
      onSuccess: (newEmp) => {
        invalidateCaches();
        toast({ title: "Employee created successfully." });
        setLocation(`/employees/${newEmp.id}`);
      },
      onError: (err) => {
        toast({ title: "Failed to create employee.", description: err.message, variant: "destructive" });
      }
    }
  });

  const updateMutation = useUpdateEmployee({
    mutation: {
      onSuccess: (updatedEmp) => {
        invalidateCaches();
        queryClient.setQueryData(getGetEmployeeQueryKey(empId), updatedEmp);
        toast({ title: "Employee updated successfully." });
        setLocation(`/employees/${updatedEmp.id}`);
      },
      onError: (err) => {
        toast({ title: "Failed to update employee.", description: err.message, variant: "destructive" });
      }
    }
  });

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetEmployeesByDepartmentQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetEmployeesByBranchQueryKey() });
  };

  const onSubmit = (data: EmployeeFormValues) => {
    const payload = {
      fullName: data.fullName,
      jobTitle: data.jobTitle,
      departmentId: data.departmentId,
      branchId: data.branchId,
      phone: data.phone,
      email: data.email,
      dateOfEmployment: data.dateOfEmployment.toISOString().split('T')[0],
      status: (data.isActive ? "active" : "inactive") as CreateEmployeeBodyStatus & UpdateEmployeeBodyStatus,
      photoUrl: photoUrl
    };

    if (isEditing) {
      updateMutation.mutate({ id: empId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingEmp) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-[200px]" />
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-center"><Skeleton className="h-24 w-24 rounded-full" /></div>
            <div className="grid grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="hover:bg-transparent" data-testid="link-back">
          <Link href={isEditing ? `/employees/${empId}` : "/employees"}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Edit Employee" : "New Employee"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update employee record and details." : "Add a new employee to the organization directory."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>Add a professional headshot for the directory.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-slate-100 shadow-sm">
                <AvatarImage src={photoUrl ? `/api${photoUrl}` : undefined} className="object-cover" />
                <AvatarFallback className="bg-primary/5 text-primary">
                  <ImageIcon className="h-8 w-8 text-primary/40" />
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-3 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Button type="button" variant="outline" className="relative overflow-hidden" disabled={isUploading}>
                    {isUploading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" /> Upload Photo</>
                    )}
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      data-testid="input-photo-upload"
                    />
                  </Button>
                  {photoUrl && (
                    <Button type="button" variant="ghost" className="text-destructive" onClick={() => setPhotoUrl(null)}>
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: Square JPG or PNG, max 5MB.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} data-testid="input-emp-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane.doe@talanta.com" {...field} data-testid="input-emp-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 000-0000" {...field} data-testid="input-emp-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Job Title <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Software Engineer" {...field} data-testid="input-emp-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department <span className="text-destructive">*</span></FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(parseInt(v, 10))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-emp-dept">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((d) => (
                          <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Location <span className="text-destructive">*</span></FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(parseInt(v, 10))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-emp-branch">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches?.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfEmployment"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Hire Date <span className="text-destructive">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="btn-emp-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Is this employee currently active?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-emp-status"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={isEditing ? `/employees/${empId}` : "/employees"}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isMutating} data-testid="button-save-employee">
              {isMutating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                isEditing ? "Update Employee" : "Create Employee"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}