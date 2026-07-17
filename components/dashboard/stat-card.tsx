import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { memo, type ReactNode } from "react";

interface StatCardProps {
  title: string;
  icon?: ReactNode;
  description: string;
  quantity: number;
}

export const StatCard = memo(function StatCard({
  title,
  icon,
  description,
  quantity,
}: StatCardProps) {
  return (
    <Card className="rounded-xl shadow-md hover:shadow-xl transition-all bg-linear-to-br from-blue-50 to-white sm:rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-3 py-2 sm:px-6 sm:py-4">
        <CardTitle className="text-sm font-medium text-gray-600 sm:text-lg">
          {title}
        </CardTitle>

        <div className="p-1.5 rounded-lg bg-gray-100 sm:p-2">
          {icon ? icon : <Users className="h-3.5 w-3.5 text-blue-600 sm:h-5 sm:w-5" />}
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-4">
        <div className="text-xl font-bold text-gray-900 sm:text-3xl">{quantity}</div>
        <p className="text-[10px] text-muted-foreground mt-0.5 sm:text-xs sm:mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
});
