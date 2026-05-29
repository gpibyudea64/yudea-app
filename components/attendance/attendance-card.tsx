import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function AttendanceCard({
  cardTitle,
  titleIcon,
  contentNumber,
  contentText,
  backgroundClass = "bg-linear-to-br from-emerald-500 to-emerald-600",
}: {
  cardTitle: string;
  titleIcon: ReactNode;
  contentNumber: number;
  contentText: string;
  backgroundClass?: string;
}) {
  return (
    <Card className={`${backgroundClass} text-white shadow-lg`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {cardTitle}
          {titleIcon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{contentNumber}</div>
        <p className="text-xs opacity-80 mt-1">{contentText}</p>
      </CardContent>
    </Card>
  );
}
