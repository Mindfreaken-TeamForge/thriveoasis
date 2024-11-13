import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { auth } from '@/firebase';
import {
  requestNotificationPermission,
  subscribeToOasisNotifications,
  getNotificationPreferences,
} from '@/services/notificationService';

interface NotificationBellProps {
  oasisId: string;
  isPremium?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  oasisId,
  isPremium = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    events: false,
    mentions: false,
    smsAlerts: false,
    phoneNumber: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadPreferences = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const prefs = await getNotificationPreferences(user.uid, oasisId);
        setPreferences(prefs);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    };

    loadPreferences();
  }, [oasisId]);

  const handleToggleNotification = async (type: keyof typeof preferences) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to manage notifications',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'smsAlerts' && !isPremium) {
      toast({
        title: 'Premium Feature',
        description: 'SMS alerts are only available for Premium oasis',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!preferences[type]) {
        // Request permission if not already granted
        await requestNotificationPermission(user.uid);
      }

      const newPreferences = {
        ...preferences,
        [type]: !preferences[type],
      };

      await subscribeToOasisNotifications(user.uid, oasisId, newPreferences);
      setPreferences(newPreferences);

      toast({
        title: 'Success',
        description: `Notifications ${!preferences[type] ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences',
        variant: 'destructive',
      });
    }
  };

  const handlePhoneNumberChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newPhoneNumber = e.target.value;
    setPreferences((prev) => ({ ...prev, phoneNumber: newPhoneNumber }));

    const user = auth.currentUser;
    if (!user) return;

    try {
      await subscribeToOasisNotifications(user.uid, oasisId, {
        ...preferences,
        phoneNumber: newPhoneNumber,
      });
    } catch (error) {
      console.error('Error updating phone number:', error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-700/50"
        >
          <Bell className="h-5 w-5" />
          {(preferences.events || preferences.mentions || preferences.smsAlerts) && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 bg-gray-800 border-gray-700"
        align="end"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Notification Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Event Notifications</Label>
              <Switch
                checked={preferences.events}
                onCheckedChange={() => handleToggleNotification('events')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white">Mentions & Tags</Label>
              <Switch
                checked={preferences.mentions}
                onCheckedChange={() => handleToggleNotification('mentions')}
              />
            </div>
            {isPremium && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-white">SMS Alerts</Label>
                  <Switch
                    checked={preferences.smsAlerts}
                    onCheckedChange={() => handleToggleNotification('smsAlerts')}
                  />
                </div>
                {preferences.smsAlerts && (
                  <div className="space-y-2">
                    <Label className="text-white">Phone Number</Label>
                    <Input
                      type="tel"
                      value={preferences.phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder="+1234567890"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;