import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { ThemeColors } from '@/themes';
import { auth, db, storage } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ui/use-toast';
import { Call } from '@/types/call';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import { ScrollArea } from '@/components/ui/scroll-area';
import CallHistory from './CallHistory';
import CallParticipantsUI from './CallParticipantsUI';
import { CallService } from '@/services/call/callService';

interface CallManagerProps {
  themeColors: ThemeColors;
  oasisId: string;
  isPremium?: boolean;
}

const CallManager: React.FC<CallManagerProps> = ({
  themeColors,
  oasisId,
  isPremium = false,
}) => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Record<string, number>>({});
  const callService = useRef<CallService | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !oasisId) return;

    callService.current = new CallService(
      oasisId,
      user.uid,
      user.displayName || 'Anonymous',
      (userId, level) => {
        setActiveSpeakers(prev => ({
          ...prev,
          [userId]: level
        }));
      },
      (message) => {
        console.log(`New message: ${message.content}`);
      }
    );

    const callsRef = collection(db, 'oasis', oasisId, 'adminCalls');
    const q = query(
      callsRef,
      where('status', 'in', ['active', 'completed']),
      orderBy('startedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const callsData: Call[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.startedAt) {
          callsData.push({
            id: doc.id,
            startedAt: data.startedAt.toDate(),
            endedAt: data.endedAt?.toDate(),
            status: data.status,
            hostId: data.hostId,
            participants: data.participants || [],
            documents: data.documents || [],
            recordingUrl: data.recordingUrl || null,
          });
        }
      });
      setCalls(callsData);

      const activeCall = callsData.find((call) => call.status === 'active');
      if (activeCall) {
        setActiveCallId(activeCall.id);
        setIsInCall(activeCall.participants.some((p) => p.userId === user.uid));
      } else {
        setActiveCallId(null);
        setIsInCall(false);
      }
    });

    return () => {
      unsubscribe();
      callService.current?.cleanup();
    };
  }, [oasisId]);

  const handleRecordingEnd = async () => {
    if (!activeCallId) {
      console.log('No active call ID found');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      console.log('No authenticated user found');
      return;
    }

    try {
      console.log('Starting recording end process', {
        oasisId,
        activeCallId,
        userId: user.uid,
      });

      let recordingBlob = null;
      if (isRecording && callService.current) {
        try {
          console.log('Attempting to stop recording');
          recordingBlob = await callService.current.recording.stopRecording();
          console.log('Recording stopped successfully, blob size:', recordingBlob?.size);
          setIsRecording(false);
        } catch (error) {
          console.error('Error stopping recording:', error);
        }
      }

      const callRef = doc(db, 'oasis', oasisId, 'adminCalls', activeCallId);
      const callDoc = await getDoc(callRef);
      
      if (!callDoc.exists()) {
        console.error('Call document not found:', activeCallId);
        throw new Error('Call document not found');
      }

      if (recordingBlob) {
        const timestamp = Date.now();
        const recordingPath = `oasis/${oasisId}/calls/${activeCallId}/recording-${timestamp}.webm`;
        console.log('Preparing to upload recording to path:', recordingPath);

        const storageRef = ref(storage, recordingPath);

        const metadata = {
          contentType: 'audio/webm;codecs=opus',
          customMetadata: {
            oasisId,
            callId: activeCallId,
            uploaderId: user.uid,
            timestamp: timestamp.toString(),
          }
        };

        console.log('Starting blob upload with metadata:', metadata);
        const uploadResult = await uploadBytes(storageRef, recordingBlob, metadata);
        console.log('Upload completed:', uploadResult);

        const downloadURL = await getDownloadURL(uploadResult.ref);
        console.log('Download URL obtained:', downloadURL);

        await updateDoc(callRef, {
          status: 'completed',
          endedAt: serverTimestamp(),
          recordingUrl: downloadURL,
        });

        toast({
          title: 'Success',
          description: 'Call ended and recording saved successfully',
        });
      } else {
        await updateDoc(callRef, {
          status: 'completed',
          endedAt: serverTimestamp(),
        });

        toast({
          title: 'Info',
          description: 'Call ended without recording',
        });
      }
    } catch (error: any) {
      console.error('Error handling recording end:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details,
      });

      toast({
        title: 'Error',
        description: 'Failed to save recording. Please try again.',
        variant: 'destructive',
      });

      try {
        const callRef = doc(db, 'oasis', oasisId, 'adminCalls', activeCallId);
        await updateDoc(callRef, {
          status: 'completed',
          endedAt: serverTimestamp(),
        });
      } catch (endError) {
        console.error('Error ending call:', endError);
      }
    }
  };

  const startCall = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to start a call',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check for any existing active calls first
      const callsRef = collection(db, 'oasis', oasisId, 'adminCalls');
      const activeCallsQuery = query(callsRef, where('status', '==', 'active'));
      const activeCallsSnapshot = await getDocs(activeCallsQuery);

      if (!activeCallsSnapshot.empty) {
        // Join existing call instead of creating a new one
        const existingCall = activeCallsSnapshot.docs[0];
        const callData = existingCall.data();

        // Check if user is already in the call
        if (callData.participants.some((p: any) => p.userId === user.uid)) {
          toast({
            title: 'Info',
            description: 'You are already in this call',
          });
          return;
        }

        // Add user to existing call's participants
        const updatedParticipants = [
          ...callData.participants,
          {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            role: 'participant',
            joinedAt: Timestamp.now(),
          },
        ];

        await updateDoc(existingCall.ref, {
          participants: updatedParticipants,
        });

        toast({ title: 'Success', description: 'Joined call successfully' });
        return;
      }

      // If no active call exists, create a new one
      const newCall = {
        startedAt: serverTimestamp(),
        status: 'active',
        hostId: user.uid,
        participants: [
          {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            role: 'host',
            joinedAt: Timestamp.now(),
          },
        ],
        documents: [],
        recordingUrl: null,
      };

      await addDoc(callsRef, newCall);
      toast({ title: 'Success', description: 'Call started successfully' });

      if (callService.current) {
        await callService.current.recording.startRecording();
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error starting/joining call:', error);
      toast({
        title: 'Error',
        description: 'Failed to start/join call',
        variant: 'destructive',
      });
    }
  };

  const leaveCall = async () => {
    if (!activeCallId || !callService.current) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const callRef = doc(db, 'oasis', oasisId, 'adminCalls', activeCallId);
      const callDoc = await getDoc(callRef);
      if (!callDoc.exists()) {
        toast({
          title: 'Error',
          description: 'Call data not found',
          variant: 'destructive',
        });
        return;
      }

      const callData = callDoc.data();
      const isHost = callData.hostId === user.uid;
      const isLastParticipant = (callData.participants?.length || 0) <= 1;

      if (isHost || isLastParticipant) {
        await handleRecordingEnd();
      } else {
        const updatedParticipants = (callData.participants || []).filter(
          (p: any) => p.userId !== user.uid
        );
        await updateDoc(callRef, { participants: updatedParticipants });
        toast({ title: 'Success', description: 'Left call successfully' });
      }
    } catch (error) {
      console.error('Error leaving call:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave call properly',
        variant: 'destructive',
      });
    }
  };

  const activeCall = calls.find(call => call.status === 'active');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card
        style={{
          background: 'rgb(17 24 39)',
          boxShadow: `0 0 20px ${themeColors.accent}`,
          border: '1px solid rgb(75 85 99)',
        }}
      >
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Admin Call Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isInCall ? (
              <Button
                onClick={leaveCall}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Leave Call
              </Button>
            ) : (
              <Button
                onClick={startCall}
                style={{
                  background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
                  color: '#fff',
                  textShadow: '0 0 5px rgba(255,255,255,0.5)',
                  boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
                  border: 'none',
                  transition: 'all 0.1s ease',
                  width: '100%',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                {activeCallId ? 'Join Active Call' : 'Start New Call'}
              </Button>
            )}

            <CallParticipantsUI
              participants={activeCall?.participants || []}
              activeSpeakers={activeSpeakers}
              themeColors={themeColors}
              isCallActive={!!activeCall}
            />

            {activeCallId && (
              <div className="space-y-4">
                <FileUpload
                  oasisId={oasisId}
                  isPremium={isPremium}
                  allowedTypes={[
                    'audio/*',
                    'video/*',
                    'application/pdf',
                    '.doc,.docx,.txt',
                  ]}
                  onUploadComplete={(url) => console.log('File uploaded:', url)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card
        style={{
          background: 'rgb(17 24 39)',
          boxShadow: `0 0 20px ${themeColors.accent}`,
          border: '1px solid rgb(75 85 99)',
        }}
      >
        <CardHeader>
          <CardTitle className="text-xl text-white">Call History</CardTitle>
        </CardHeader>
        <CardContent>
          <CallHistory
            calls={calls}
            onViewFiles={(callId) =>
              console.log('Viewing files for call:', callId)
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CallManager;