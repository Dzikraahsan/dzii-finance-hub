import { Insight } from '@/lib/financeEngine';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  insights: Insight[];
}

const iconMap: Record<string, typeof Sparkles> = {
  info: Sparkles,
  warning: AlertTriangle,
  success: CheckCircle,
  trend: TrendingUp,
};

const colorMap: Record<string, string> = {
  info: 'text-[hsl(var(--accent-text))] bg-accent/15 border-accent/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  success: 'text-[hsl(var(--success))] bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20',
  trend: 'text-[hsl(var(--accent-text))] bg-accent/15 border-accent/20',
};

const iconColorMap: Record<string, string> = {
  info: 'bg-accent/15',
  warning: 'bg-warning/15',
  success: 'bg-[hsl(var(--success))]/15',
  trend: 'bg-accent/15',
};

export default function InsightCards({ insights }: Props) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" />
        Smart Insights
      </p>
      {insights.map((insight, i) => {
        const LucideIcon = iconMap[insight.type] || Sparkles;
        return (
          <div
            key={insight.id}
            className={`rounded-xl border p-3 flex gap-3 items-start animate-card-enter ${colorMap[insight.type]} stagger-${Math.min(i + 1, 5)}`}
          >
            <div className={`w-8 h-8 rounded-lg ${iconColorMap[insight.type]} flex items-center justify-center shrink-0`}>
              <span className="text-sm">{insight.icon}</span>
            </div>
            <p className="text-xs text-card-foreground/80 leading-relaxed flex-1">{insight.message}</p>
          </div>
        );
      })}
    </div>
  );
}
