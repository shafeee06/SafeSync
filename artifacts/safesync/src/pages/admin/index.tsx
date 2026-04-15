import React from 'react';
import { useAdminGetStats } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle2, Clock, AlertTriangle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const { data, isLoading } = useAdminGetStats();

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
    <Card className="bg-[#11121A] border-white/5 shadow-lg">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value || 0}</h3>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">System Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time civic issue reporting metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Issues" value={data?.totalComplaints} icon={FileText} colorClass="text-blue-400" bgClass="bg-blue-400/10" />
        <StatCard title="Pending" value={data?.pendingComplaints} icon={Clock} colorClass="text-yellow-500" bgClass="bg-yellow-500/10" />
        <StatCard title="Resolved" value={data?.resolvedComplaints} icon={CheckCircle2} colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
        <StatCard title="Flagged/Delayed" value={data?.flaggedComplaints} icon={AlertTriangle} colorClass="text-destructive" bgClass="bg-destructive/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-[#11121A] border-white/5 shadow-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display text-white">Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {data?.departmentStats && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departmentStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="department" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#1E1E2F', borderColor: '#ffffff20', borderRadius: '8px' }} />
                    <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#10B981" radius={[0,0,4,4]} />
                    <Bar dataKey="delayed" name="Delayed" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="blackMarks" name="Black Marks" stackId="a" fill="#EF4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#11121A] border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-display text-white">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Users className="text-primary w-5 h-5" />
                <span className="font-medium text-white">Total Citizens</span>
              </div>
              <span className="font-bold text-xl text-white">{data?.totalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-destructive w-5 h-5" />
                <span className="font-medium text-destructive">Total Black Marks</span>
              </div>
              <span className="font-bold text-xl text-destructive">{data?.blackMarksCount || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary w-5 h-5" />
                <span className="font-medium text-primary">AI Verified</span>
              </div>
              <span className="font-bold text-xl text-primary">{data?.verifiedComplaints || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
