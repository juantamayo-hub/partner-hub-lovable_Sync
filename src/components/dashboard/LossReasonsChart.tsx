import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";

type LossReasonItem = { reason: string; count: number };

interface LossReasonsChartProps {
  data: LossReasonItem[];
}

const COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(82, 85%, 45%)",
  "hsl(201, 90%, 40%)",
  "hsl(271, 76%, 53%)",
  "hsl(45, 93%, 47%)",
  "hsl(215, 14%, 60%)",
];

export function LossReasonsChart({ data }: LossReasonsChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const topItems = sorted.slice(0, 6);
  const remaining = sorted.slice(6);
  const otherCount = remaining.reduce((sum, item) => sum + item.count, 0);
  const chartData = [
    ...topItems.map((item) => ({ name: item.reason, value: item.count })),
    ...(otherCount > 0 ? [{ name: "Otros", value: otherCount }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Motivos de pérdida</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              No hay motivos de pérdida para este partner.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0 0% 100%)",
                        border: "1px solid hsl(220 13% 91%)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="max-h-[260px] space-y-2 overflow-auto pr-2 text-sm">
                {chartData.map((item, index) => (
                  <div key={item.name} className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.value} leads</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

