import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useListComplaints, useGetRewardSummary } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertOctagon, CheckCircle2, Clock, Activity, Award, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: complaintsData, isLoading: isLoadingComplaints } = useListComplaints({ limit: 5 });
  const { data: rewardData } = useGetRewardSummary();

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's the current status of your civic reports.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/complaints/new">
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <PlusCircle className="w-4 h-4 mr-2" /> New Report
            </Button>
          </Link>
          <Link href="/dashboard/sos">
            <Button variant="destructive" className="shadow-lg shadow-destructive/20">
              <AlertOctagon className="w-4 h-4 mr-2" /> SOS Emergency
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-white/5 shadow-xl hover-elevate">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
              <h3 className="text-2xl font-bold text-white">{complaintsData?.total || 0}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-white/5 shadow-xl hover-elevate">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Action</p>
              <h3 className="text-2xl font-bold text-white">
                {complaintsData?.complaints.filter(c => ['pending', 'verified'].includes(c.status)).length || 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5 shadow-xl hover-elevate">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved</p>
              <h3 className="text-2xl font-bold text-white">
                {complaintsData?.complaints.filter(c => c.status === 'resolved').length || 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/20 to-accent/10 border-primary/20 shadow-xl shadow-primary/5 hover-elevate">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-foreground/80">Civic Points</p>
              <h3 className="text-2xl font-bold text-white">{rewardData?.totalPoints || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-white">Recent Reports</h2>
            <Link href="/dashboard/complaints" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          
          <Card className="bg-card border-white/5 shadow-xl overflow-hidden">
            {isLoadingComplaints ? (
              <div className="p-8 flex justify-center"><Activity className="w-8 h-8 text-primary animate-spin" /></div>
            ) : complaintsData?.complaints.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <FileText className="w-12 h-12 opacity-20 mb-3" />
                <p>No reports submitted yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {complaintsData?.complaints.map((complaint) => (
                  <Link key={complaint.id} href={`/dashboard/complaints/${complaint.id}`}>
                    <div className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between group">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">#{complaint.complaintId}</span>
                          <Badge variant="outline" className={`text-[10px] h-5 ${getStatusColor(complaint.status)} uppercase`}>
                            {complaint.status.replace('_', ' ')}
                          </Badge>
                          {complaint.hasBlackMark && <span title="Delay Flagged">⚫</span>}
                        </div>
                        <h4 className="font-medium text-white truncate group-hover:text-primary transition-colors">{complaint.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{complaint.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{format(new Date(complaint.createdAt), 'MMM d, yyyy')}</p>
                        {complaint.department && (
                          <Badge variant="secondary" className="mt-2 text-[10px] bg-white/5">{complaint.department}</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold text-white">How it works</h2>
          <Card className="bg-card border-white/5 shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">1</div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Report Issue</h4>
                  <p className="text-xs text-muted-foreground mt-1">Submit photo, video, and location of the civic issue.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">2</div>
                <div>
                  <h4 className="text-sm font-semibold text-white">AI Verification</h4>
                  <p className="text-xs text-muted-foreground mt-1">Our system analyzes the media for authenticity.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">3</div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Earn Points</h4>
                  <p className="text-xs text-muted-foreground mt-1">Get rewarded when your verified issue is resolved.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
