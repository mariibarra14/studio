"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import { LogIn, User, CreditCard, ShoppingCart, LogOut, Pencil } from "lucide-react";

const activities = [
  {
    id: 1,
    action: "Logged in",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    icon: <LogIn className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: 2,
    action: "Updated profile information",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    icon: <Pencil className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: 3,
    action: "Added a new payment method",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: 4,
    action: "Purchased ticket for 'React Conf 2024'",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    icon: <ShoppingCart className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: 5,
    action: "Logged out",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 - 1000 * 60 * 15), // 3 days and 15 mins ago
    icon: <LogOut className="h-5 w-5 text-muted-foreground" />,
  },
];


export function ActivityHistory() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell className="font-medium flex items-center gap-3">
                {activity.icon}
                <span>{activity.action}</span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
