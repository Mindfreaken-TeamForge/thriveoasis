import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Clock, Users, Play } from 'lucide-react';
import { Call } from '@/types/call';
import RecordingModal from './CallRecording/RecordingModal';

interface CallHistoryProps {
  calls: Call[];
  onViewFiles: (callId: string) => void;
}

const CallHistory: React.FC<CallHistoryProps> = ({ calls, onViewFiles }) => {
  const [selectedRecording, setSelectedRecording] = useState<{
    path: string;
    callId: string;
  } | null>(null);

  const formatDuration = (startDate: Date, endDate?: Date) => {
    if (!endDate) return 'Ongoing';
    const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <>
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {calls.map((call) => (
            <div
              key={call.id}
              className="bg-gray-800/50 p-4 rounded-lg space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-semibold">
                      {call.startedAt.toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      call.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {call.status}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDuration(call.startedAt, call.endedAt)}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {call.participants.length} participants
                    </div>
                    {call.documents.length > 0 && (
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        {call.documents.length} files shared
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {call.documents.length > 0 && (
                    <Button
                      onClick={() => onViewFiles(call.id)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                    >
                      View Files
                    </Button>
                  )}
                  {call.recordingUrl && (
  <Button
    onClick={() =>
      setSelectedRecording({
        path: call.recordingUrl!,
        callId: call.id,
      })
    }
    style={{
      background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
      color: '#fff',
      textShadow: '0 0 5px rgba(255,255,255,0.5)',
      boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
      border: 'none',
      transition: 'all 0.1s ease',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      fontWeight: '500',
    }}
  >
    <Play className="w-4 h-4 mr-2" />
    Play Recording
  </Button>
)}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-white mb-2">
                  Participants
                </h4>
                <div className="space-y-1">
                  {call.participants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center justify-between text-sm text-gray-400"
                    >
                      <span>{participant.userName}</span>
                      <span>{participant.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {calls.length === 0 && (
            <div className="text-center text-gray-400 py-8">No calls yet</div>
          )}
        </div>
      </ScrollArea>

      {selectedRecording && (
        <RecordingModal
          isOpen={true}
          onClose={() => setSelectedRecording(null)}
          recordingPath={selectedRecording.path}
          callId={selectedRecording.callId}
        />
      )}
    </>
  );
};

export default CallHistory;
