import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DuplicatesChartProps {
  samePartner: number;
  crossPartner: number;
  sameLabel?: string;
  className?: string;
}

export function DuplicatesChart({ samePartner, crossPartner, sameLabel, className }: DuplicatesChartProps) {
  const sameName = sameLabel && sameLabel.trim().length > 0 ? sameLabel : 'Mismo Partner';
  const data = [
    { name: sameName, value: samePartner },
    { name: 'Otro Partner', value: crossPartner },
  ];

  const COLORS = ['hsl(152 60% 35%)', 'hsl(84 80% 45%)'];

  return (
    <motion.div
      className={cn('h-full', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="h-full shadow-soft flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Duplicados</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col">
          <div className="h-[300px] w-full flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 100%)',
                    border: '1px solid hsl(220 13% 91%)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: 'hsl(220 20% 15%)', fontSize: '14px' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{samePartner}</p>
              <p className="text-sm text-muted-foreground">Mismo Partner</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{crossPartner}</p>
              <p className="text-sm text-muted-foreground">Otro Partner</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
