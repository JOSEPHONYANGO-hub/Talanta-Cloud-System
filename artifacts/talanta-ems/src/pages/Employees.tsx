import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  useListEmployees,
  useSmartSearch,
  useListDepartments,
  useListBranches,
  ListEmployeesStatus
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { 
  Search, Sparkles, UserPlus, Mail, Phone, MapPin, Building2, ChevronRight, CheckCircle2, XCircle
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Employees() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [branch, setBranch] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [isAISearch, setIsAISearch] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Queries
  const { data: departments } = useListDepartments();
  const { data: branches } = useListBranches();
  
  const standardQueryParams = {
    ...(debouncedSearch && !isAISearch ? { search: debouncedSearch } : {}),
    ...(department !== "all" ? { department } : {}),
    ...(branch !== "all" ? { branch } : {}),
    ...(status !== "all" ? { status: status as ListEmployeesStatus } : {}),
  };

  const { data: standardEmployees, isLoading: isStandardLoading } = useListEmployees(
    standardQueryParams,
    { query: { enabled: !isAISearch || !debouncedSearch } }
  );

  const smartSearchMutation = useSmartSearch();
  
  // Trigger AI search on debounce if enabled
  useEffect(() => {
    if (isAISearch && debouncedSearch) {
      smartSearchMutation.mutate({ data: { query: debouncedSearch } });
    }
  }, [debouncedSearch, isAISearch]);

  const employees = isAISearch && debouncedSearch 
    ? smartSearchMutation.data 
    : standardEmployees;
    
  const isLoading = isAISearch && debouncedSearch 
    ? smartSearchMutation.isPending 
    : isStandardLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage and view the entire workforce directory.</p>
        </div>
        <Button asChild data-testid="button-add-employee">
          <Link href="/employees/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Link>
        </Button>
      </div>

      <Card className="bg-white">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 w-full max-w-2xl">
              {isAISearch ? (
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                placeholder={isAISearch ? "E.g., Show me active engineers in New York..." : "Search by name or email..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-9 w-full ${isAISearch ? 'border-primary/50 focus-visible:ring-primary/20 shadow-sm' : ''}`}
                data-testid="input-search-employees"
              />
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <Switch 
                id="ai-mode" 
                checked={isAISearch}
                onCheckedChange={setIsAISearch}
                data-testid="switch-ai-search"
              />
              <Label htmlFor="ai-mode" className="flex items-center gap-1 cursor-pointer">
                AI Search <Sparkles className="h-3 w-3 text-primary" />
              </Label>
            </div>
          </div>

          {!isAISearch && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger data-testid="select-filter-department">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger data-testid="select-filter-branch">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches?.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="pt-2 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employees && employees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <Link key={emp.id} href={`/employees/${emp.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full flex flex-col" data-testid={`card-employee-${emp.id}`}>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                      <AvatarImage src={emp.photoUrl ? `/api/storage${emp.photoUrl}` : undefined} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                        {emp.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {emp.status === 'active' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 gap-1 font-medium">
                        <XCircle className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1" title={emp.fullName}>
                      {emp.fullName}
                    </h3>
                    <p className="text-primary font-medium text-sm line-clamp-1">{emp.jobTitle}</p>
                  </div>
                  
                  <div className="space-y-2 mt-auto text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 line-clamp-1">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{emp.departmentName || "No Department"}</span>
                    </div>
                    <div className="flex items-center gap-2 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{emp.branchName || "No Branch"}</span>
                    </div>
                    <div className="flex items-center gap-2 line-clamp-1">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  </div>
                </CardContent>
                <div className="bg-slate-50 border-t p-3 px-6 text-xs font-medium text-slate-500 flex justify-between items-center rounded-b-xl group-hover:bg-primary/5 transition-colors">
                  <span>Joined {format(new Date(emp.dateOfEmployment), 'yyyy')}</span>
                  <span className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View Profile <ChevronRight className="h-3 w-3 ml-1" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed p-12 text-center flex flex-col items-center justify-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No employees found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {isAISearch && debouncedSearch 
              ? "AI search couldn't find any employees matching your query. Try rephrasing or switching to standard search."
              : search || department !== "all" || branch !== "all" || status !== "all"
                ? "No employees match your current filters. Try adjusting them."
                : "Your directory is empty. Add your first employee to get started."}
          </p>
          {!(search || department !== "all" || branch !== "all" || status !== "all" || isAISearch) && (
            <Button asChild>
              <Link href="/employees/new">Add Employee</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}