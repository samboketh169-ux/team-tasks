"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function RangeBarChart({
  data,
  seriesA,
  seriesAName,
  seriesAColor,
  seriesB,
  seriesBName,
  seriesBColor,
  title,
}) {
  const hasData = data && data.length > 0;

  return (
    <div className="card p-4 mt-4">
      {title && <h3 className="font-display text-base mb-3">{title}</h3>}
      {!hasData && (
        <div className="text-center text-inkFaint text-sm py-10">
          {"\u1798\u17b7\u1793\u1791\u17b6\u1793\u17cb\u1798\u17b6\u1793\u1791\u17b7\u1793\u17d2\u1793\u1793\u17d0\u1799\u1780\u17d2\u1793\u17bb\u1784\u179a\u1799\u17c8\u1796\u17c1\u179b\u1793\u17c1\u17c7\u1791\u17c1"}
        </div>
      )}
      {hasData && (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243329" />
              <XAxis dataKey="date" tick={{ fill: "#7c9286", fontSize: 11 }} />
              <YAxis tick={{ fill: "#7c9286", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#16201b",
                  border: "1px solid #243329",
                  borderRadius: 8,
                  color: "#eef3ef",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={seriesA} name={seriesAName} fill={seriesAColor} radius={[4, 4, 0, 0]} />
              <Bar dataKey={seriesB} name={seriesBName} fill={seriesBColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
