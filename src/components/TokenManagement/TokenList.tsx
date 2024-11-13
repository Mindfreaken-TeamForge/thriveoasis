import React from 'react';
import { Token } from '@/services/tokenService';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TokenListProps {
  tokens: Token[];
  onRegenerateToken: (tokenId: string) => void;
  onDisableToken: (tokenId: string) => void;
  userRole: string;
}

const TokenList: React.FC<TokenListProps> = ({
  tokens,
  onRegenerateToken,
  onDisableToken,
  userRole,
}) => {
  const canManageTokens = ['owner', 'admin'].includes(userRole);

  const isTokenActive = (token: Token) => {
    // Check if token is already disabled
    if (!token.isEnabled) return false;

    // Check if token has expired
    if (token.expiresAt && new Date() > token.expiresAt) return false;

    // Check if token has reached max uses
    if (token.maxUses && token.currentUses >= token.maxUses) return false;

    return true;
  };

  if (tokens.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-gray-400">No active invites found</p>
        {canManageTokens && (
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-gray-500">Create your first invite to get started</p>
            <Button
              onClick={() => document.querySelector('[value="create"]')?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invite
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700">
            <TableHead className="text-gray-400">Code</TableHead>
            <TableHead className="text-gray-400">Type</TableHead>
            <TableHead className="text-gray-400">Created</TableHead>
            <TableHead className="text-gray-400">Expires</TableHead>
            <TableHead className="text-gray-400">Uses</TableHead>
            <TableHead className="text-gray-400">Status</TableHead>
            <TableHead className="text-gray-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow
              key={token.id}
              className="border-gray-700 hover:bg-gray-800/50"
            >
              <TableCell className="font-mono text-blue-400">
                {token.code}
              </TableCell>
              <TableCell className="capitalize text-gray-300">
                {token.type}
              </TableCell>
              <TableCell className="text-gray-300">
                {token.createdAt.toLocaleDateString()}
              </TableCell>
              <TableCell className="text-gray-300">
                {token.expiresAt
                  ? token.expiresAt.toLocaleDateString()
                  : 'Never'}
              </TableCell>
              <TableCell className="text-gray-300">
                {token.currentUses}
                {token.maxUses ? `/${token.maxUses}` : ''}
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    isTokenActive(token)
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {isTokenActive(token) ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                {canManageTokens && isTokenActive(token) && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRegenerateToken(token.id)}
                      className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDisableToken(token.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TokenList;