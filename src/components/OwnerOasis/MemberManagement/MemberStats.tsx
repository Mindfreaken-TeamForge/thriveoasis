import React from 'react';
import { Users, UserCheck, Clock } from 'lucide-react';

interface MemberStats {
  totalMembers: number;
  onlineMembers: number;
  averageActiveTime?: string;
  newestMember?: string;
}

interface MemberStatsProps {
  stats: MemberStats;
}

const MemberStats: React.FC<MemberStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-blue-400 mr-2" />
          <div>
            <p className="text-sm text-gray-400">Total Members</p>
            <p className="text-xl font-semibold text-white">{stats.totalMembers}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center">
          <UserCheck className="w-5 h-5 text-green-400 mr-2" />
          <div>
            <p className="text-sm text-gray-400">Online Now</p>
            <p className="text-xl font-semibold text-white">{stats.onlineMembers}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-purple-400 mr-2" />
          <div>
            <p className="text-sm text-gray-400">Average Active Time</p>
            <p className="text-xl font-semibold text-white">
              {stats.averageActiveTime || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberStats;