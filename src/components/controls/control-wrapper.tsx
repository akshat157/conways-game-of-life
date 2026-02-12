import { Card } from "../ui/card";

export default function ControlWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className="card mt-4 shadow-lg">
      <div className="flex flex-row items-center gap-4">{children}</div>
    </Card>
  );
}
