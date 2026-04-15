import React, { useState } from 'react';
import { Link } from 'wouter';
import { useListComplaints, ListComplaintsStatus } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, PlusCircle, Activity, Search, Filter, AlertOctagon } from 'lucide-react';
import { format } from 'date-fns';

export default function ComplaintsList() {
  const [statusFilter, setStatusFilter] = useState<ListComplaintsStatus | 'all'>('all');
  
  const { data, isLoading } = useListComplaints(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );

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
          <h1 className="text-3xl font-display font-bold text-white">My Reports</h1>
          <p className="text-muted-foreground mt-1">Track the status of your civic complaints.</p>
        </div>
        <Link href="/dashboard/complaints/new">
          <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <PlusCircle className="w-4 h-4 mr-2" /> New Report
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-white/5 shadow-xl">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select 
              value={statusFilter} 
              onValueChange={(val) => setStatusFilter(val as any)}
            >
              <SelectTrigger className="w-[180px] bg-black/20 border-white/10">
                <SelectValue placeholder="Filter by status" />
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
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center"><Activity className="w-8 h-8 text-primary animate-spin" /></div>
        ) : data?.complaints.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
            <Search className="w-12 h-12 opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No reports found</h3>
            <p>Try adjusting your filters or submit a new report.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data?.complaints.map((complaint) => (
              <Link key={complaint.id} href={`/dashboard/complaints/${complaint.id}`}>
                <div className="p-4 sm:p-6 hover:bg-white/5 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-primary/70 bg-primary/10 px-2 py-0.5 rounded">
                        #{complaint.complaintId}
                      </span>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(complaint.status)} uppercase tracking-wider`}>
                        {complaint.status.replace('_', ' ')}
                      </Badge>
                      {complaint.hasBlackMark && (
                        <Badge variant="destructive" className="text-xs uppercase tracking-wider bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/20">
                          Delay Flagged
                        </Badge>
                      )}
                      {complaint.urgency === 'high' && (
                        <span className="text-xs text-destructive font-semibold uppercase flex items-center"><AlertOctagon className="w-3 h-3 mr-1"/> High Priority</span>
                      )}
                    </div>
                    <h4 className="font-semibold text-lg text-white group-hover:text-primary transition-colors">{complaint.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{complaint.description}</p>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t border-white/5 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                    <div className="text-xs text-muted-foreground flex flex-col sm:items-end">
                      <span className="hidden sm:inline mb-1">Submitted on</span>
                      <span className="font-medium text-white/80">{format(new Date(complaint.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    {complaint.department && (
                      <span className="text-xs font-medium text-muted-foreground mt-2 bg-white/5 px-2 py-1 rounded-md">
                        Dept: {complaint.department}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
