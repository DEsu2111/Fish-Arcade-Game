/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DatabaseState, AuditLog } from "../types";
import { ShieldCheck, ShieldAlert, Cpu, Database, AlertCircle, RefreshCw, Sliders, PlayCircle } from "lucide-react";

interface AdminConsoleProps {
  config: DatabaseState;
  updateConfig: (updater: (prev: DatabaseState) => DatabaseState) => void;
  logs: AuditLog[];
  addLog: (category: AuditLog["category"], message: string, severity: AuditLog["severity"]) => void;
  clearLogs: () => void;
}

export default function AdminConsole({ config, updateConfig, logs, addLog, clearLogs }: AdminConsoleProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [simulatedLoad, setSimulatedLoad] = useState({
    cpu: 24,
    mem: 38,
    activeRooms: 124,
    activePlayers: 492,
  });

  const toggleAntiCheat = (key: keyof DatabaseState["antiCheatActive"]) => {
    updateConfig((prev) => {
      const nextActive = { ...prev.antiCheatActive, [key]: !prev.antiCheatActive[key] };
      const status = nextActive[key] ? "ENABLED" : "DISABLED";
      addLog("SECURITY", `Anti-Cheat policy update: ${key.toUpperCase()} protection is now ${status}.`, "warning");
      return { ...prev, antiCheatActive: nextActive };
    });
  };

  const handleRtpChange = (newRtp: number) => {
    updateConfig((prev) => {
      const prevRtp = prev.rtpSetting;
      const severity = newRtp < 90 ? "critical" : newRtp > 98 ? "warning" : "info";
      addLog(
        "ECONOMY",
        `RTP ratio recalibration: Dynamic Return-To-Player modified from ${prevRtp}% to ${newRtp}%. House edge set to ${100 - newRtp}%.`,
        severity
      );
      return {
        ...prev,
        rtpSetting: newRtp,
        houseEdge: 100 - newRtp,
      };
    });
  };

  const handleSpawnModifierChange = (modifier: number) => {
    updateConfig((prev) => {
      addLog("SPAWNER", `Spawner frequency scale adjusted to ${modifier}x. Redesigning timeline intervals.`, "info");
      return { ...prev, spawnRateModifier: modifier };
    });
  };

  const forceTriggerLog = (category: AuditLog["category"], message: string, severity: AuditLog["severity"]) => {
    addLog(category, message, severity);
  };

  const refreshSystemMetrics = () => {
    setSimulatedLoad({
      cpu: Math.floor(Math.random() * 30) + 15,
      mem: Math.floor(Math.random() * 15) + 30,
      activeRooms: Math.floor(Math.random() * 40) + 100,
      activePlayers: Math.floor(Math.random() * 200) + 400,
    });
    addLog("SYSTEM", "Container health evaluation completed. Node balance cluster operational.", "info");
  };

  const filteredLogs = logs.filter((log) => activeCategory === "ALL" || log.category === activeCategory);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[620px] bg-slate-900 text-slate-100 rounded-xl overflow-hidden p-6 border border-slate-800 shadow-2xl font-sans">
      {/* Dynamic Controls Column */}
      <div className="lg:col-span-1 space-y-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-200">
              Casino Risk & RTP Engine
            </h2>
          </div>

          <div className="space-y-4">
            {/* RTP Settings Card */}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-300">Target RTP Setting</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{config.rtpSetting}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="99"
                value={config.rtpSetting}
                onChange={(e) => handleRtpChange(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                <span>RNG Minimum (80%)</span>
                <span>House Margin: {config.houseEdge}%</span>
                <span>Max (99%)</span>
              </div>
              {config.rtpSetting < 90 && (
                <div className="flex items-center gap-1.5 mt-2 bg-rose-950/40 border border-rose-900/50 p-2 rounded text-[10px] text-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Warning: Payout under 90% may violate regional gaming commission standards.</span>
                </div>
              )}
            </div>

            {/* Fish Spawn Rates Settings Card */}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-300">Fish Spawn Density</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">{config.spawnRateModifier}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.5"
                value={config.spawnRateModifier}
                onChange={(e) => handleSpawnModifierChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Sparse (0.5x)</span>
                <span>Interval Period</span>
                <span>Overpopulated (3.0x)</span>
              </div>
            </div>

            {/* Manual Triggers Card */}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block mb-1">Manual Server Triggers</span>
              <button
                onClick={() => forceTriggerLog("SPAWNER", "System scheduled an instant Wave Invasion: Golden Toad Row.", "warning")}
                className="w-full py-1.5 text-left pl-3 text-[11px] font-medium rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center justify-between"
              >
                <span>Deploy Spawner Wave Invasion</span>
                <PlayCircle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const pot = Math.floor(Math.random() * 2000) + 1000;
                  updateConfig(p => ({ ...p, jackpotPool: p.jackpotPool + pot }));
                  forceTriggerLog("ECONOMY", `Progressive Jackpot injection added. Mega pool credited +${pot} coins.`, "info");
                }}
                className="w-full py-1.5 text-left pl-3 text-[11px] font-medium rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center justify-between"
              >
                <span>Inject Wallet Jackpot Pool</span>
                <Database className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Server Nodes health */}
        <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Cpu className="w-4 h-4 text-emerald-400" /> Server Node Health
            </span>
            <button onClick={refreshSystemMetrics} className="text-slate-400 hover:text-emerald-400 transition-all">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-900 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">Node CPU Load</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{simulatedLoad.cpu}%</div>
              <div className="w-full bg-slate-800 h-1 rounded overflow-hidden mt-1">
                <div className="bg-emerald-500 h-full" style={{ width: `${simulatedLoad.cpu}%` }}></div>
              </div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">RAM Allocation</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{simulatedLoad.mem}%</div>
              <div className="w-full bg-slate-800 h-1 rounded overflow-hidden mt-1">
                <div className="bg-cyan-500 h-full" style={{ width: `${simulatedLoad.mem}%` }}></div>
              </div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">Active Rooms</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{simulatedLoad.activeRooms}</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">Connected Users</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{simulatedLoad.activePlayers}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Policies Column */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-200">
            Anti-Cheat & Security
          </h2>
        </div>

        <div className="space-y-3">
          {/* Active Shields Toggles */}
          {[
            {
              key: "speedHack" as const,
              title: "Speed-Hack Interception Engine",
              desc: "Ensures bullet transit timestamp updates match server authoritative clocks. Intercepts rapid packet-firing vectors.",
            },
            {
              key: "autoFire" as const,
              title: "Macro & Auto-Fire Ban-Filter",
              desc: "Measures standard deviation patterns of tap frequencies. Blocks scripting bots and hardware controllers.",
            },
            {
              key: "aimBot" as const,
              title: "Aim-Bot Coordinate Monitor",
              desc: "Analyzes sudden instant lock angles without rotational interpolation. Flags robotic perfect targeting sweeps.",
            },
            {
              key: "packetValidation" as const,
              title: "Dynamic Packet Hash Verification",
              desc: "Enforces SHA-256 payload verification for each bullet collision. Restricts client-side balance injections.",
            },
          ].map((item) => {
            const active = config.antiCheatActive[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleAntiCheat(item.key)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  active
                    ? "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/60"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold ${active ? "text-emerald-400" : "text-slate-300"}`}>
                    {item.title}
                  </span>
                  <div
                    className={`w-7 h-4 rounded-full p-0.5 transition-all ${
                      active ? "bg-emerald-500 flex justify-end" : "bg-slate-800 flex justify-start"
                    }`}
                  >
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">{item.desc}</p>
                <div className="flex items-center gap-1.5 mt-2 font-mono text-[9px]">
                  <span className={`px-1.5 py-0.5 rounded ${active ? "bg-emerald-950 text-emerald-400" : "bg-slate-900 text-slate-500"}`}>
                    Status: {active ? "SECURE" : "UNPROTECTED"}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-500">Type: Kernel Authoritative</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Live Audit Logs */}
      <div className="lg:col-span-1 flex flex-col justify-between h-full bg-slate-950/40 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" /> Authoritative Live Audit
            </span>
            <button
              onClick={clearLogs}
              className="text-[10px] text-slate-500 hover:text-rose-400 font-mono transition-all"
            >
              [Clear Register]
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-none shrink-0 font-mono text-[9px]">
            {["ALL", "ECONOMY", "SECURITY", "SPAWNER", "SYSTEM"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-0.5 rounded uppercase ${
                  activeCategory === cat ? "bg-slate-800 text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Audit Logs Screen */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[10px] leading-relaxed">
            {filteredLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-[11px] italic">
                No active events registered in index.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-2 bg-slate-950/80 rounded border border-slate-900/60 space-y-0.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-600">{log.timestamp}</span>
                    <span
                      className={`font-bold ${
                        log.category === "SECURITY"
                          ? "text-rose-400"
                          : log.category === "ECONOMY"
                          ? "text-emerald-400"
                          : "text-cyan-400"
                      }`}
                    >
                      [{log.category}]
                    </span>
                  </div>
                  <div className="text-slate-300 text-[9px]">{log.message}</div>
                  <div className="flex justify-end">
                    <span
                      className={`text-[8px] font-bold px-1 rounded ${
                        log.severity === "critical"
                          ? "bg-rose-950/60 text-rose-300"
                          : log.severity === "warning"
                          ? "bg-amber-950/60 text-amber-300"
                          : "bg-emerald-950/60 text-emerald-300"
                      }`}
                    >
                      {log.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
