import React, { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { auth, db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { ThemeColors } from '@/themes';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  oasisId: string;
  themeColors: ThemeColors;
}

const reportReasons = [
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Inappropriate content',
  'Spam',
  'Misinformation',
  'Other',
];

const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  postId,
  oasisId,
  themeColors,
}) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [escalateToAdmin, setEscalateToAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Error',
        description: 'Please select a reason for reporting',
        variant: 'destructive',
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to report content',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create report in oasis reports collection
      await addDoc(collection(db, 'oasis', oasisId, 'reports'), {
        postId,
        reportedBy: user.uid,
        reason,
        details,
        escalatedToAdmin: escalateToAdmin,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      // If escalated, also create in site-wide reports collection
      if (escalateToAdmin) {
        await addDoc(collection(db, 'reports'), {
          postId,
          oasisId,
          reportedBy: user.uid,
          reason,
          details,
          status: 'pending',
          timestamp: serverTimestamp(),
        });
      }

      toast({
        title: 'Success',
        description: 'Report submitted successfully',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        style={{
          background: 'rgb(17 24 39)',
          border: `1px solid ${themeColors.accent}`,
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center">
            <Flag className="w-5 h-5 mr-2 text-red-500" />
            Report Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label className="text-white">Reason for reporting</Label>
            <RadioGroup
              value={reason}
              onValueChange={setReason}
              className="space-y-2"
            >
              {reportReasons.map((r) => (
                <div
                  key={r}
                  className="flex items-center space-x-2 bg-gray-800/50 p-3 rounded-lg hover:bg-gray-800/70 transition-colors"
                >
                  <RadioGroupItem value={r} id={r} />
                  <Label htmlFor={r} className="text-white cursor-pointer">
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Additional details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white"
              placeholder="Provide any additional context..."
            />
          </div>

          <div
            className="flex items-center space-x-2 p-3 rounded-lg cursor-pointer"
            style={{
              background: escalateToAdmin ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
            onClick={() => setEscalateToAdmin(!escalateToAdmin)}
          >
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className="text-white font-medium">Escalate to Site Admins</p>
              <p className="text-sm text-gray-400">
                For severe violations of site-wide rules
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;