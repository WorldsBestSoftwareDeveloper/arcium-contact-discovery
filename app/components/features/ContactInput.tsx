"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Plus,
  Trash2,
  FileText,
  Hash,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  parseContactList,
  parseContactCSV,
  type Contact,
  type ProcessedContacts,
} from "@/app/lib/utils/contacts";

interface ContactInputProps {
  label: string;
  description?: string;
  processed: ProcessedContacts | null;
  isProcessing: boolean;
  onContactsChange: (contacts: string[]) => void;
  onProcess: (contacts: string[]) => void;
}

export default function ContactInput({
  label,
  description,
  processed,
  isProcessing,
  onContactsChange,
  onProcess,
}: ContactInputProps) {
  const [inputMode, setInputMode] = useState<"manual" | "paste" | "csv">(
    "paste"
  );
  const [pasteText, setPasteText] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [manualList, setManualList] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addManual = () => {
    if (!manualInput.trim()) return;
    const updated = [...manualList, manualInput.trim()];
    setManualList(updated);
    setManualInput("");
    onContactsChange(updated);
  };

  const removeManual = (index: number) => {
    const updated = manualList.filter((_, i) => i !== index);
    setManualList(updated);
    onContactsChange(updated);
  };

  const handlePasteChange = (text: string) => {
    setPasteText(text);
    const parsed = parseContactList(text);
    onContactsChange(parsed);
  };

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    const contacts = parseContactCSV(text);
    onContactsChange(contacts);
    setPasteText(contacts.join("\n"));
    setInputMode("paste");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) {
      handleFileUpload(file);
    }
  };

  const getContacts = (): string[] => {
    if (inputMode === "manual") return manualList;
    return parseContactList(pasteText);
  };

  const contactCount = getContacts().length;

  return (
    <div className="bg-arcium-card border border-arcium-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-arcium-border flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-arcium-text text-sm">
            {label}
          </h3>
          {description && (
            <p className="text-xs text-arcium-muted mt-0.5">{description}</p>
          )}
        </div>
        {processed && (
          <div className="flex items-center gap-1.5 text-xs text-arcium-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{processed.stats.total} hashed</span>
          </div>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-arcium-border">
        {(["paste", "manual", "csv"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setInputMode(mode)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
              inputMode === mode
                ? "text-arcium-purple-light border-b-2 border-arcium-purple bg-arcium-purple/5"
                : "text-arcium-muted hover:text-arcium-text"
            }`}
          >
            {mode === "csv" ? "CSV Upload" : mode === "paste" ? "Paste List" : "Manual Entry"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Paste mode */}
        {inputMode === "paste" && (
          <textarea
            value={pasteText}
            onChange={(e) => handlePasteChange(e.target.value)}
            placeholder={"alice@example.com\nbob@gmail.com\n+1 555 123 4567\n..."}
            rows={6}
            className="w-full bg-arcium-surface border border-arcium-border rounded-lg px-3 py-2.5 text-sm font-mono text-arcium-text placeholder:text-arcium-muted/50 focus:outline-none focus:border-arcium-purple/50 resize-none"
          />
        )}

        {/* Manual mode */}
        {inputMode === "manual" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManual()}
                placeholder="email or phone number"
                className="flex-1 bg-arcium-surface border border-arcium-border rounded-lg px-3 py-2 text-sm font-mono text-arcium-text placeholder:text-arcium-muted/50 focus:outline-none focus:border-arcium-purple/50"
              />
              <button
                onClick={addManual}
                className="px-3 py-2 rounded-lg bg-arcium-purple/20 border border-arcium-purple/30 text-arcium-purple-light hover:bg-arcium-purple/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {manualList.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-1.5 rounded bg-arcium-surface text-sm font-mono text-arcium-text group"
                >
                  <span className="truncate">{c}</span>
                  <button
                    onClick={() => removeManual(i)}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-arcium-muted hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CSV mode */}
        {inputMode === "csv" && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? "border-arcium-purple bg-arcium-purple/10"
                : "border-arcium-border hover:border-arcium-purple/50"
            }`}
          >
            <Upload className="w-8 h-8 text-arcium-muted mx-auto mb-3" />
            <p className="text-sm text-arcium-muted mb-2">
              Drop a CSV file here
            </p>
            <p className="text-xs text-arcium-muted/60 mb-4">
              First column = contact (email or phone)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-arcium-surface border border-arcium-border text-sm text-arcium-text hover:border-arcium-purple/50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 inline-block mr-2" />
              Browse file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </div>
        )}

        {/* Stats row */}
        {contactCount > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-arcium-muted">
              <Hash className="w-3 h-3" />
              <span>
                {contactCount} contact{contactCount !== 1 ? "s" : ""} ready
              </span>
            </div>
            <button
              onClick={() => onProcess(getContacts())}
              disabled={isProcessing || contactCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-arcium-purple/20 border border-arcium-purple/30 text-arcium-purple-light text-xs hover:bg-arcium-purple/30 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-3 h-3 border border-arcium-purple-light border-t-transparent rounded-full animate-spin" />
                  Hashing...
                </>
              ) : (
                <>
                  <Hash className="w-3 h-3" />
                  Hash & Preview
                </>
              )}
            </button>
          </div>
        )}

        {/* Processed preview */}
        {processed && (
          <div className="mt-3 p-3 rounded-lg bg-arcium-surface border border-arcium-success/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-arcium-success font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Contact set processed
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-mono text-arcium-text font-bold">{processed.stats.total}</div>
                <div className="text-arcium-muted">unique</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-arcium-text font-bold">{processed.stats.emails}</div>
                <div className="text-arcium-muted">emails</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-arcium-text font-bold">{processed.stats.phones}</div>
                <div className="text-arcium-muted">phones</div>
              </div>
            </div>
            {/* Sample hash preview */}
            {processed.contacts[0] && (
              <div className="text-xs font-mono text-arcium-muted/60 truncate">
                {processed.contacts[0].hash.slice(0, 32)}...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
