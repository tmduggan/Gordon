import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CartRow from './CartRow';
import CartHead from './CartHead';

export default function CartContainer({
  title,
  type,
  items,
  footerControls,
  logCart,
  clearCart,
  icon,
  ...rest
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        {icon ? (
          <div className="flex items-center justify-between">
            <span className="text-4xl">{icon}</span>
          </div>
        ) : (
          <>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Review items before logging.</CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <CartHead type={type} />
          <tbody className="divide-y">
            {items.map((item, index) => (
              <CartRow
                key={item.id || `${item.label}-${item.units}-${index}`}
                item={item}
                type={type}
                {...rest}
              />
            ))}
          </tbody>
        </table>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>{footerControls}</div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button variant="outline" onClick={clearCart} className="w-1/2 sm:w-auto">Clear</Button>
          <Button onClick={logCart} className="w-1/2 sm:w-auto">Log Items</Button>
        </div>
      </CardFooter>
    </Card>
  );
} 