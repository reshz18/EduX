import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { rewardsAPI } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { Gift, Zap, Trophy, Clock, History, Target, TrendingUp } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'react-hot-toast';

interface Reward {
  type: string;
  points: number;
  label: string;
  color: string;
  probability: number;
}

interface SpinResult {
  success: boolean;
  segmentIndex: number;
  reward: { type: string; points: number; label: string; color: string; isMystery: boolean; actualLabel: string };
  totalPointsAwarded: number;
  newBalance: number;
  totalSpins: number;
  newBadges: string[];
  canSpin: boolean;
}

const SPIN_DURATION = 5000;
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

// ── Canvas Wheel ──────────────────────────────────────────────────────────────
const WheelCanvas: React.FC<{
  rewards: Reward[];
  targetIndex: number | null;
  spinning: boolean;
  onSpinEnd: () => void;
}> = ({ rewards, targetIndex, spinning, onSpinEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const rafRef = useRef<number>(0);
  const onSpinEndRef = useRef(onSpinEnd);
  // Keep ref current so the animation closure always calls the latest callback
  useEffect(() => { onSpinEndRef.current = onSpinEnd; }, [onSpinEnd]);

  const segAngle = rewards.length ? (2 * Math.PI) / rewards.length : 0;

  const draw = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !rewards.length) return;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const W = canvas.width, cx = W / 2, cy = W / 2, R = W / 2 - 16;
    ctx.clearRect(0, 0, W, W);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 32;
    ctx.beginPath(); ctx.arc(cx, cy, R + 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.restore();

    rewards.forEach((reward, i) => {
      const startA = rotation + i * segAngle, endA = startA + segAngle;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, startA, endA);
      ctx.closePath(); ctx.fillStyle = reward.color; ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();

      ctx.save();
      const midA = startA + segAngle / 2;
      ctx.translate(cx + R * 0.68 * Math.cos(midA), cy + R * 0.68 * Math.sin(midA));
      ctx.rotate(midA + Math.PI / 2);
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8;
      if (reward.type === 'mystery_reward') {
        ctx.font = 'bold 48px sans-serif'; ctx.fillText('?', 0, -8);
        ctx.font = 'bold 24px sans-serif'; ctx.fillText('MYSTERY', 0, 28);
      } else if (reward.type === 'bonus_xp') {
        ctx.font = 'bold 36px sans-serif'; ctx.fillText('BONUS', 0, -8);
        ctx.font = 'bold 24px sans-serif'; ctx.fillText('XP', 0, 28);
      } else {
        ctx.font = 'bold 40px sans-serif'; ctx.fillText(String(reward.points), 0, -8);
        ctx.font = 'bold 24px sans-serif'; ctx.fillText('PTS', 0, 28);
      }
      ctx.restore();
    });

    ctx.beginPath(); ctx.arc(cx, cy, 72, 0, 2 * Math.PI);
    ctx.fillStyle = '#2563eb'; ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🎁', cx, cy); ctx.textBaseline = 'alphabetic';
  }, [rewards, segAngle]);

  useEffect(() => { draw(rotationRef.current); }, [draw]);

  useEffect(() => {
    if (!spinning || targetIndex === null) return;
    cancelAnimationFrame(rafRef.current);

    // Land the centre of targetIndex segment under the top pointer
    const midOfTarget = (targetIndex + 0.5) * segAngle;
    const rawTarget = -Math.PI / 2 - midOfTarget;
    const extraSpins = (5 + Math.random() * 3) * 2 * Math.PI;
    const startAngle = rotationRef.current;
    const delta = ((rawTarget + extraSpins - startAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const endAngle = startAngle + delta + Math.floor(extraSpins / (2 * Math.PI)) * 2 * Math.PI;
    const startTime = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / SPIN_DURATION, 1);
      const angle = startAngle + (endAngle - startAngle) * easeOutCubic(t);
      rotationRef.current = angle;
      draw(angle);
      if (t < 1) { rafRef.current = requestAnimationFrame(animate); }
      else { onSpinEndRef.current(); }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spinning, targetIndex, segAngle, draw]);

  return (
    <div className="relative inline-block">
      <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-20 flex flex-col items-center">
        <div className="w-0 h-0" style={{ borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '28px solid #dc2626', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
        <div className="w-4 h-4 bg-red-600 rounded-full -mt-1 shadow-lg border-2 border-white" />
      </div>
      <canvas ref={canvasRef} width={640} height={640} className="rounded-full" style={{ display: 'block', width: '320px', height: '320px', imageRendering: 'crisp-edges', WebkitFontSmoothing: 'antialiased' }} />
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function SpinWheel() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);
  const resultRef = useRef<SpinResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: canSpinData, isLoading } = useQuery('can-spin', rewardsAPI.canSpin, { refetchInterval: 60000 });
  const { data: rewardsConfig } = useQuery('rewards-config', rewardsAPI.getRewardsConfig);
  const { data: spinHistory } = useQuery('spin-history', () => rewardsAPI.getSpinHistory(1, 8), { enabled: showHistory });

  const rewards: Reward[] = (rewardsConfig as any)?.rewards || [];

  const spinMutation = useMutation(rewardsAPI.spin, {
    onSuccess: (data: any) => {
      // Use segmentIndex from backend — no label matching needed, no mismatch possible
      resultRef.current = data;
      setResult(data);
      setTargetIndex(data.segmentIndex);
      if (user) updateUser({ points: data.newBalance });
      queryClient.invalidateQueries('can-spin');
      queryClient.invalidateQueries('leaderboard');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Spin failed. Please try again.');
      setIsSpinning(false);
      setTargetIndex(null);
    }
  });

  const handleSpin = () => {
    if (!(canSpinData as any)?.canSpin || isSpinning) return;
    setIsSpinning(true);
    setResult(null);
    resultRef.current = null;
    setTargetIndex(null);
    spinMutation.mutate();
  };

  // Called when canvas animation ends — reads from ref to avoid stale closure
  const handleSpinEnd = useCallback(() => {
    setIsSpinning(false);
    const r = resultRef.current;
    if (!r) return;
    toast.success(`🎉 You won ${r.totalPointsAwarded} points!`, { duration: 4000 });
    r.newBadges?.forEach((b: string) => toast.success(`🏆 New badge: ${b}`, { duration: 4000 }));
    setShowModal(true);
  }, []);

  const formatTime = (t: { hours: number; minutes: number }) =>
    t.hours > 0 ? `${t.hours}h ${t.minutes}m` : `${t.minutes}m`;

  if (isLoading) return <LoadingSpinner />;

  const canSpin = (canSpinData as any)?.canSpin;
  const totalSpins = (canSpinData as any)?.totalSpins || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Spin & Win</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Spin once daily to earn points!</p>
        </div>
        <Button variant="outline" onClick={() => setShowHistory(!showHistory)} icon={<History className="w-4 h-4" />}>
          {showHistory ? 'Hide History' : 'History'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wheel */}
        <div className="lg:col-span-2">
          <Card className="p-8 text-center">
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: <Trophy className="w-5 h-5 text-yellow-500" />, value: user?.points?.toLocaleString() || 0, label: 'Points' },
                { icon: <Target className="w-5 h-5 text-blue-500" />, value: totalSpins, label: 'Total Spins' }
              ].map(({ icon, value, label }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {icon}
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            {rewards.length > 0 && (
              <div className="flex justify-center mb-8 p-4 rounded-2xl bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent">
                <div className="drop-shadow-lg">
                  <WheelCanvas rewards={rewards} targetIndex={targetIndex} spinning={isSpinning} onSpinEnd={handleSpinEnd} />
                </div>
              </div>
            )}

            {canSpin ? (
              <Button variant="primary" size="lg" onClick={handleSpin} disabled={isSpinning} className="w-full py-4 text-lg font-bold"
                icon={isSpinning ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-5 h-5" />}>
                {isSpinning ? 'Spinning…' : 'Spin Now!'}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 py-4 px-6 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                  <Clock className="w-5 h-5" />
                  <span>Next spin in: <strong>{(canSpinData as any)?.remainingTime ? formatTime((canSpinData as any).remainingTime) : '—'}</strong></span>
                </div>
                <p className="text-sm text-gray-400">Come back tomorrow for your daily spin!</p>
              </div>
            )}
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-blue-500" /> Possible Rewards
            </h3>
            <div className="space-y-3">
              {rewards.map((reward, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-md flex-shrink-0" style={{ backgroundColor: reward.color }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {reward.type === 'mystery_reward' ? 'Mystery Reward' : reward.type === 'bonus_xp' ? 'Bonus XP' : `${reward.points} Points`}
                    </span>
                  </div>
                  <span className="text-sm font-bold px-2 py-1 rounded-full bg-white dark:bg-gray-600" style={{ color: reward.color }}>{(reward.probability * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800 text-xs text-pink-700 dark:text-pink-300 space-y-1">
              <p className="font-bold text-pink-800 dark:text-pink-200 mb-1">🎁 Mystery rewards include:</p>
              <p>• 150–300 Bonus Points</p>
              <p>• Mystery Badges</p>
              <p>• MEGA BONUS up to 300 pts</p>
            </div>
          </Card>

          {showHistory && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Recent Spins
              </h3>
              {!(spinHistory as any)?.history?.length ? (
                <p className="text-sm text-gray-400 text-center py-4">No spins yet</p>
              ) : (
                <div className="space-y-2">
                  {(spinHistory as any).history.map((spin: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{spin.rewardLabel}</p>
                        <p className="text-xs text-gray-400">{new Date(spin.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="primary" size="sm">+{spin.pointsAwarded}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {(spinHistory as any)?.stats && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{(spinHistory as any).stats.totalPointsEarned?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-400">Total Earned</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round((spinHistory as any).stats.averagePoints || 0)}</p>
                    <p className="text-xs text-gray-400">Avg / Spin</p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showModal && result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.7, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="text-6xl mb-4">{result.reward.isMystery ? '🎁' : '🎉'}</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {result.reward.isMystery ? 'Mystery Revealed!' : 'You Won!'}
              </h2>

              {result.reward.isMystery && (
                <div className="mb-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-700">
                  <p className="text-pink-700 dark:text-pink-300 font-semibold">{result.reward.actualLabel}</p>
                </div>
              )}

              <p className="text-gray-500 dark:text-gray-400 mb-6">
                You earned <span className="font-bold text-green-600 text-lg">{result.totalPointsAwarded} points</span>
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2 mb-6 text-sm">
                {!result.reward.isMystery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Reward</span>
                    <span className="font-semibold text-gray-900 dark:text-white">+{result.reward.points} pts</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                  <span>New balance</span>
                  <span>{result.newBalance.toLocaleString()} pts</span>
                </div>
              </div>

              {result.newBadges?.length > 0 && (
                <div className="mb-6">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">🏆 New Badges!</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {result.newBadges.map((badge, i) => <Badge key={i} variant="success">{badge}</Badge>)}
                  </div>
                </div>
              )}

              <Button variant="primary" onClick={() => setShowModal(false)} className="w-full">Awesome!</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
