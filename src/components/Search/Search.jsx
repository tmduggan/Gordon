import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import MacroDisplay from '../nutrition/MacroDisplay';

const FoodResult = ({ item, onSelect, userProfile, togglePin, getFoodMacros }) => {
    const foodName = item.food_name || item.label;
    const isPinned = userProfile?.pinnedFoods?.includes(item.id);
    return (
        <div
            onClick={() => onSelect(item)}
            className="flex justify-between items-center p-2 hover:bg-accent cursor-pointer"
        >
            <MacroDisplay macros={getFoodMacros(item)} format="inline-text" truncateLength={40}>
                {foodName}
            </MacroDisplay>
            {item.id && (
                <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}
                    title={isPinned ? "Unpin food" : "Pin food"}
                >
                    {isPinned ? '📌' : '📍'}
                </Button>
            )}
        </div>
    );
};

const ExerciseResult = ({ item, onSelect, userProfile, togglePin }) => {
    const isPinned = userProfile?.pinnedExercises?.includes(item.id);
    return (
        <div
            onClick={() => onSelect(item)}
            className="flex justify-between items-center p-2 hover:bg-accent cursor-pointer"
        >
            <span>{item.name}</span>
            {item.id && (
                <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}
                    title={isPinned ? "Unpin exercise" : "Pin exercise"}
                >
                    {isPinned ? '📌' : '📍'}
                </Button>
            )}
        </div>
    );
};

export default function Search({
    type,
    searchQuery,
    setSearchQuery,
    searchResults = [],
    handleApiSearch,
    handleSelect,
    isLoading,
    userProfile,
    togglePin,
    getFoodMacros,
    placeholder,
}) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(searchQuery.length > 0 && searchResults.length > 0);
    }, [searchResults, searchQuery]);

    const ResultComponent = type === 'food' ? FoodResult : ExerciseResult;

    return (
        <div className="relative">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverAnchor asChild>
                    <div className="flex gap-2">
                        <Input
                            placeholder={placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                            autoComplete="off"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isLoading && searchQuery && type === 'food') {
                                    handleApiSearch();
                                }
                            }}
                        />
                        {type === 'food' && (
                            <Button disabled={isLoading || !searchQuery} onClick={handleApiSearch} type="button">
                                {isLoading ? 'Searching...' : 'Search'}
                            </Button>
                        )}
                    </div>
                </PopoverAnchor>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div>
                        {isLoading && <div className="p-4 text-sm text-center">Searching...</div>}
                        {!isLoading && searchResults.length === 0 && searchQuery && (
                            <div className="p-4 text-sm text-center">No results found.</div>
                        )}
                        {searchResults.map((item) => (
                            <ResultComponent
                                key={item.id || item.food_name}
                                item={item}
                                onSelect={(selectedItem) => {
                                    handleSelect(selectedItem);
                                    setIsOpen(false);
                                }}
                                userProfile={userProfile}
                                togglePin={togglePin}
                                getFoodMacros={getFoodMacros} // Only used by FoodResult
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
} 