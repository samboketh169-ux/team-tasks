"use client";

const LABEL_FROM = "\u1796\u17b8\u1790\u17d2\u1784\u17c3";
const LABEL_TO = "\u178a\u179b\u17cb\u1790\u17d2\u1784\u17c3";

export default function DateRangeFilter({ fromDate, toDate, onChange }) {
  return (
    <div className="card p-3 mb-4 flex flex-col sm:flex-row gap-3 sm:items-end">
      <div className="flex-1">
        <label className="text-xs text-inkFaint">{LABEL_FROM}</label>
        <input
          type="date"
          className="input-box mt-1"
          value={fromDate}
          onChange={(e) => onChange(e.target.value, toDate)}
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-inkFaint">{LABEL_TO}</label>
        <input
          type="date"
          className="input-box mt-1"
          value={toDate}
          onChange={(e) => onChange(fromDate, e.target.value)}
        />
      </div>
    </div>
  );
}
