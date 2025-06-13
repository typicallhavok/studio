'use client';

import type { ChainEvent } from '@/types/evidence';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, Line, Legend } from 'recharts';
import { format } from 'date-fns';

interface ChainTimelineChartProps {
  events: ChainEvent[];
  evidenceId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground p-3 rounded-md shadow-lg border border-border">
        <p className="font-semibold">{data.action}</p>
        <p className="text-sm">Time: {format(new Date(data.timestamp), 'Pp')}</p>
        <p className="text-sm">Actor: {data.actor}</p>
        <p className="text-sm">Details: {data.details}</p>
      </div>
    );
  }
  return null;
};

export default function ChainTimelineChart({ events, evidenceId }: ChainTimelineChartProps) {
  const chartData = events.map((event, index) => ({
    ...event,
    // Use index for Y-axis to spread events out visually if timestamps are too close or for qualitative representation
    // Alternatively, could use a small constant value if only plotting presence of event at a timestamp
    eventPoint: index + 1, 
  }));

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chain of Custody for {evidenceId}</CardTitle>
          <CardDescription>Timeline of events.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No events to display for this evidence item.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Chain of Custody for {evidenceId}</CardTitle>
        <CardDescription>Interactive timeline of events. Hover over points for details.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(unixTime) => format(new Date(unixTime), 'MM/dd HH:mm')}
              stroke="hsl(var(--muted-foreground))"
              className="text-xs"
            />
            <YAxis 
              dataKey="eventPoint" 
              hide={true} // Hide Y-axis as it's mainly for visual separation
              domain={[0, 'dataMax + 1']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1 }} />
            <Legend formatter={(value) => <span className="text-foreground">{value}</span>} />
            <Line
              type="monotone"
              dataKey="eventPoint"
              name="Event Occurence"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 5, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 7, stroke: 'hsl(var(--accent))', fill: 'hsl(var(--accent))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
