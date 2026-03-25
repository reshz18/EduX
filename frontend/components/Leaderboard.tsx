import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { leaderboardAPI } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  TrendingUp, 
  Users, 
  Star,
  Calendar,
  Filter,
  Target,
  Zap
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  points: number;
  coursesCompleted: number;
  badges: number;
}

interface LeaderboardStats {
  totalUsers: number;
  averagePoints: number;
  maxPoints: number;
  totalPoints: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedLimit, setSelectedLimit] = useState(50);

  // Fetch leaderboard
  const { data: leaderboard, isLoading } = useQuery(
    ['leaderboard', selectedPeriod, selectedLimit],
    () => leaderboardAPI.getLeaderboard({ 
      period: selectedPeriod,
      limit: selectedLimit 
    })
  ) as { data: LeaderboardEntry[] | undefined, isLoading: boolean };

  // Fetch user rank
  const { data: userRank } = useQuery(
    'user-rank',
    leaderboardAPI.getUserRank
  ) as { data: { rank: number; percentile: number } | undefined };

  // Fetch leaderboard stats
  const { data: stats } = useQuery(
    'leaderboard-stats',
    leaderboardAPI.getStats
  ) as { data: { stats: LeaderboardStats } | undefined };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return 'success';
      case 2:
        return 'secondary';
      case 3:
        return 'warning';
      default:
        return 'outline';
    }
  };

  const periods = [
    { value: 'all', label: 'All Time' },
    { value: 'month', label: 'This Month' },
    { value: 'week', label: 'This Week' }
  ];

  const limits = [25, 50, 100];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            See how you rank among fellow learners
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Your Rank
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                #{userRank?.rank || 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          {userRank && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Top {userRank.percentile}% of learners
            </p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Your Points
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.points?.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Total Learners
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.stats?.totalUsers?.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Average Points
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats?.stats?.averagePoints || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Period:
              </span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show:
              </span>
              <select
                value={selectedLimit}
                onChange={(e) => setSelectedLimit(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {limits.map(limit => (
                  <option key={limit} value={limit}>
                    Top {limit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Updated in real-time
          </div>
        </div>
      </Card>

      {/* Top 3 Podium */}
      {leaderboard && leaderboard.length >= 3 && (
        <Card className="p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            🏆 Top Performers
          </h2>
          
          <div className="flex items-end justify-center space-x-8">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="relative mb-4">
                <img
                  src={leaderboard[1].avatar}
                  alt={leaderboard[1].name}
                  className="w-16 h-16 rounded-full mx-auto border-4 border-gray-300"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-24 flex flex-col justify-center">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {leaderboard[1].name}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {leaderboard[1].points.toLocaleString()} pts
                </p>
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="relative mb-4">
                <img
                  src={leaderboard[0].avatar}
                  alt={leaderboard[0].name}
                  className="w-20 h-20 rounded-full mx-auto border-4 border-yellow-400"
                />
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/20 rounded-lg p-4 h-32 flex flex-col justify-center">
                <p className="font-bold text-gray-900 dark:text-white">
                  {leaderboard[0].name}
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
                  {leaderboard[0].points.toLocaleString()} pts
                </p>
                <Badge variant="success" size="sm" className="mt-1">
                  Champion
                </Badge>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="relative mb-4">
                <img
                  src={leaderboard[2].avatar}
                  alt={leaderboard[2].name}
                  className="w-16 h-16 rounded-full mx-auto border-4 border-amber-600"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 h-24 flex flex-col justify-center">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {leaderboard[2].name}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {leaderboard[2].points.toLocaleString()} pts
                </p>
              </div>
            </motion.div>
          </div>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Full Rankings
        </h2>

        <div className="space-y-3">
          <AnimatePresence>
            {leaderboard?.map((entry: LeaderboardEntry, index: number) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  entry.id === user?.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10">
                    {getRankIcon(entry.rank)}
                  </div>

                  <img
                    src={entry.avatar}
                    alt={entry.name}
                    className="w-10 h-10 rounded-full"
                  />

                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {entry.name}
                      </p>
                      {entry.id === user?.id && (
                        <Badge variant="primary" size="sm">
                          You
                        </Badge>
                      )}
                      {entry.rank <= 3 && (
                        <Badge variant={getRankBadgeVariant(entry.rank)} size="sm">
                          {entry.rank === 1 ? 'Champion' : 
                           entry.rank === 2 ? 'Runner-up' : 
                           'Third Place'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{entry.coursesCompleted} courses completed</span>
                      <span>•</span>
                      <span>{entry.badges} badges earned</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {entry.points.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    points
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {leaderboard && leaderboard.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No rankings available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start learning and earning points to appear on the leaderboard!
            </p>
          </div>
        )}
      </Card>

      {/* Achievement Motivation */}
      <Card className="p-6 bg-blue-50 dark:bg-slate-800/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Climb the Leaderboard!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete courses, participate in challenges, and engage with the community to earn points and climb the rankings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}