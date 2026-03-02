import { Progress } from "@/components/ui/progress";

interface SegmentedProgressProps {
  completed: number;
  total: number;
}

const SegmentedProgress = ({ completed, total }: SegmentedProgressProps) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return <Progress value={pct} className="h-2 flex-1" />;
};

export default SegmentedProgress;
