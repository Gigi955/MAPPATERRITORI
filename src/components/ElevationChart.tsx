import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrackPoint } from '../types'
import { haversine } from '../utils/calculations'

interface Props {
  points: TrackPoint[]
}

export default function ElevationChart({ points }: Props) {
  if (points.length < 2) return null

  // Calcola distanza progressiva per asse X
  let cumDist = 0
  const data = points
    .filter((_, i) => i % Math.max(1, Math.floor(points.length / 300)) === 0)
    .map((pt, i, arr) => {
      if (i > 0) {
        cumDist += haversine(arr[i - 1], pt)
      }
      return {
        dist: Math.round(cumDist * 100) / 100,
        ele: Math.round(pt.ele),
      }
    })

  return (
    <div className="w-full h-28 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="dist"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => `${v}km`}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => `${v}m`}
            width={40}
          />
          <Tooltip
            formatter={(v: number) => [`${v} m`, 'Quota']}
            labelFormatter={(l: number) => `${l} km`}
            contentStyle={{ fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="ele"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#elevGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
