import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Shield, LayoutDashboard, ListChecks, BarChart3, History, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/complaints', icon: ListChecks, label: 'Manage Complaints' },
  { href: '/admin/stats', icon: BarChart3, label: 'Performance Stats' },
  { href: '/admin/audit-logs', icon: History, label: 'Audit Logs' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user || user.role !== 'admin') return null;

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#11121A] border-r border-border">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl leading-none text-white tracking-wide">SafeSync</h1>
          <p className="text-xs text-destructive font-semibold uppercase tracking-widest mt-1">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className="block">
              <div className={`
                flex items-center px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                ${isActive ? 'bg-destructive/10 text-destructive border border-destructive/20 shadow-[0_0_15px_rgba(255,51,102,0.1)]' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}
              `}>
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-destructive' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/40">
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-display font-bold text-white shadow-lg border border-white/10">
            A
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-destructive/50 text-destructive">ADMIN</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-muted-foreground border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          End Session
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#0A0A0F] overflow-hidden text-foreground">
      <div className="hidden md:block w-72 h-full z-20 shadow-2xl border-r border-white/5">
        <NavContent />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-[#11121A]/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-destructive" />
            <h1 className="font-display font-bold text-lg text-white">Admin Portal</h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-[#11121A] border-r-border">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
