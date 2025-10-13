"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Edit3, Check, X } from "lucide-react";

interface EditableTranscriptItemProps {
  item: {
    id: string;
    text?: string;
    message?: string;
    isAgent?: boolean;
    sender?: string;
    isChat?: boolean;
    timestamp: string;
  };
  onEdit: (id: string, newText: string) => void;
}

export function EditableTranscriptItem({ item, onEdit }: EditableTranscriptItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text || item.message || "");

  const handleSave = async () => {
    if (editText.trim() !== (item.text || item.message)) {
      await onEdit(item.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(item.text || item.message || "");
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const isAgentMessage = item.isAgent || item.sender === "agent";

  return (
    <div
      className={cn(
        "group relative flex w-full flex-col gap-2 rounded-lg px-3 py-2 text-sm",
        isAgentMessage
          ? "bg-neutral-100 text-[#09090B]"
          : "ml-auto border border-neutral-300 max-w-[85%]",
        item.isChat && "border-l-4 border-l-blue-500"
      )}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full min-h-[60px] p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              <Check className="h-3 w-3" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {item.text || item.message}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-gray-200 rounded transition-opacity"
              title={`Edit ${isAgentMessage ? 'agent' : 'user'} message`}
            >
              <Edit3 className="h-3 w-3" />
            </button>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>{item.isChat ? "Chat" : "Voice"}</span>
            <span>•</span>
            <span>{isAgentMessage ? "Agent" : "User"}</span>
            <span>•</span>
            <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
            {item.edited && (
              <span className="text-orange-500 text-xs">(edited)</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}