import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TokenCreationFormProps {
  onCreateToken: (
    type: 'permanent' | 'temporary',
    maxUses?: number,
    expirationHours?: number
  ) => Promise<void>;
  canCreatePermanentTokens: boolean;
  canCreateTemporaryTokens: boolean;
}

const TokenCreationForm: React.FC<TokenCreationFormProps> = ({
  onCreateToken,
  canCreatePermanentTokens,
  canCreateTemporaryTokens,
}) => {
  const [tokenType, setTokenType] = useState<'permanent' | 'temporary'>(
    canCreatePermanentTokens ? 'permanent' : 'temporary'
  );
  const [maxUses, setMaxUses] = useState<string>('');
  const [expirationHours, setExpirationHours] = useState<string>('24');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onCreateToken(
        tokenType,
        maxUses ? parseInt(maxUses) : undefined,
        tokenType === 'temporary' ? parseInt(expirationHours) : undefined
      );

      // Reset form
      setMaxUses('');
      setExpirationHours('24');
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-white mb-2">Invite Type</Label>
        <Select
          value={tokenType}
          onValueChange={(value: 'permanent' | 'temporary') =>
            setTokenType(value)
          }
          disabled={isSubmitting}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Select invite type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {canCreatePermanentTokens && (
              <SelectItem value="permanent" className="text-white">Permanent</SelectItem>
            )}
            {canCreateTemporaryTokens && (
              <SelectItem value="temporary" className="text-white">Temporary</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {tokenType === 'temporary' && (
        <div>
          <Label className="text-white mb-2">Duration (hours)</Label>
          <Input
            type="number"
            value={expirationHours}
            onChange={(e) => setExpirationHours(e.target.value)}
            min="1"
            max="720"
            required
            className="bg-gray-800 border-gray-700 text-white"
            disabled={isSubmitting}
          />
        </div>
      )}

      <div>
        <Label className="text-white mb-2">Max Uses (optional)</Label>
        <Input
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          min="1"
          placeholder="Unlimited if not set"
          className="bg-gray-800 border-gray-700 text-white"
          disabled={isSubmitting}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Creating...
          </div>
        ) : (
          'Create Invite'
        )}
      </Button>
    </form>
  );
};

export default TokenCreationForm;
