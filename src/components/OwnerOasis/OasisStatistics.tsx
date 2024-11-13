import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Rocket } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ThemeColors } from '../../themes';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface OasisStatisticsProps {
  themeColors: ThemeColors;
  oasisId: string;
  cardStyle: React.CSSProperties;
}

const OasisStatistics: React.FC<OasisStatisticsProps> = ({
  themeColors,
  oasisId,
  cardStyle,
}) => {
  const [memberCount, setMemberCount] = useState(0);
  const [dailyMessages, setDailyMessages] = useState(0);
  const [oasisBoostLevel, setOasisBoostLevel] = useState(0);

  useEffect(() => {
    const fetchOasisStats = async () => {
      if (!oasisId) {
        console.warn('Missing oasisId for statistics');
        return;
      }

      try {
        const oasisRef = doc(db, 'oasis', oasisId);
        const oasisDoc = await getDoc(oasisRef);
        if (oasisDoc.exists()) {
          const data = oasisDoc.data();
          setMemberCount(data.memberCount || 0);
          setDailyMessages(data.dailyMessages || 0);
          setOasisBoostLevel(data.oasisBoostLevel || 0);
        }
      } catch (error) {
        console.error('Error fetching oasis statistics:', error);
      }
    };

    fetchOasisStats();
  }, [oasisId]);

  return (
    <Card
      className="w-[250px] h-[350px] overflow-hidden relative transition-all duration-300 hover:scale-105 hover:shadow-lg"
      style={{
        background: 'rgb(17 24 39)',
        boxShadow: `0 0 20px ${themeColors.accent}`,
        border: `1px solid rgb(75 85 99)`,
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-white flex items-center">
          Oasis Statistics
        </CardTitle>
        <CardDescription className="text-gray-400">
          Overview of your oasis's performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-500/20 rounded-lg">
                <Users className="h-3 w-3 text-blue-400" />
              </div>
              <span className="text-gray-300">Total Members</span>
            </div>
            <span className="text-1xl font-bold text-white">{memberCount}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-green-500/20 rounded-lg">
                <MessageSquare className="h-3 w-3 text-green-400" />
              </div>
              <span className="text-gray-300">Messages Today</span>
            </div>
            <span className="text-1xl font-bold text-white">
              {dailyMessages}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-purple-500/20 rounded-lg">
                <Rocket className="h-3 w-3 text-purple-400" />
              </div>
              <span className="text-gray-300">Boost Level</span>
            </div>
            <span className="text-1xl font-bold text-white">
              {oasisBoostLevel}
            </span>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OasisStatistics;