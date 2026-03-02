import { Progress } from "@/components/ui/progress";

interface SegmentedProgressProps {
  completed: number;
  total: number;
  className?: string;
}

const SegmentedProgress = ({ completed, total, className }: SegmentedProgressProps) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return <Progress value={pct} className={`h-2 flex-1 ${className || ""}`} />;
};

export default SegmentedProgress;
