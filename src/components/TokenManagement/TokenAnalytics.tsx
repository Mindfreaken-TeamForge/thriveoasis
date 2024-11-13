import React, { useState, useEffect } from 'react';
import { Token, TokenUsage, tokenService } from '@/services/tokenService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface TokenAnalyticsProps {
  tokens: Token[];
  oasisId: string;
}

interface DailyUsage {
  date: string;
  uses: number;
}

const TokenAnalytics: React.FC<TokenAnalyticsProps> = ({ tokens, oasisId }) => {
  const [usageData, setUsageData] = useState<Record<string, TokenUsage[]>>({});
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);

  useEffect(() => {
    const fetchUsageData = async () => {
      if (!oasisId) {
        console.warn('Missing oasisId for analytics');
        return;
      }

      const usagePromises = tokens.map((token) =>
        tokenService.getTokenUsageAnalytics(token.id, oasisId)
      );

      try {
        const usageResults = await Promise.all(usagePromises);
        const newUsageData: Record<string, TokenUsage[]> = {};
        
        tokens.forEach((token, index) => {
          newUsageData[token.id] = usageResults[index];
        });
        
        setUsageData(newUsageData);

        // Calculate daily usage
        const usage: Record<string, number> = {};
        Object.values(newUsageData)
          .flat()
          .forEach((use) => {
            const date = new Date(use.usedAt).toISOString().split('T')[0];
            usage[date] = (usage[date] || 0) + 1;
          });

        const dailyData = Object.entries(usage)
          .map(([date, uses]) => ({ date, uses }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setDailyUsage(dailyData);
      } catch (error) {
        console.error('Error fetching usage data:', error);
        setUsageData({});
        setDailyUsage([]);
      }
    };

    fetchUsageData();
  }, [tokens, oasisId]);

  return (
    <div className="space-y-6 text-white">
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Token Usage</h3>
        <div className="w-full h-[400px] bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <LineChart
            width={800}
            height={400}
            data={dailyUsage}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.375rem',
              }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="uses"
              stroke="#60A5FA"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Token Usage Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => {
            const tokenUsage = usageData[token.id] || [];
            return (
              <div
                key={token.id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <p className="font-mono text-sm mb-2 text-blue-400">
                  {token.code}
                </p>
                <p className="text-gray-300">
                  Total Uses: {tokenUsage.length}
                </p>
                <p className="text-gray-300">
                  Last Used:{' '}
                  {tokenUsage.length > 0
                    ? new Date(
                        tokenUsage[tokenUsage.length - 1].usedAt
                      ).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TokenAnalytics;