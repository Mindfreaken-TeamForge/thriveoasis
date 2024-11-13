import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Users, Link, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateToken: (
    type: 'permanent' | 'temporary',
    maxUses?: number,
    expirationHours?: number
  ) => Promise<{ code: string } | undefined>;
  canCreatePermanentTokens: boolean;
}

const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onCreateToken,
  canCreatePermanentTokens,
}) => {
  const [tokenType, setTokenType] = useState<'permanent' | 'temporary'>(
    canCreatePermanentTokens ? 'permanent' : 'temporary'
  );
  const [maxUses, setMaxUses] = useState<string>('');
  const [expirationHours, setExpirationHours] = useState<string>('24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const { toast } = useToast();

  const buttonStyle = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '0.5rem 1rem',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await onCreateToken(
        tokenType,
        maxUses ? parseInt(maxUses) : undefined,
        tokenType === 'temporary' ? parseInt(expirationHours) : undefined
      );

      if (result?.code) {
        setGeneratedCode(result.code);
        toast({
          title: 'Success',
          description: 'Invite code generated successfully!',
        });
      }
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

  const handleClose = () => {
    setGeneratedCode('');
    setMaxUses('');
    setExpirationHours('24');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-gray-900 rounded-lg p-6 w-full max-w-md m-4"
        style={{
          maxHeight: 'calc(100vh - 12rem)',
          overflowY: 'auto'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create Invite</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {generatedCode ? (
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <Label className="text-sm text-gray-400">Invite Code</Label>
              <div className="flex items-center space-x-2 mt-1">
                <code className="flex-1 font-mono text-lg text-blue-400 break-all">
                  {generatedCode}
                </code>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    toast({
                      title: 'Copied!',
                      description: 'Invite code copied to clipboard',
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setGeneratedCode('');
                setMaxUses('');
                setExpirationHours('24');
              }}
            >
              Create Another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white mb-2">Invite Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {canCreatePermanentTokens && (
                  <Button
                    type="button"
                    onClick={() => setTokenType('permanent')}
                    className={`flex items-center justify-center h-20 ${
                      tokenType === 'permanent'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <Link className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm">Permanent</span>
                    </div>
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => setTokenType('temporary')}
                  className={`flex items-center justify-center h-20 ${
                    tokenType === 'temporary'
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
                />
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
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Users className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
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
        )}
      </motion.div>
    </div>
  );
};

export default InviteModal;