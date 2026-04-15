import React from 'react';
import { useGetRewardSummary } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, TrendingUp, History } from 'lucide-react';
import { format } from 'date-fns';

export default function Rewards() {
  const { data, isLoading } = useGetRewardSummary();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(138,43,226,0.4)] relative">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
          <Award className="w-10 h-10 text-white relative z-10" />
        </div>
        <h1 className="text-5xl font-display font-bold text-white mb-2">{data?.totalPoints || 0}</h1>
        <p className="text-xl text-primary font-medium tracking-wide uppercase">Civic Points Earned</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-white/5 shadow-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center"><Star className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Base Reward</p><p className="font-bold text-white">+10 pts / verified report</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-white/5 shadow-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">High Urgency Bonus</p><p className="font-bold text-white">+5 pts / critical issue</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-white/5 shadow-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Award className="w-6 h-6 text-emerald-500" /></div>
            <div><p className="text-sm text-muted-foreground">AI Confidence Bonus</p><p className="font-bold text-white">{'+5 pts / >90% score'}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-white/5 shadow-xl mt-8">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="flex items-center text-xl font-display"><History className="w-5 h-5 mr-2 text-primary" /> Point History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : data?.history.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No points earned yet. Keep submitting valid reports!</div>
            ) : (
              data?.history.map((item, i) => (
                <div key={i} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5">
                  <div>
                    <h4 className="font-medium text-white text-lg">{item.complaintTitle}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-muted-foreground">#{item.complaintId}</span>
                      <span className="text-sm text-muted-foreground">{item.reason}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <span className="text-2xl font-bold text-emerald-400 bg-emerald-400/10 px-4 py-1 rounded-lg">+{item.points}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
