import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useLogin, useAdminLogin } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, ShieldCheck, Mail, Lock, ArrowRight, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const userLogin = useLogin();
  const adminLogin = useAdminLogin();

  const handleSubmit = async (e: React.FormEvent, isAdmin: boolean) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    try {
      const mutation = isAdmin ? adminLogin : userLogin;
      const res = await mutation.mutateAsync({ data: { email, password } });
      login(res.token);
      
      toast({ title: 'Welcome back!', description: 'Login successful.' });
      setLocation(isAdmin ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast({ 
        title: 'Login Failed', 
        description: err.message || 'Invalid credentials.', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 opacity-20">
        <img src={`${import.meta.env.BASE_URL}images/auth-bg.png`} alt="Cyber city map" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 px-4"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center neon-glow mb-4">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="SafeSync Logo" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">SafeSync</h1>
          <p className="text-muted-foreground text-center">Civic Issue Reporting & Emergency Proof</p>
        </div>

        <Card className="glass-panel border-white/10 shadow-2xl">
          <Tabs defaultValue="user" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-black/40 p-1 rounded-lg">
                <TabsTrigger value="user" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                  Citizen
                </TabsTrigger>
                <TabsTrigger value="admin" className="rounded-md data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground transition-all">
                  Official
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <TabsContent value="user" className="mt-0">
              <form onSubmit={(e) => handleSubmit(e, false)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="user-email" 
                        type="email" 
                        placeholder="citizen@example.com" 
                        className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-primary/30"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="user-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-primary/30"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pb-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 h-12 text-md font-semibold"
                    disabled={userLogin.isPending}
                  >
                    {userLogin.isPending ? <Activity className="w-5 h-5 animate-spin" /> : 'Sign In Securely'}
                    {!userLogin.isPending && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    New to SafeSync? <Link href="/register" className="text-primary hover:underline font-medium">Create an account</Link>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="mt-0">
              <form onSubmit={(e) => handleSubmit(e, true)}>
                <CardContent className="space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive/80 mb-2 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Official portal. Hint: Use admin@safesync.com / admin123</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Official Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="admin-email" 
                        type="email" 
                        placeholder="admin@safesync.com" 
                        className="pl-10 bg-black/20 border-white/10 focus:border-destructive focus:ring-destructive/30"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Secure Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="admin-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 bg-black/20 border-white/10 focus:border-destructive focus:ring-destructive/30"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pb-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/25 h-12 text-md font-semibold"
                    disabled={adminLogin.isPending}
                  >
                    {adminLogin.isPending ? <Activity className="w-5 h-5 animate-spin" /> : 'Access Admin Portal'}
                    {!adminLogin.isPending && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}
