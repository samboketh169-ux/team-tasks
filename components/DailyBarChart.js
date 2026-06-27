"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const LABEL_TITLE = "\u1793\u17b7\u1793\u17d2\u1793\u17b6\u1780\u17b6\u179a\u1794\u17d2\u179a\u1785\u17b6\u17c6\u1790\u17d2\u1784\u17c3";
const LABEL_TOTAL = "\u179f\u179a\u17bb\u1794";
const LABEL_DONE = "\u1794\u17b6\u1793\u1794\u1789\u17d2\u1785\u1794\u17cb";
const LABEL_PENDING = "\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1785\u1794\u17cb";

export default function DailyBarChart({ data }) {
  return (
    <div className="card p-4">
      <h3 className="font-display text-base mb-3">{LABEL_TITLE}</h3>
      {(!data || data.length === 0) ? (
        <div className="text-inkFaint text-sm text-center py-10">
          {"\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1798\u17b6\u1793\u1791\u17b7\u1793\u17d2\u1793\u1793\u17d0\u1799\u1780\u17d2\u1793\u17bb\u1784\u178a\u17c6\u178e\u17b6\u1780\u17cb\u1780\u17b6\u179b\u1796\u17c1\u179b\u178a\u17c2\u179b\u1787\u17d2\u179a\u17be\u179f\u179a\u17be\u179f"}
        </div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243329" />
              <XAxis dataKey="label" stroke="#7c9286" fontSize={11} />
              <YAxis stroke="#7c9286" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#16201b", border: "1px solid #243329", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#eef3ef" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="done" name={LABEL_DONE} stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" name={LABEL_PENDING} stackId="a" fill="#ff6a3d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
