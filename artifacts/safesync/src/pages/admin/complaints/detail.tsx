import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useAdminGetComplaint, useAdminAssignComplaint, useAdminVerifyComplaint } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Phone, Mail, MapPin, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AdminComplaintDetail() {
  const [, params] = useRoute('/admin/complaints/:id');
  const id = parseInt(params?.id || '0');
  const { toast } = useToast();
  
  const { data: complaint, isLoading, refetch } = useAdminGetComplaint(id);
  const assignMutation = useAdminAssignComplaint();
  const verifyMutation = useAdminVerifyComplaint();

  // Assignment State
  const [dept, setDept] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [slaHours, setSlaHours] = useState<string>('48');

  // Manual Verify State
  const [manualScore, setManualScore] = useState<string>('100');
  const [manualStatus, setManualStatus] = useState<'verified'|'flagged'>('verified');

  useEffect(() => {
    if (complaint?.department) setDept(complaint.department);
    if (complaint?.status) setStatus(complaint.status);
  }, [complaint?.id]);

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Activity className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!complaint) return <div className="p-8 text-center text-red-400">Report not found</div>;

  // Smart routing suggestion
  const getSuggestedDept = () => {
    const text = (complaint.title + " " + complaint.description).toLowerCase();
    if (/(pothole|road|street|pavement|traffic|bridge)/.test(text)) return 'roads';
    if (/(water|pipe|leak|flood|sewage|drain)/.test(text)) return 'water';
    if (/(power|electric|light|outage|wire|cable)/.test(text)) return 'electricity';
    if (/(garbage|waste|trash|smell|rats)/.test(text)) return 'sanitation';
    return 'general';
  };
  const suggestedDept = getSuggestedDept();

  const handleAssign = async () => {
    try {
      await assignMutation.mutateAsync({
        id: complaint.id,
        data: {
          department: dept as any || 'general',
          status: status as any || complaint.status,
          slaHours: parseInt(slaHours)
        }
      });
      toast({ title: 'Updated Successfully', description: 'Complaint routing and status updated.' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleManualVerify = async () => {
    try {
      await verifyMutation.mutateAsync({
        id: complaint.id,
        data: {
          verificationScore: parseInt(manualScore),
          verificationStatus: manualStatus
        }
      });
      toast({ title: 'Verification Updated', description: 'Manual verification applied.' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Verification Failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/admin/complaints">
        <Button variant="ghost" className="text-muted-foreground hover:text-white px-0 hover:bg-transparent -ml-2 mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Complaints
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-sm tracking-wide">#{complaint.complaintId}</span>
            <Badge variant="outline" className="text-xs uppercase">{complaint.status}</Badge>
            {complaint.hasBlackMark && <Badge variant="destructive" className="text-xs uppercase">⚫ Delay Penalty Applied</Badge>}
          </div>
          <h1 className="text-3xl font-display font-bold text-white leading-tight">{complaint.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Media & Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#11121A] border-white/5 shadow-xl overflow-hidden">
            {complaint.mediaUrl ? (
              <div className="aspect-video bg-black flex items-center justify-center border-b border-white/5">
                 {complaint.mediaType === 'video' ? (
                  <video src={complaint.mediaUrl} controls className="max-h-full max-w-full" />
                ) : (
                  <img src={complaint.mediaUrl} alt="Evidence" className="max-h-full max-w-full object-contain" />
                )}
              </div>
            ) : (
              <div className="h-48 bg-white/[0.02] flex items-center justify-center border-b border-white/5 text-muted-foreground">
                No Media Evidence
              </div>
            )}
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#11121A] border-white/5 shadow-xl">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <CardTitle className="text-lg text-white">Reporter Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><User className="w-5 h-5 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground uppercase">Name</p><p className="text-sm font-medium text-white">{complaint.userName}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><Mail className="w-5 h-5 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground uppercase">Email</p><p className="text-sm font-medium text-white">{complaint.userEmail}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><Phone className="w-5 h-5 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground uppercase">Phone</p><p className="text-sm font-medium text-white">{complaint.userPhone}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          
          <Card className="bg-[#11121A] border-white/5 shadow-xl border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="text-lg text-white">Route & Assign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedDept && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm flex items-start gap-2">
                  <Activity className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-primary/90">
                    Smart Routing suggests: <strong className="uppercase">{suggestedDept}</strong> based on content analysis.
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Assign Department</Label>
                <Select value={dept || suggestedDept} onValueChange={setDept}>
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roads">Roads</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="sanitation">Sanitation</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select value={status || complaint.status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SLA Hours (Deadline)</Label>
                <Input type="number" value={slaHours} onChange={e => setSlaHours(e.target.value)} className="bg-black/40 border-white/10" />
              </div>
              <Button onClick={handleAssign} disabled={assignMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white">
                {assignMutation.isPending ? 'Updating...' : 'Save Assignment & Status'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#11121A] border-white/5 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white flex justify-between items-center">
                Verification
                {complaint.verificationScore !== null ? (
                  <Badge className="bg-emerald-500/20 text-emerald-500">{complaint.verificationScore}%</Badge>
                ) : (
                  <Badge variant="outline">Unverified</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Override or set the verification status manually if the automated system failed or needs correction.</p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10">Manual Override</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#11121A] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>Manual Verification Override</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Confidence Score (0-100)</Label>
                      <Input type="number" min="0" max="100" value={manualScore} onChange={e => setManualScore(e.target.value)} className="bg-black/40 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Status Override</Label>
                      <Select value={manualStatus} onValueChange={(v:any) => setManualStatus(v)}>
                        <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verified">Verified - Authentic</SelectItem>
                          <SelectItem value="flagged">Flagged - Suspicious</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleManualVerify} disabled={verifyMutation.isPending} className="w-full bg-primary hover:bg-primary/90">
                      Apply Override
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
