import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAdminListComplaints } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Search, Filter, AlertOctagon } from 'lucide-react';

export default function AdminComplaintsList() {
  const [status, setStatus] = useState<string>('all');
  const [department, setDepartment] = useState<string>('all');
  
  const queryParams: any = {};
  if (status !== 'all') queryParams.status = status;
  if (department !== 'all') queryParams.department = department;

  const { data, isLoading } = useAdminListComplaints(queryParams);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'verified': return 'bg-primary/10 text-primary border-primary/20';
      case 'flagged': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Manage Complaints</h1>
          <p className="text-muted-foreground mt-1">Review, route, and resolve civic issues.</p>
        </div>
      </div>

      <Card className="bg-[#11121A] border-white/5 shadow-xl">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px] bg-black/40 border-white/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[160px] bg-black/40 border-white/10">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="roads">Roads</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="sanitation">Sanitation</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-black/20 hover:bg-black/20 border-b border-white/5">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">ID & Date</TableHead>
                <TableHead className="text-muted-foreground font-medium">Title & User</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Dept.</TableHead>
                <TableHead className="text-muted-foreground font-medium">AI Score</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : data?.complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No complaints match filters.</TableCell>
                </TableRow>
              ) : (
                data?.complaints.map(complaint => (
                  <TableRow key={complaint.id} className="border-b border-white/5 hover:bg-white/5">
                    <TableCell>
                      <p className="font-mono text-xs text-primary/80 mb-1">#{complaint.complaintId}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(complaint.createdAt), 'MMM d, yy')}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-white line-clamp-1">{complaint.title}</p>
                      <p className="text-xs text-muted-foreground">{complaint.userName} ({complaint.userEmail})</p>
                      {complaint.urgency === 'high' && <span className="text-[10px] text-destructive uppercase font-bold mt-1 inline-block">High Urgency</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={`text-[10px] ${getStatusColor(complaint.status)} uppercase`}>
                          {complaint.status.replace('_', ' ')}
                        </Badge>
                        {complaint.hasBlackMark && <Badge variant="destructive" className="text-[9px] h-4 px-1">DELAY PENALTY</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {complaint.department ? (
                        <span className="text-xs uppercase bg-white/10 px-2 py-1 rounded text-white/80">{complaint.department}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {complaint.verificationScore !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${complaint.verificationScore > 80 ? 'bg-emerald-500' : complaint.verificationScore > 40 ? 'bg-yellow-500' : 'bg-destructive'}`}
                              style={{ width: `${complaint.verificationScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{complaint.verificationScore}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/complaints/${complaint.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">View Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
