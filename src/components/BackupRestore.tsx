
"use client";

import { useRef, useState } from "react";
import {
  createBackup,
  restoreBackup,
  validateBackup,
} from "@/lib/backup";

export default function BackupRestore() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);

  function exportBackup() {
    setMessage("");
    setError("");

    try {
      const backup = createBackup();
      const file = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `zevasewa-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage("Your backup file has been downloaded successfully.");
    } catch {
      setError("Could not create the backup. Please try again.");
    }
  }

  async function importBackup(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setMessage("");
    setError("");

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("Please select a valid JSON backup file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Backup file is too large. Maximum size is 10 MB.");
      event.target.value = "";
      return;
    }

    setRestoring(true);

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      if (!validateBackup(parsed)) {
        throw new Error("Invalid backup structure.");
      }

      const confirmed = window.confirm(
        "Restoring this backup will replace your current products, sales, purchases and cash transactions. Continue?"
      );

      if (!confirmed) {
        setMessage("Restore cancelled. Your current data was not changed.");
        return;
      }

      restoreBackup(parsed);
      setMessage(
        "Backup restored successfully. Refresh the page to see all restored data."
      );
    } catch {
      setError(
        "This backup file is invalid or damaged. Your existing data has not been changed."
      );
    } finally {
      setRestoring(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Backup & Restore
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Keep a safe copy of your ZevaSewa business data and restore it when needed.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 text-3xl">📥</div>
        <h3 className="text-lg font-semibold text-slate-900">
          Export Backup
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Download your products, sales, purchases and cash transactions
          into a JSON backup file.
        </p>

        <button
          type="button"
          onClick={exportBackup}
          className="mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-medium text-white hover:bg-green-800"
        >
          Download Backup
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 text-3xl">📤</div>
        <h3 className="text-lg font-semibold text-slate-900">
          Restore Backup
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Select a previously downloaded ZevaSewa JSON backup file.
          The file will be validated before restoring.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={importBackup}
          disabled={restoring}
          className="mt-5 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-medium file:text-green-800 hover:file:bg-green-100"
        />

        {restoring && (
          <p className="mt-3 text-sm text-slate-500">
            Validating backup file...
          </p>
        )}
      </section>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="font-semibold text-amber-900">
          Important: Restore warning
        </h3>
        <p className="mt-2 text-sm leading-6 text-amber-800">
          Restoring a backup replaces the current local business data.
          Download a fresh backup before restoring if you want to keep
          your existing information.
        </p>
      </section>
    </div>
  );
}
