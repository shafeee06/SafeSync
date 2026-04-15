import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCreateSosRecording, useListSosRecordings } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertOctagon, Mic, Video, Square, Clock, MapPin, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

type RecordMode = 'audio' | 'video';

function BlobPlayer({ dataUrl, mediaType }: { dataUrl: string; mediaType: 'audio' | 'video' }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!dataUrl) return;
    if (dataUrl.startsWith('blob:')) {
      setBlobUrl(dataUrl);
      return;
    }
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? (mediaType === 'video' ? 'video/webm' : 'audio/webm');
    const bytes = atob(base64);
    const buf = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
    const blob = new Blob([buf], { type: mime });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [dataUrl, mediaType]);

  if (!blobUrl) return <span className="text-xs text-muted-foreground">Loading...</span>;

  if (mediaType === 'video') {
    return <video src={blobUrl} controls className="w-full max-h-48 rounded-lg bg-black" />;
  }
  return <audio src={blobUrl} controls className="h-10 w-full sm:w-64" />;
}

export default function SosPage() {
  const { toast } = useToast();
  const createSosMutation = useCreateSosRecording();
  const { data: history, refetch } = useListSosRecordings();

  const [mode, setMode] = useState<RecordMode>('audio');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopStream();
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const constraints =
        mode === 'video'
          ? { video: { facingMode: 'environment' }, audio: true }
          : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mode === 'video' && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }

      const mimeType = mode === 'video' ? 'video/webm' : 'audio/webm';
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : '',
      });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const finalMime = mode === 'video' ? 'video/webm' : 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          try {
            await createSosMutation.mutateAsync({
              data: {
                mediaType: mode,
                mediaUrl: base64data,
                duration: recordingTime,
                latitude: coords?.lat ?? null,
                longitude: coords?.lng ?? null,
              },
            });
            toast({ title: 'SOS Recorded', description: 'Emergency recording securely saved to cloud.' });
            refetch();
          } catch {
            toast({ title: 'Failed to save', variant: 'destructive' });
          }
          setRecordingTime(0);
          stopStream();
          if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = null;
          }
        };
      };

      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      toast({
        title: mode === 'video' ? 'Camera/Microphone access denied' : 'Microphone access denied',
        description: `Please allow ${mode === 'video' ? 'camera and microphone' : 'microphone'} access to use SOS feature.`,
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const switchMode = (newMode: RecordMode) => {
    if (isRecording) return;
    setMode(newMode);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertOctagon className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-3">Emergency SOS</h1>
        <p className="text-muted-foreground text-lg">
          Record verifiable audio or video evidence that is instantly timestamped and synced to the cloud.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => switchMode('audio')}
            disabled={isRecording}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'audio'
                ? 'bg-destructive text-white shadow-lg'
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Mic className="w-4 h-4" /> Voice
          </button>
          <button
            onClick={() => switchMode('video')}
            disabled={isRecording}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'video'
                ? 'bg-destructive text-white shadow-lg'
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Video className="w-4 h-4" /> Video
          </button>
        </div>
      </div>

      <Card className="bg-card border-white/5 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 to-transparent pointer-events-none" />
        <CardContent className="p-8 flex flex-col items-center relative z-10 gap-6">

          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-destructive/20 border border-destructive/50 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(255,51,102,0.4)]"
              >
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <span className="font-mono text-xl font-bold text-white">{formatTime(recordingTime)}</span>
                <span className="text-sm text-destructive/80 uppercase font-semibold">
                  {mode === 'video' ? 'Recording Video' : 'Recording Audio'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'video' && (
            <div className="w-full max-w-lg aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative">
              <video
                ref={liveVideoRef}
                muted
                playsInline
                className={`w-full h-full object-cover ${!isRecording ? 'hidden' : ''}`}
              />
              {!isRecording && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Video className="w-12 h-12 opacity-30" />
                  <p className="text-sm opacity-60">Camera preview will appear when recording starts</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
              w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 shadow-2xl outline-none
              ${
                isRecording
                  ? 'bg-destructive/20 border-4 border-destructive text-destructive hover:bg-destructive/30 animate-[pulse_2s_ease-in-out_infinite]'
                  : 'bg-destructive hover:bg-destructive/90 text-white shadow-destructive/50 hover:shadow-[0_0_40px_rgba(255,51,102,0.6)] hover:scale-105'
              }
            `}
          >
            {isRecording ? (
              <Square className="w-12 h-12 fill-current" />
            ) : mode === 'video' ? (
              <Video className="w-14 h-14" />
            ) : (
              <Mic className="w-14 h-14" />
            )}
          </button>

          <p className="font-medium text-lg text-white">
            {isRecording ? 'Tap to Stop & Save' : `Tap to Start ${mode === 'video' ? 'Video' : 'Voice'} Recording`}
          </p>

          {createSosMutation.isPending && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Activity className="w-4 h-4 mr-2 animate-spin" /> Syncing to cloud...
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-display font-semibold text-white">Recording History</h2>
        <Card className="bg-card border-white/5">
          <div className="divide-y divide-white/5">
            {!history || history.recordings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No SOS recordings found.</div>
            ) : (
              history.recordings.map((rec) => (
                <div key={rec.id} className="p-5 space-y-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        {rec.mediaType === 'video' ? (
                          <Video className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Mic className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          SOS {rec.mediaType === 'video' ? 'Video' : 'Audio'} Record
                        </h4>
                        <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(rec.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                          {rec.duration && <span>{formatTime(rec.duration)}</span>}
                          {rec.latitude && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {rec.latitude.toFixed(4)}, {rec.longitude?.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <BlobPlayer
                    dataUrl={rec.mediaUrl}
                    mediaType={(rec.mediaType as 'audio' | 'video') ?? 'audio'}
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
