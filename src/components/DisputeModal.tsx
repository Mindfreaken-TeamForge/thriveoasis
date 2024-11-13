import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  oasisName: string;
}

const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  oasisName,
}) => {
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit a dispute',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Create a new dispute document
      const disputeRef = doc(db, 'disputes', `${oasisName}-${user.uid}`);
      await setDoc(disputeRef, {
        oasisName,
        userId: user.uid,
        evidence,
        status: 'pending',
        createdAt: new Date(),
      });

      toast({
        title: 'Success',
        description: 'Your dispute has been submitted for review',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit dispute. Please try again.',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <Card className="w-full max-w-md mx-4 bg-gradient-to-br from-gray-900 to-red-900 text-white border-orange-500">
        <CardHeader className="relative">
          <Button
            onClick={onClose}
            variant="ghost"
            className="absolute right-2 top-2 text-orange-500 hover:text-orange-400"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold text-orange-500">
            Dispute Oasis Ownership
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              You are disputing the ownership of the oasis:{' '}
              <span className="font-bold text-orange-500">{oasisName}</span>
            </p>
            <div>
              <label
                htmlFor="evidence"
                className="block text-sm font-medium text-gray-300"
              >
                Provide evidence for your claim
              </label>
              <textarea
                id="evidence"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                className="mt-1 w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                rows={4}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-orange-500 text-white hover:bg-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default DisputeModal;
