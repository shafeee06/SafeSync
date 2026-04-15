import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useCreateComplaint } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, UploadCloud, Activity, CheckCircle2 } from 'lucide-react';

export default function NewComplaint() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateComplaint();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low'|'medium'|'high'>('medium');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image'|'video'|null>(null);
  
  const [locStatus, setLocStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [coords, setCoords] = useState<{lat: number, lng: number}|null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast({ title: 'Invalid format', description: 'Please upload an image or video.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
      setMediaType(isImage ? 'image' : 'video');
    };
    reader.readAsDataURL(file);
  };

  const captureLocation = () => {
    setLocStatus('loading');
    if (!navigator.geolocation) {
      setLocStatus('error');
      toast({ title: 'Error', description: 'Geolocation not supported.', variant: 'destructive' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('success');
      },
      (err) => {
        setLocStatus('error');
        toast({ title: 'Location Error', description: err.message, variant: 'destructive' });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast({ title: 'Validation', description: 'Title and description are required', variant: 'destructive' });
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        data: {
          title,
          description,
          urgency,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
          deviceInfo: navigator.userAgent,
        }
      });
      toast({ title: 'Success', description: `Report submitted! ID: ${res.complaintId}` });
      setLocation('/dashboard/complaints');
    } catch (err: any) {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Submit Report</h1>
        <p className="text-muted-foreground mt-1">Provide details, photos, and location for your civic issue.</p>
      </div>

      <Card className="bg-card border-white/5 shadow-xl">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 md:p-8 space-y-6">
            
            <div className="space-y-2">
              <Label className="text-white">Title</Label>
              <Input 
                placeholder="e.g. Massive pothole on Main St" 
                value={title} onChange={e => setTitle(e.target.value)}
                className="bg-black/20 border-white/10 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Description</Label>
              <Textarea 
                placeholder="Provide specific details about the issue..." 
                className="min-h-[120px] bg-black/20 border-white/10 resize-none"
                value={description} onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Urgency Level</Label>
                <Select value={urgency} onValueChange={(val: any) => setUrgency(val)}>
                  <SelectTrigger className="bg-black/20 border-white/10 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Minor issue</SelectItem>
                    <SelectItem value="medium">Medium - Needs attention</SelectItem>
                    <SelectItem value="high">High - Dangerous/Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">GPS Location</Label>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={captureLocation}
                    className={`flex-1 h-12 border-white/10 ${locStatus === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-black/20 hover:bg-white/5'}`}
                  >
                    {locStatus === 'idle' && <><MapPin className="w-4 h-4 mr-2" /> Tag Location</>}
                    {locStatus === 'loading' && <><Activity className="w-4 h-4 mr-2 animate-spin" /> Capturing...</>}
                    {locStatus === 'success' && <><CheckCircle2 className="w-4 h-4 mr-2" /> Location Captured</>}
                    {locStatus === 'error' && <><MapPin className="w-4 h-4 mr-2 text-destructive" /> Retry Location</>}
                  </Button>
                </div>
                {coords && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Media Evidence (Required for verification)</Label>
              <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              {!mediaUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-medium text-white">Click to capture or upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Image or short video</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/50 aspect-video md:aspect-[21/9] flex items-center justify-center group">
                  {mediaType === 'image' ? (
                    <img src={mediaUrl} alt="Evidence preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <video src={mediaUrl} controls className="w-full h-full object-contain" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud className="w-4 h-4 mr-2" /> Change Media
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </CardContent>
          <div className="p-6 md:p-8 border-t border-white/5 bg-black/20 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setLocation('/dashboard/complaints')}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 px-8 shadow-lg shadow-primary/20">
              {createMutation.isPending ? <Activity className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Report
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
