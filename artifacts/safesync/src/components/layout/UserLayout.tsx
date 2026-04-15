import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useListNotifications } from '@workspace/api-client-react';
import { Shield, Home, FileText, PlusCircle, AlertOctagon, Bell, Award, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Overview' },
  { href: '/dashboard/complaints', icon: FileText, label: 'My Complaints' },
  { href: '/dashboard/complaints/new', icon: PlusCircle, label: 'Submit Issue' },
  { href: '/dashboard/sos', icon: AlertOctagon, label: 'Emergency SOS', color: 'text-destructive' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications', hasBadge: true },
  { href: '/dashboard/rewards', icon: Award, label: 'Rewards & Points' },
];

export function UserLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: notificationsData } = useListNotifications({ unreadOnly: true }, { query: { refetchInterval: 30000 } });
  
  const unreadCount = notificationsData?.unreadCount || 0;

  if (!user) return null;

  const NavContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center neon-glow">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl leading-none text-white tracking-wide">SafeSync</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Civic Platform</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block">
              <div className={`
                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                ${isActive ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(138,43,226,0.15)]' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}
              `}>
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${item.color || ''} ${isActive ? 'text-primary' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.hasBadge && unreadCount > 0 && (
                  <Badge variant="default" className="bg-primary hover:bg-primary px-2 min-w-6 flex justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-white shadow-lg">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-muted-foreground border-white/10 hover:bg-white/5" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 h-full z-20 shadow-2xl">
        <NavContent />
      </div>

      {/* Mobile Header & Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-display font-bold text-lg text-white">SafeSync</h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-card border-r-border">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-br from-background to-[#0B0C15] relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
