"use client";

import { useState } from "react";
import { InstructionsEditor } from "@/components/instructions-editor";
import { usePlaygroundState } from "@/hooks/use-playground-state";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CircleHelp, ChevronDown, ChevronUp } from "lucide-react";

export function Instructions() {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const { pgState } = usePlaygroundState();

  return (
    <div
      className={`flex flex-col w-full gap-3 border rounded-xl bg-white shadow-md transition-all duration-300 ${
        isFocused ? "ring-2 ring-blue-400" : "ring-0"
      } ${isCollapsed ? 'p-3' : 'p-6'} overflow-auto`}
      style={{ 
        width: '100%', 
        minWidth: isCollapsed ? '200px' : '330px', 
        maxWidth: isCollapsed ? '300px' : '500px'
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <div className="text-xs font-semibold uppercase mr-1 tracking-widest">
            INSTRUCTIONS
          </div>
          <HoverCard open={isOpen}>
            <HoverCardTrigger asChild>
              <CircleHelp
                className="h-4 w-4 text-gray-500 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
              />
            </HoverCardTrigger>
            <HoverCardContent
              className="w-[260px] text-sm"
              side="bottom"
              onInteractOutside={() => setIsOpen(false)}
            >
              Instructions are a system message that is prepended to the
              conversation whenever the model responds. Updates will be
              reflected on the next conversation turn.
            </HoverCardContent>
          </HoverCard>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label={isCollapsed ? "Expand instructions" : "Collapse instructions"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </div>
      {!isCollapsed && (
        <InstructionsEditor
          instructions={pgState.instructions}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      )}
    </div>
  );
}
