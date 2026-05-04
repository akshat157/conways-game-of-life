import { Card } from "../ui/card";

export default function ControlWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className="card mt-4 shadow-lg">
      <div className="flex items-center gap-4">{children}</div>
    </Card>
  );
}
