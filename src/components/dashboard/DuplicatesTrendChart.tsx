import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

interface DuplicatesTrendChartProps {
  data: Array<{ week: string; same: number; other: number }>;
  sameLabel?: string;
}

export function DuplicatesTrendChart({ data, sameLabel }: DuplicatesTrendChartProps) {
  const chartData = data.map((item) => ({
    week: item.week.slice(5),
    same: item.same,
    other: item.other,
  }));
  const sameName = sameLabel && sameLabel.trim().length > 0 ? sameLabel : "Mismo partner";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Duplicados por semana (90d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(220 10% 50%)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(220 10% 50%)', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 100%)',
                    border: '1px solid hsl(220 13% 91%)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="same" stackId="a" name={sameName} fill="hsl(152 60% 35%)" />
                <Bar dataKey="other" stackId="a" name="Otro partner" fill="hsl(84 80% 45%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

