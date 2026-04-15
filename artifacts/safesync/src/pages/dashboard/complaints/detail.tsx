import React from 'react';
import { useRoute, Link } from 'wouter';
import { useGetComplaint, useRaiseDelayFlag } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, MapPin, Building, Flag, AlertTriangle, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ComplaintDetail() {
  const [, params] = useRoute('/dashboard/complaints/:id');
  const complaintId = parseInt(params?.id || '0');
  const { toast } = useToast();
  
  const { data: complaint, isLoading, refetch } = useGetComplaint(complaintId);
  const flagMutation = useRaiseDelayFlag({
    mutation: {
      onSuccess: () => {
        toast({ title: 'Delay Flag Raised', description: 'This issue has been marked with a black mark penalty.' });
        refetch();
      }
    }
  });

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Activity className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!complaint) return <div className="p-8 text-center text-red-400">Report not found</div>;

  const isOverdue = complaint.slaDeadline && isPast(new Date(complaint.slaDeadline)) && complaint.status !== 'resolved';
  const canFlag = isOverdue && !complaint.hasBlackMark;

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
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/complaints">
        <Button variant="ghost" className="text-muted-foreground hover:text-white px-0 hover:bg-transparent -ml-2 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-sm tracking-wide">#{complaint.complaintId}</span>
            <Badge className={`${getStatusColor(complaint.status)} uppercase tracking-wider text-xs`}>
              {complaint.status.replace('_', ' ')}
            </Badge>
            {complaint.hasBlackMark && (
              <Badge variant="destructive" className="bg-destructive text-white border-none uppercase text-xs">
                ⚫ Black Mark Applied
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-display font-bold text-white leading-tight">{complaint.title}</h1>
        </div>
        
        {canFlag && (
          <Button 
            variant="destructive" 
            className="shadow-lg shadow-destructive/20"
            onClick={() => flagMutation.mutateAsync({ id: complaint.id })}
            disabled={flagMutation.isPending}
          >
            {flagMutation.isPending ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Flag className="w-4 h-4 mr-2" />}
            Raise Delay Flag
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card border-white/5 overflow-hidden shadow-xl">
            {complaint.mediaUrl ? (
              <div className="aspect-video bg-black/80 flex items-center justify-center border-b border-white/5">
                {complaint.mediaType === 'video' ? (
                  <video src={complaint.mediaUrl} controls className="max-h-full max-w-full" />
                ) : (
                  <img src={complaint.mediaUrl} alt="Evidence" className="max-h-full max-w-full object-contain" />
                )}
              </div>
            ) : (
              <div className="aspect-video bg-white/[0.02] flex items-center justify-center border-b border-white/5 text-muted-foreground flex-col">
                <Flag className="w-12 h-12 opacity-20 mb-2" />
                <p>No media evidence provided</p>
              </div>
            )}
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5 shadow-xl">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <CardTitle className="text-lg font-display flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-primary" /> AI Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-medium">Authenticity Score</span>
                  <span className="text-white font-bold">{complaint.verificationScore || 0}%</span>
                </div>
                <Progress 
                  value={complaint.verificationScore || 0} 
                  className="h-2 bg-white/10" 
                  indicatorColor={
                    !complaint.verificationScore ? 'bg-gray-500' :
                    complaint.verificationScore > 80 ? 'bg-emerald-500' : 
                    complaint.verificationScore > 40 ? 'bg-yellow-500' : 'bg-destructive'
                  }
                />
              </div>
              <div className="flex items-center gap-3 bg-black/20 p-4 rounded-lg border border-white/5">
                {complaint.verificationStatus === 'verified' ? (
                  <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> <span className="text-sm font-medium text-emerald-500">Verified by AI System</span></>
                ) : complaint.verificationStatus === 'flagged' ? (
                  <><AlertTriangle className="w-5 h-5 text-destructive" /> <span className="text-sm font-medium text-destructive">Flagged as suspicious</span></>
                ) : (
                  <><Clock className="w-5 h-5 text-yellow-500" /> <span className="text-sm font-medium text-yellow-500">Pending AI Verification</span></>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-white/5 shadow-xl">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 py-4">
              <CardTitle className="text-base font-display">Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-white/5">
              <div className="p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Submitted</p>
                  <p className="text-sm text-white font-medium">{format(new Date(complaint.createdAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
              
              {complaint.department && (
                <div className="p-4 flex items-start gap-3">
                  <Building className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Assigned Dept</p>
                    <p className="text-sm text-white font-medium capitalize">{complaint.department}</p>
                  </div>
                </div>
              )}

              {complaint.slaDeadline && (
                <div className="p-4 flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${isOverdue ? 'text-destructive' : 'text-yellow-500'}`} />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">SLA Deadline</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-destructive' : 'text-white'}`}>
                      {format(new Date(complaint.slaDeadline), 'MMM d, yyyy h:mm a')}
                      {isOverdue && ' (Overdue)'}
                    </p>
                  </div>
                </div>
              )}

              {(complaint.latitude && complaint.longitude) && (
                <div className="p-4 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Location</p>
                    <p className="text-sm text-white font-medium font-mono">{complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}</p>
                  </div>
                </div>
              )}

              <div className="p-4">
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Urgency Level</p>
                 <Badge variant="outline" className={
                   complaint.urgency === 'high' ? 'border-destructive text-destructive' :
                   complaint.urgency === 'medium' ? 'border-yellow-500 text-yellow-500' : 'border-emerald-500 text-emerald-500'
                 }>
                   {complaint.urgency.toUpperCase()}
                 </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
