import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MobileTooltip, useIsMobile } from '@/components/ui/mobileTooltip';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Smartphone, MousePointer, Touch } from 'lucide-react';

export default function MobileTooltipDemo() {
  const isMobile = useIsMobile();

  const demoContent = (
    <div className="p-3">
      <h4 className="font-semibold mb-2">Nutrition Information</h4>
      <div className="text-sm space-y-1">
        <div>Calories: 250</div>
        <div>Protein: 20g</div>
        <div>Carbs: 30g</div>
        <div>Fat: 10g</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Mobile Tooltip Demo</h1>
        <p className="text-gray-600">
          Testing different approaches for tooltips on mobile devices
        </p>
        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
          {isMobile ? (
            <>
              <Smartphone className="h-4 w-4" />
              <span>Mobile Device Detected</span>
            </>
          ) : (
            <>
              <MousePointer className="h-4 w-4" />
              <span>Desktop Device Detected</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Approach 1: Touch-and-Hold */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Touch className="h-5 w-5" />
              Touch-and-Hold
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Hold your finger on the item for 500ms to see the tooltip. Works on both mobile and desktop.
            </p>
            <MobileTooltip
              content={demoContent}
              delayDuration={500}
              showInfoButton={false}
            >
              <Button variant="outline" className="w-full">
                Hold me for tooltip
              </Button>
            </MobileTooltip>
          </CardContent>
        </Card>

        {/* Approach 2: Info Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Info Button
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Click the info button to see detailed information. Always works reliably.
            </p>
            <MobileTooltip
              content={demoContent}
              showInfoButton={true}
              infoButtonPosition="top-right"
            >
              <Button variant="outline" className="w-full">
                Click info button
              </Button>
            </MobileTooltip>
          </CardContent>
        </Card>

        {/* Approach 3: Hybrid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Hybrid Approach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Both touch-and-hold AND info button. Best of both worlds!
            </p>
            <MobileTooltip
              content={demoContent}
              delayDuration={300}
              showInfoButton={true}
              infoButtonPosition="bottom-right"
            >
              <Button variant="outline" className="w-full">
                Try both methods
              </Button>
            </MobileTooltip>
          </CardContent>
        </Card>

        {/* Approach 4: Traditional Hover */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Traditional Hover
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Standard hover tooltip. Works great on desktop, limited on mobile.
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Hover over me
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {demoContent}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Approach 5: Conditional Rendering */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Conditional Rendering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Shows different interactions based on device type.
            </p>
            {isMobile ? (
              <MobileTooltip
                content={demoContent}
                showInfoButton={true}
              >
                <Button variant="outline" className="w-full">
                  Mobile: Info button
                </Button>
              </MobileTooltip>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Desktop: Hover
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {demoContent}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>

        {/* Approach 6: Custom Delay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Touch className="h-5 w-5" />
              Custom Delay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Faster response time (200ms) for quick previews.
            </p>
            <MobileTooltip
              content={demoContent}
              delayDuration={200}
              showInfoButton={true}
            >
              <Button variant="outline" className="w-full">
                Quick preview
              </Button>
            </MobileTooltip>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">For Quick Previews</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Use touch-and-hold with short delay (200-300ms)</li>
                <li>• Good for nutrition facts, brief descriptions</li>
                <li>• Don't require info button</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Detailed Information</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Always include info button</li>
                <li>• Good for full nutrition labels, complex data</li>
                <li>• Works reliably on all devices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Best UX</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Use hybrid approach (both methods)</li>
                <li>• Provide visual feedback for touch-and-hold</li>
                <li>• Test on actual mobile devices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Performance Tips</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Keep tooltip content lightweight</li>
                <li>• Use appropriate delay durations</li>
                <li>• Consider lazy loading for complex content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 