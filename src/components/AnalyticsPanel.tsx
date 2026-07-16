/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { DatabaseState, AuditLog } from "../types";
import { TrendingUp, Coins, Activity, Percent, Award, ShoppingBag, ArrowUpRight } from "lucide-react";

interface AnalyticsPanelProps {
  config: DatabaseState;
  logs: AuditLog[];
  fishStats: { [key: string]: { count: number; payout: number } };
}

export default function AnalyticsPanel({ config, logs, fishStats }: AnalyticsPanelProps) {
  // Compute rolling actual RTP
  const actualRtp = useMemo(() => {
    if (config.totalIncome === 0) return 96.0;
    const ratio = (config.totalPayout / config.totalIncome) * 100;
    return parseFloat(ratio.toFixed(2));
  }, [config.totalIncome, config.totalPayout]);

  // Extract capture logs
  const captureHistory = useMemo(() => {
    return logs
      .filter((log) => log.message.includes("captured") || log.message.includes("Win") || log.message.includes("Jackpot"))
      .slice(0, 15);
  }, [logs]);

  // Safe parsed fish list
  const fishList = useMemo(() => {
    const list = Object.entries(fishStats).map(([name, stat]) => ({
      name,
      count: stat.count,
      payout: stat.payout,
    }));
    return list.sort((a, b) => b.payout - a.payout);
  }, [fishStats]);

  // Simulated sparkline coordinates for rolling RTP
  const rtpHistoryPoints = useMemo(() => {
    const base = [95.2, 95.8, 96.1, 94.8, 95.0, 96.5, 96.2, actualRtp];
    while (base.length < 12) {
      base.unshift(95.0 + Math.random());
    }
    const maxVal = Math.max(...base) + 0.5;
    const minVal = Math.min(...base) - 0.5;
    const range = maxVal - minVal || 1;

    return base.map((val, idx) => {
      const x = (idx / (base.length - 1)) * 100;
      const y = 100 - ((val - minVal) / range) * 80 - 10; // offset slightly
      return `${x},${y}`;
    }).join(" ");
  }, [actualRtp]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[620px] bg-slate-900 text-slate-100 rounded-xl overflow-hidden p-6 border border-slate-800 shadow-2xl font-sans">
      {/* Metrics Ledger (Col 1) */}
      <div className="lg:col-span-1 space-y-4 flex flex-col justify-between h-full">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-200">
              Economy Ledger & Balances
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Total Turnover */}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Turnover (Income)
              </span>
              <div className="text-xl font-black text-slate-100 font-mono mt-1">
                {config.totalIncome.toLocaleString()}
                <span className="text-xs text-slate-500 font-normal ml-1">coins</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">Total Bullet Costs</span>
            </div>

            {/* Total Payout */}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" /> Payout (Wins)
              </span>
              <div className="text-xl font-black text-slate-100 font-mono mt-1">
                {config.totalPayout.toLocaleString()}
                <span className="text-xs text-slate-500 font-normal ml-1">coins</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">Total Fish Captured</span>
            </div>
          </div>

          {/* RTP Monitor */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" /> Rolling RTP Ratio
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Target: {config.rtpSetting}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className={`text-2xl font-black font-mono ${actualRtp > config.rtpSetting ? "text-amber-400" : "text-emerald-400"}`}>
                {actualRtp}%
              </div>
              <span className="text-[10px] text-slate-500">Actual Return Ratio</span>
            </div>

            {/* Micro RTP History Sparkline */}
            <div className="h-16 mt-4 bg-slate-900 border border-slate-800/40 rounded-md overflow-hidden relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  points={rtpHistoryPoints}
                />
              </svg>
              <div className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-500 bg-slate-950/80 px-1 rounded">
                Live Spark
              </div>
            </div>
          </div>
        </div>

        {/* Progressive Jackpot Multi-Tier Card */}
        <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Progressive Jackpot Pool
          </span>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800/50">
              <span className="text-[10px] font-bold text-rose-400 uppercase">Grand Pool (1000x+)</span>
              <span className="font-bold text-slate-100">{(config.jackpotPool * 0.5).toFixed(1)} COINS</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800/50">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Mega Pool (200x+)</span>
              <span className="font-bold text-slate-100">{(config.jackpotPool * 0.3).toFixed(1)} COINS</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800/50">
              <span className="text-[10px] font-bold text-cyan-400 uppercase">Mini Pool (50x+)</span>
              <span className="font-bold text-slate-100">{(config.jackpotPool * 0.2).toFixed(1)} COINS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Captured Fish Stats (Col 2) */}
      <div className="lg:col-span-1 flex flex-col h-full bg-slate-950/40 border border-slate-800 rounded-lg p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-200">
            Fish Distribution & Capture Yields
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[10px]">
          {fishList.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-[11px] italic">
              No captures recorded yet in this room session.
            </div>
          ) : (
            fishList.map((fish, index) => {
              const maxPayout = fishList[0]?.payout || 1;
              const ratio = (fish.payout / maxPayout) * 100;
              return (
                <div key={fish.name} className="p-2 bg-slate-900 rounded border border-slate-800/60 space-y-1">
                  <div className="flex justify-between font-sans">
                    <span className="font-bold text-slate-200">
                      {index + 1}. {fish.name}
                    </span>
                    <span className="text-slate-500 text-[9px]">Captures: {fish.count}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>Total Payout: {fish.payout.toLocaleString()} coins</span>
                    <span>Yield: {((fish.payout / (config.totalPayout || 1)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1 rounded overflow-hidden">
                    <div className="bg-cyan-500 h-full" style={{ width: `${ratio}%` }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Transaction & Capture History Feed (Col 3) */}
      <div className="lg:col-span-1 flex flex-col h-full bg-slate-950/40 border border-slate-800 rounded-lg p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-200">
            Live Transaction Feed
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[10px]">
          {captureHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-[11px] italic text-center px-4">
              Awaiting high-yield transactions or jackpot captures from room session...
            </div>
          ) : (
            captureHistory.map((log) => {
              const isJackpot = log.message.includes("Jackpot") || log.message.includes("Mega") || log.message.includes("Grand");
              return (
                <div
                  key={log.id}
                  className={`p-2 rounded border space-y-1 ${
                    isJackpot
                      ? "bg-amber-950/15 border-amber-500/30 text-amber-300"
                      : "bg-slate-900 border-slate-800/80 text-slate-300"
                  }`}
                >
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>{log.timestamp}</span>
                    <span className={isJackpot ? "text-amber-400 font-bold" : "text-emerald-400"}>
                      {isJackpot ? "JACKPOT" : "CAPTURE_WON"}
                    </span>
                  </div>
                  <div className="text-[10px] leading-relaxed break-words">{log.message}</div>
                  <div className="flex justify-end text-[9px] text-slate-500">
                    <span>Status: Clear</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
