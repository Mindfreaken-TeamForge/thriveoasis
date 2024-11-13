import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeColors } from '@/themes';
import { Clock, Users, Link, Crown } from 'lucide-react';
import { db, auth } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';

interface InviteCreationProps {
  oasisId: string;
  themeColors: ThemeColors;
}

const InviteCreation: React.FC<InviteCreationProps> = ({ oasisId, themeColors }) => {
  const [inviteType, setInviteType] = useState<'permanent' | 'temporary'>('permanent');
  const [maxUses, setMaxUses] = useState<string>('');
  const [expirationHours, setExpirationHours] = useState<string>('24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCreateInvite = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create invites',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const inviteData = {
        code: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: inviteType,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        isEnabled: true,
        currentUses: 0,
        maxUses: maxUses ? parseInt(maxUses) : null,
        ...(inviteType === 'temporary' && {
          expiresAt: new Date(Date.now() + parseInt(expirationHours) * 60 * 60 * 1000),
        }),
      };

      const invitesRef = collection(db, 'oasis', oasisId, 'invites');
      await addDoc(invitesRef, inviteData);

      toast({
        title: 'Success',
        description: 'Invite created successfully!',
      });

      // Reset form
      setInviteType('permanent');
      setMaxUses('');
      setExpirationHours('24');
    } catch (error) {
      console.error('Error creating invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invite. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-white mb-2">Invite Type</Label>
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            onClick={() => setInviteType('permanent')}
            className={`flex items-center justify-center h-20 ${
              inviteType === 'permanent'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <div className="text-center">
              <Link className="h-6 w-6 mx-auto mb-1" />
              <span className="text-sm">Permanent</span>
            </div>
          </Button>
          <Button
            type="button"
            onClick={() => setInviteType('temporary')}
            className={`flex items-center justify-center h-20 ${
              inviteType === 'temporary'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto mb-1" />
              <span className="text-sm">Temporary</span>
            </div>
          </Button>
        </div>
      </div>

      {inviteType === 'temporary' && (
  <div>
    <Label className="text-white mb-2">Duration (hours)</Label>
    <div className="flex items-center space-x-2">
      <Input
        type="number"
        value={expirationHours}
        onChange={(e) => setExpirationHours(e.target.value)}
        min="1"
        max="720"
        required
        className="bg-gray-800 border-gray-700 text-white py-1 px-2 w-32"
      />
      <Clock className="h-5 w-5 text-gray-400" />
    </div>
  </div>
)}

      <div>
  <Label className="text-white mb-2">Max Uses (optional)</Label>
  <div className="flex items-center space-x-2">
    <Input
      type="number"
      value={maxUses}
      onChange={(e) => setMaxUses(e.target.value)}
      min="1"
      placeholder="Unlimited"
      className="bg-gray-800 border-gray-700 text-white py-1 px-2 w-32" // Adjusted padding and width
    />
    <Users className="h-5 w-5 text-gray-400" />
  </div>
</div>

      <Button
        onClick={handleCreateInvite}
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Invite'}
      </Button>
    </div>
  );
};

export default InviteCreation;