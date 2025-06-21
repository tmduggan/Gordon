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
  ...rest
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Review items before logging.</CardDescription>
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
      <CardFooter className="flex justify-between items-center">
        <div>{footerControls}</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearCart}>Clear</Button>
          <Button onClick={logCart}>Log Items</Button>
        </div>
      </CardFooter>
    </Card>
  );
} 