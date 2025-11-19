
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
import { es } from 'date-fns/locale';
import { LogIn, User, CreditCard, ShoppingCart, LogOut, Pencil } from "lucide-react";

const activities = [
  {
    id: 1,
    action: "Inició sesión",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    icon: <LogIn className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: 2,
    action: "Actualizó la información del perfil",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    icon: <Pencil className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: 3,
    action: "Añadió un nuevo método de pago",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: 4,
    action: "Compró entrada para 'React Conf 2024'",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    icon: <ShoppingCart className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: 5,
    action: "Cerró sesión",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 - 1000 * 60 * 15),
    icon: <LogOut className="h-5 w-5 text-muted-foreground" />,
  },
];


export function ActivityHistory() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Actividad</TableHead>
            <TableHead className="text-right">Fecha</TableHead>
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
                {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: es })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
