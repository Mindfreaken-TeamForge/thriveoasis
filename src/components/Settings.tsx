import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Switch } from './ui/switch';
import { Select } from './ui/select';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { updateProfile, updateEmail, updatePhoneNumber } from 'firebase/auth';
import { useToast } from './ui/use-toast';

interface SettingsProps {
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || '');
          setPhone(userData.phone || '');
          setTwoFactorAuth(userData.twoFactorAuth || false);
        }
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setHasChanges(
        displayName !== (user.displayName || '') ||
          email !== (user.email || '') ||
          phone !== user.phoneNumber
      );
    }
  }, [displayName, email, phone]);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (user) {
      try {
        await updateProfile(user, { displayName });
        if (email !== user.email) {
          await updateEmail(user, email);
        }
        // Note: We're not actually updating the phone number here due to environment limitations
        await updateDoc(doc(db, 'users', user.uid), {
          username,
          phone,
        });
        toast({
          title: 'Success',
          description: 'Your settings have been updated.',
        });
        setHasChanges(false);
      } catch (error: any) {
        console.error('Error updating user data:', error);
        toast({
          title: 'Error',
          description:
            error.message || 'Failed to update settings. Please try again.',
          variant: 'destructive',
        });
      }
    }
    setIsLoading(false);
  };

  const handleToggleTwoFactor = async (checked: boolean) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to change 2FA settings.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Simulating 2FA toggle
      if (checked) {
        if (!phone) {
          toast({
            title: 'Error',
            description:
              'Please add a phone number and save changes before enabling 2FA.',
            variant: 'destructive',
          });
          return;
        }

        // Simulate verification process
        const verificationCode = prompt(
          'Enter the verification code (any code will work for this demo):'
        );
        if (!verificationCode) {
          toast({
            title: 'Error',
            description: 'Verification code is required to enable 2FA.',
            variant: 'destructive',
          });
          return;
        }

        setTwoFactorAuth(true);
        toast({
          title: 'Success',
          description:
            'Two-factor authentication has been enabled (simulated).',
        });
      } else {
        setTwoFactorAuth(false);
        toast({
          title: 'Success',
          description:
            'Two-factor authentication has been disabled (simulated).',
        });
      }

      await updateDoc(doc(db, 'users', user.uid), { twoFactorAuth: checked });
    } catch (error: any) {
      console.error('Error toggling 2FA:', error);
      toast({
        title: 'Error',
        description:
          error.message ||
          'Failed to update two-factor authentication. Please try again.',
        variant: 'destructive',
      });
      // Revert the switch state if there's an error
      setTwoFactorAuth(!checked);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-gray-800 to-red-900">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-yellow-400">
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage your account information and security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-gray-700 text-white h-12 pl-4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-700 text-white h-12 pl-4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-700 text-white h-12 pl-4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-gray-700 text-white h-12 pl-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-factor Authentication</Label>
              <p className="text-sm text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={twoFactorAuth}
              onCheckedChange={handleToggleTwoFactor}
            />
          </div>
          <div className="flex justify-between pt-4">
            <Button
              onClick={handleSaveChanges}
              className="bg-gradient-to-r from-yellow-500 to-red-500 text-white hover:from-yellow-600 hover:to-red-600 px-4 py-2 text-sm"
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
            <Button
              onClick={onLogout}
              className="bg-gray-700 text-white hover:bg-gray-600 px-4 py-2 text-sm"
            >
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
