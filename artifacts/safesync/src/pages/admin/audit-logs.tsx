import React from 'react';
import { useAdminGetAuditLogs } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { History } from 'lucide-react';

export default function AuditLogs() {
  const { data, isLoading } = useAdminGetAuditLogs({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Immutable record of system actions and modifications.</p>
        </div>
      </div>

      <Card className="bg-[#11121A] border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-black/20 border-b border-white/5">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium w-[200px]">Timestamp</TableHead>
                <TableHead className="text-muted-foreground font-medium">Actor</TableHead>
                <TableHead className="text-muted-foreground font-medium">Action</TableHead>
                <TableHead className="text-muted-foreground font-medium">Target Entity</TableHead>
                <TableHead className="text-muted-foreground font-medium">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Loading audit records...</TableCell>
                </TableRow>
              ) : data?.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <History className="w-8 h-8 opacity-20 mb-2" />
                      <p>No audit logs available.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.logs.map(log => (
                  <TableRow key={log.id} className="border-b border-white/5 hover:bg-white/5">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/5 text-white/80 border-white/10">
                        {log.performedBy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                        log.action.includes('update') ? 'text-blue-400' : 
                        log.action.includes('create') ? 'text-emerald-400' : 
                        log.action.includes('delete') ? 'text-destructive' : 'text-primary'
                      }`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-white">{log.entityType} #{log.entityId}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.details || '-'}
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
