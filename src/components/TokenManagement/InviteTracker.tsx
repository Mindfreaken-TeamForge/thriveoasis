import React, { useState, useEffect } from 'react';
import { InviteRelation, tokenService } from '@/services/tokenService';
import { auth } from '@/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Link, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface InviteTrackerProps {
  oasisId: string;
}

const InviteTracker: React.FC<InviteTrackerProps> = ({ oasisId }) => {
  const [inviteRelations, setInviteRelations] = useState<InviteRelation[]>([]);
  const [totalInvites, setTotalInvites] = useState(0);

  useEffect(() => {
    const fetchInviteData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const relations = await tokenService.getInviteesByInviter(
        user.uid,
        oasisId
      );
      setInviteRelations(relations);

      const total = await tokenService.getInviterStats(user.uid, oasisId);
      setTotalInvites(total);
    };

    fetchInviteData();
  }, [oasisId]);

  return (
    <div className="space-y-6 bg-gray-900 p-6 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Invites</p>
              <p className="text-2xl font-bold text-white">{totalInvites}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Link className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Links</p>
              <p className="text-2xl font-bold text-white">
                {inviteRelations.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Last Invite</p>
              <p className="text-2xl font-bold text-white">
                {inviteRelations.length > 0
                  ? new Date(
                      inviteRelations[0].timestamp
                    ).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800 rounded-lg shadow-lg border border-gray-700"
      >
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Recent Invites</h3>
        </div>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Invitee</TableHead>
                <TableHead className="text-gray-400">Token Used</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteRelations.map((relation, index) => (
                <TableRow
                  key={index}
                  className="border-gray-700 hover:bg-gray-700/50"
                >
                  <TableCell className="text-white">
                    {relation.inviteeId}
                  </TableCell>
                  <TableCell className="font-mono text-blue-400">
                    {relation.tokenId}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {new Date(relation.timestamp).toLocaleDateString(
                      undefined,
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {inviteRelations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-gray-400 py-8"
                  >
                    No invites yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteTracker;