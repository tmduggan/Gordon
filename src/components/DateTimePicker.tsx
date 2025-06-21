import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// This hook is now co-located with the component that uses it.
export function useDateTimePicker() {
    const [cartDate, setCartDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [cartHour12, setCartHour12] = useState(() => {
        const currentHour = new Date().getHours();
        const hourIn12 = currentHour % 12 || 12; // convert 0 to 12
        return hourIn12.toString();
    });
    const [cartMinute, setCartMinute] = useState(() => new Date().getMinutes().toString().padStart(2, '0'));
    const [cartAmPm, setCartAmPm] = useState(() => new Date().getHours() >= 12 ? 'PM' : 'AM');

    const getCartData = () => ({
        cartDate,
        cartHour12,
        cartMinute,
        cartAmPm,
    });

    return {
        cartDate,
        setCartDate,
        cartHour12,
        setCartHour12,
        cartMinute,
        setCartMinute,
        cartAmPm,
        setCartAmPm,
        getCartData
    };
}

interface DateTimePickerProps {
    date: string;
    setDate: (date: string) => void;
    hour: string;
    setHour: (hour: string) => void;
    minute: string;
    setMinute: (minute: string) => void;
    ampm?: 'AM' | 'PM';
    setAmpm?: (ampm: 'AM' | 'PM') => void;
}

export default function DateTimePicker({
    date,
    setDate,
    hour,
    setHour,
    minute,
    setMinute,
    ampm,
    setAmpm,
}: DateTimePickerProps) {
    // For food page that uses 12-hour format with AM/PM
    if (ampm !== undefined && setAmpm) {
        return (
            <div className="flex items-center gap-2">
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded-md" />
                <div className="flex items-center gap-1">
                    <Input type="number" value={hour} onChange={e => setHour(e.target.value)} className="w-14 p-2 border rounded-md" min="1" max="12" />
                    <span>:</span>
                    <Input type="number" value={minute} onChange={e => setMinute(e.target.value)} className="w-14 p-2 border rounded-md" min="0" max="59" />
                    <Select value={ampm} onValueChange={setAmpm}>
                        <SelectTrigger className="w-[80px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    // For exercise page that uses 24-hour format
    return (
        <div className="flex flex-col sm:flex-row gap-2 w-full justify-between">
            <div>
                <label className="text-sm mr-2">Date:</label>
                <Input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
            </div>
            <div>
                <label className="text-sm mr-2">Time:</label>
                <Input
                    type="time"
                    className="border rounded px-2 py-1"
                    value={`${hour}:${minute}`}
                    onChange={e => {
                        const [h, m] = e.target.value.split(':');
                        setHour(h);
                        setMinute(m);
                    }}
                />
            </div>
        </div>
    );
} 