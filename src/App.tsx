/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from "react";
import { DatabaseState, AuditLog } from "./types";
import GameArena from "./components/GameArena";
import SpecificationView from "./components/SpecificationView";
import AdminConsole from "./components/AdminConsole";
import AnalyticsPanel from "./components/AnalyticsPanel";
import { Gamepad2, FileText, Settings, BarChart2, Coins, Server, RefreshCw } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"game" | "specs" | "admin" | "analytics">("game");

  // Enforce state-stabilization to prevent re-renders on every game update
  const [userBalance, setUserBalance] = useState<number>(10000);

  // Shared operational states
  const [config, setConfig] = useState<DatabaseState>({
    rtpSetting: 96,
    houseEdge: 4,
    antiCheatActive: {
      speedHack: true,
      autoFire: true,
      aimBot: true,
      packetValidation: true,
    },
    jackpotPool: 25000,
    totalIncome: 142500,
    totalPayout: 136800,
    spawnRateModifier: 1.0,
  });

  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: "init_1",
      timestamp: "05:15:10",
      category: "SYSTEM",
      message: "DeepSea King Kernel Engine initialized. Real-time clock syncing with host...",
      severity: "info",
    },
    {
      id: "init_2",
      timestamp: "05:15:12",
      category: "SECURITY",
      message: "Enforcing strict SHA-256 validation policies for all room sockets.",
      severity: "info",
    },
    {
      id: "init_3",
      timestamp: "05:15:15",
      category: "ECONOMY",
      message: "Progressive Jackpot allocation matrix enabled. Pool seeded with 25,000 coins.",
      severity: "info",
    },
  ]);

  const [fishStats, setFishStats] = useState<{ [key: string]: { count: number; payout: number } }>({
    "Steel Shark": { count: 3, payout: 1500 },
    "Razor Swordfish": { count: 8, payout: 1200 },
    "Luminous Jellyfish": { count: 12, payout: 960 },
    "Clownfish": { count: 45, payout: 900 },
  });

  // Action methods with useCallback to guarantee they are referentially stable
  const addLog = useCallback((category: AuditLog["category"], message: string, severity: AuditLog["severity"]) => {
    const timeStr = new Date().toTimeString().split(" ")[0];
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: timeStr,
      category,
      message,
      severity,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]); // keep last 50 logs
  }, []);

  const incrementFishCaptured = useCallback((name: string, payout: number) => {
    setFishStats((prev) => {
      const existing = prev[name] || { count: 0, payout: 0 };
      return {
        ...prev,
        [name]: {
          count: existing.count + 1,
          payout: existing.payout + payout,
        },
      };
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const rechargeBalance = () => {
    setUserBalance((prev) => prev + 5000);
    addLog("ECONOMY", "Wallet transaction validated: Player 1 completed balance deposit +5000 coins.", "info");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 font-sans antialiased selection:bg-emerald-500 selection:text-slate-900">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        
        {/* AAA Main Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden shrink-0">
          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-emerald-400/20">
              <Gamepad2 className="w-6 h-6 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase">
                  DeepSea King
                </h1>
                <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[9px] font-bold tracking-widest uppercase rounded">
                  v2.0-Prod
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multiplayer Fish Arcade Engine & Tech Specifications Viewers
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg flex items-center gap-3 font-mono text-xs shadow-inner">
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Coins className="w-4 h-4" />
                <span>${userBalance.toLocaleString()}</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="text-slate-400 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">ROOM #201</span>
              </div>
            </div>

            <button
              onClick={rechargeBalance}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black uppercase rounded-lg shadow-md hover:shadow-emerald-500/10 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recharge Coins
            </button>
          </div>
        </header>

        {/* Tab Controls Bar */}
        <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px shrink-0 select-none">
          {[
            { id: "game" as const, label: "60FPS Game Arena", icon: <Gamepad2 className="w-4 h-4" /> },
            { id: "specs" as const, label: "Tech Design (TDD)", icon: <FileText className="w-4 h-4" /> },
            { id: "admin" as const, label: "Operator Admin", icon: <Settings className="w-4 h-4" /> },
            { id: "analytics" as const, label: "Economy Ledger", icon: <BarChart2 className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-2 rounded-t-lg ${
                activeTab === tab.id
                  ? "bg-slate-900 border-emerald-500 text-emerald-400 shadow-md"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active Tab Container */}
        <main className="flex-1 min-h-0">
          {activeTab === "game" && (
            <GameArena
              config={config}
              updateConfig={setConfig}
              addLog={addLog}
              incrementFishCaptured={incrementFishCaptured}
              userBalance={userBalance}
              setUserBalance={setUserBalance}
            />
          )}

          {activeTab === "specs" && <SpecificationView />}

          {activeTab === "admin" && (
            <AdminConsole
              config={config}
              updateConfig={setConfig}
              logs={logs}
              addLog={addLog}
              clearLogs={clearLogs}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsPanel
              config={config}
              logs={logs}
              fishStats={fishStats}
            />
          )}
        </main>
      </div>
    </div>
  );
}
