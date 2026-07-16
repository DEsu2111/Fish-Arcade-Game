/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SPECIFICATIONS, SpecSection } from "../data/specification";
import { FileText, Database, ShieldAlert, Cpu, Award, Zap, Library, BookOpen } from "lucide-react";

export default function SpecificationView() {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const getIcon = (id: string) => {
    switch (id) {
      case "overview":
        return <BookOpen className="w-5 h-5" />;
      case "modules":
        return <Library className="w-5 h-5" />;
      case "architecture":
        return <Zap className="w-5 h-5" />;
      case "database":
        return <Database className="w-5 h-5" />;
      case "ai":
        return <Cpu className="w-5 h-5" />;
      case "mathematics":
        return <Award className="w-5 h-5" />;
      case "security":
        return <ShieldAlert className="w-5 h-5" />;
      case "performance":
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const selectedSpec = SPECIFICATIONS.find((s) => s.id === activeSection) || SPECIFICATIONS[0];

  return (
    <div className="flex h-[620px] bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-1 overflow-y-auto">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <FileText className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-sm tracking-wide uppercase text-slate-300">
            Tech Design (TDD)
          </span>
        </div>

        {SPECIFICATIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all ${
              activeSection === section.id
                ? "bg-emerald-600/25 text-emerald-400 border-l-4 border-emerald-500 shadow-md pl-2"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            {getIcon(section.id)}
            <span className="truncate">{section.title}</span>
          </button>
        ))}

        <div className="mt-auto border-t border-slate-800 pt-4 px-3 text-[10px] text-slate-500 font-mono">
          <div>Platform: Web & Cabinet</div>
          <div>Specs v4.2.1-Prod</div>
          <div>Date: 2026-07-16</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-900 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 pb-4 border-b border-slate-800">
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-500 tracking-wider">
              Software Architecture Document & Technical Design Blueprint
            </span>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">
              {selectedSpec.title}
            </h1>
          </div>

          <div className="prose prose-invert prose-emerald max-w-none text-slate-300 leading-relaxed text-xs font-sans space-y-4">
            {selectedSpec.content.split("\n\n").map((para, index) => {
              // Custom simple renderer for Headings & Lists inside our Markdown content
              if (para.startsWith("## ")) {
                return (
                  <h3 key={index} className="text-sm font-bold text-slate-100 border-b border-slate-800/60 pb-1 mt-6">
                    {para.replace("## ", "")}
                  </h3>
                );
              }
              if (para.startsWith("*   ")) {
                return (
                  <ul key={index} className="list-disc pl-5 space-y-1.5 my-2">
                    {para.split("\n").map((li, liIdx) => {
                      const text = li.replace("*   ", "").replace("-   ", "");
                      const boldParts = text.split(":");
                      if (boldParts.length > 1) {
                        return (
                          <li key={liIdx}>
                            <strong className="text-slate-100">{boldParts[0]}:</strong>
                            {boldParts.slice(1).join(":")}
                          </li>
                        );
                      }
                      return <li key={liIdx}>{text}</li>;
                    })}
                  </ul>
                );
              }
              if (para.startsWith("```")) {
                const codeLines = para.replace(/```[a-z]*/g, "").trim().split("\n");
                return (
                  <pre key={index} className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-[10px] font-mono text-emerald-400 border border-slate-800 my-4 leading-normal">
                    <code>{codeLines.join("\n")}</code>
                  </pre>
                );
              }
              if (para.includes("$$")) {
                // Formatting math-like blocks beautifully
                const mathText = para.replace(/\$\$/g, "").trim();
                return (
                  <div key={index} className="my-4 p-3 bg-slate-950 border-l-4 border-emerald-500 rounded-r-lg font-mono text-[11px] text-center text-slate-200">
                    {mathText}
                  </div>
                );
              }
              return <p key={index}>{para}</p>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
