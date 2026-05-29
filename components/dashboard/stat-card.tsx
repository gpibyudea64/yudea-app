import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  icon?: ReactNode;
  description: string;
  quantity: number;
}

export function StatCard({
  title,
  icon,
  description,
  quantity,
}: StatCardProps) {
  return (
    <Card className="rounded-2xl shadow-md hover:shadow-xl transition-all bg-linear-to-br from-blue-50 to-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-gray-600">
          {title}
        </CardTitle>

        <div className="p-2 rounded-lg bg-gray-100">
          {icon ? icon : <Users className="h-5 w-5 text-blue-600" />}
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold text-gray-900">{quantity}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
