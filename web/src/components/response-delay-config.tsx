"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Clock, Zap } from "lucide-react";

export function ResponseDelayConfig() {
  const [delayEnabled, setDelayEnabled] = useState(true);
  const [delayAmount, setDelayAmount] = useState([1.2]);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedDelay = localStorage.getItem("response_delay_enabled");
    const savedAmount = localStorage.getItem("response_delay_amount");
    
    if (savedDelay !== null) {
      setDelayEnabled(JSON.parse(savedDelay));
    }
    if (savedAmount !== null) {
      setDelayAmount([parseFloat(savedAmount)]);
    }
  }, []);

  const handleDelayToggle = (enabled: boolean) => {
    setDelayEnabled(enabled);
    localStorage.setItem("response_delay_enabled", JSON.stringify(enabled));
  };

  const handleDelayChange = (value: number[]) => {
    setDelayAmount(value);
    localStorage.setItem("response_delay_amount", value[0].toString());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Response Delay Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Response Delay</Label>
            <div className="text-sm text-muted-foreground">
              Menambah jeda sebelum AI merespons untuk akurasi yang lebih baik
            </div>
          </div>
          <Switch
            checked={delayEnabled}
            onCheckedChange={handleDelayToggle}
          />
        </div>

        {delayEnabled && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Delay Amount: {delayAmount[0]}s</Label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                {delayAmount[0] < 1 ? "Fast" : delayAmount[0] < 2 ? "Balanced" : "Careful"}
              </div>
            </div>
            <Slider
              value={delayAmount}
              onValueChange={handleDelayChange}
              max={3}
              min={0.5}
              step={0.1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Delay yang lebih lama memberikan waktu lebih untuk AI memproses dan memberikan respons yang lebih akurat
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}