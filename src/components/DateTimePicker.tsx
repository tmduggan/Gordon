import React from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatSmartDate, exerciseTimePeriods, foodTimePeriods } from '../utils/timeUtils';

// Helper to get the meal period from the current time
const getCurrentMealPeriod = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "Early Morning";
    if (hour < 10) return "Breakfast";
    if (hour < 12) return "Brunch";
    if (hour < 16) return "Lunch";
    if (hour < 19) return "Supper";
    return "Dinner";
};

// Hook to manage state for the new time period picker
export function useDateTimePicker(type: 'food' | 'exercise') {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const timePeriods = type === 'food' ? foodTimePeriods : exerciseTimePeriods;
    
    // Set the initial time period based on the current time for 'food' type
    const initialTimePeriod = type === 'food' ? getCurrentMealPeriod() : Object.keys(timePeriods)[0];
    const [timePeriod, setTimePeriod] = React.useState(initialTimePeriod);

    // Generates a full Date object for logging
    const getLogTimestamp = () => {
        const logDate = date ? new Date(date) : new Date();
        const hour = timePeriods[timePeriod as keyof typeof timePeriods];
        logDate.setHours(hour, 0, 0, 0); // Set hour, reset minutes/seconds
        return logDate;
    };

    return { date, setDate, timePeriod, setTimePeriod, getLogTimestamp, timePeriods };
}

// Props interface for the new component
interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    timePeriod: string;
    setTimePeriod: (period: string) => void;
    timePeriods: Record<string, number>;
}

// The new DateTimePicker component
export default function DateTimePicker({ date, setDate, timePeriod, setTimePeriod, timePeriods }: DateTimePickerProps) {
    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-[180px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? formatSmartDate(date) : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time of day" />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(timePeriods).map(period => (
                        <SelectItem key={period} value={period}>{period}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
} 