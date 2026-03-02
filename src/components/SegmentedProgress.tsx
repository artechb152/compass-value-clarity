interface SegmentedProgressProps {
  completed: number;
  total: number;
}

const SegmentedProgress = ({ completed, total }: SegmentedProgressProps) => {
  return (
    <div className="flex gap-1 flex-1" dir="ltr">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors ${
            i < completed ? "bg-success" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
};

export default SegmentedProgress;
