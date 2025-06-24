import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, X } from 'lucide-react';
import { getAvailableEquipmentOptions } from '../services/suggestionService';

export default function EquipmentSelector({ 
  availableEquipment = [], 
  onEquipmentChange, 
  exerciseLibrary = [],
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(availableEquipment);
  
  const equipmentOptions = getAvailableEquipmentOptions(exerciseLibrary);
  
  const handleEquipmentToggle = (equipment) => {
    const newSelection = selectedEquipment.includes(equipment)
      ? selectedEquipment.filter(e => e !== equipment)
      : [...selectedEquipment, equipment];
    
    setSelectedEquipment(newSelection);
    onEquipmentChange(newSelection);
  };
  
  const handleClearAll = () => {
    setSelectedEquipment([]);
    onEquipmentChange([]);
  };
  
  const handleSelectAll = () => {
    setSelectedEquipment(equipmentOptions);
    onEquipmentChange(equipmentOptions);
  };
  
  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Available Equipment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Selected Equipment Display */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Selected Equipment:</span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  className="h-6 px-2 text-xs"
                >
                  All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearAll}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            {selectedEquipment.length === 0 ? (
              <div className="text-sm text-gray-500 italic">
                No equipment selected - all exercises will be shown
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedEquipment.map(equipment => (
                  <Badge 
                    key={equipment} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {equipment}
                    <button
                      onClick={() => handleEquipmentToggle(equipment)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Equipment Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Select Equipment:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(!isOpen)}
                className="h-6 px-2 text-xs"
              >
                {isOpen ? 'Hide' : 'Show'} Options
              </Button>
            </div>
            
            {isOpen && (
              <ScrollArea className="h-48 border rounded-md p-3">
                <div className="space-y-2">
                  {equipmentOptions.map(equipment => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment}
                        checked={selectedEquipment.includes(equipment)}
                        onCheckedChange={() => handleEquipmentToggle(equipment)}
                      />
                      <label 
                        htmlFor={equipment} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {equipment}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            {selectedEquipment.length > 0 
              ? `Showing exercises for ${selectedEquipment.length} equipment type(s)`
              : 'Showing all exercises (no equipment filter)'
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 