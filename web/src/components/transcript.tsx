import { cn } from "@/lib/utils";
import { useAgent } from "@/hooks/use-agent";
import { useEffect, useRef, RefObject, useState } from "react";
import { MessageCircle, Mic } from "lucide-react";
import { EditableTranscriptItem } from "@/components/editable-transcript";

export function Transcript({
  scrollContainerRef,
  scrollButtonRef,
}: {
  scrollContainerRef: RefObject<HTMLElement>;
  scrollButtonRef: RefObject<HTMLButtonElement>;
}) {
  const { displayTranscriptions } = useAgent();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  
  const handleEditTranscript = async (itemId: string, newText: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8002/edit-transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          item_id: itemId,
          new_text: newText,
        }),
      });
      
      if (response.ok) {
        // Refresh transcript data
        window.location.reload();
      } else {
        alert("Failed to save edit");
      }
    } catch (error) {
      console.error("Error editing transcript:", error);
      alert("Error saving edit");
    }
  };
  const calculateDistanceFromBottom = (container: HTMLElement) => {
    const { scrollHeight, scrollTop, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight;
  };

  const handleScrollVisibility = (
    container: HTMLElement,
    scrollButton: HTMLButtonElement,
  ) => {
    const distanceFromBottom = calculateDistanceFromBottom(container);
    const shouldShowButton = distanceFromBottom > 100;
    setShowScrollButton(shouldShowButton);
    scrollButton.style.display = shouldShowButton ? "flex" : "none";
  };

  // Get session ID from room metadata
  useEffect(() => {
    if (!sessionId) {
      setSessionId(crypto.randomUUID());
    }
  }, [sessionId]);

  // Poll for chat messages
  useEffect(() => {
    if (!sessionId) return;

    const pollChatMessages = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8002/call-logs/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const messages = data.messages
            .filter((msg: any) => msg.type.startsWith("chat_"))
            .map((msg: any) => ({
              id: `${msg.timestamp}-${msg.type}`,
              sender: msg.type.replace("chat_", ""),
              message: msg.message,
              timestamp: msg.timestamp,
              isChat: true
            }));
          setChatMessages(messages);
        }
      } catch (error) {
        console.error("Error polling chat messages:", error);
      }
    };

    const interval = setInterval(pollChatMessages, 2000);
    pollChatMessages();
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const scrollButton = scrollButtonRef.current;
    if (container && scrollButton) {
      const handleScroll = () =>
        handleScrollVisibility(container, scrollButton);

      handleScroll(); // Check initial state
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [
    scrollContainerRef,
    scrollButtonRef,
    displayTranscriptions,
    chatMessages,
    handleScrollVisibility,
  ]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const distanceFromBottom = calculateDistanceFromBottom(container);
      const isNearBottom = distanceFromBottom < 100;

      if (isNearBottom) {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [displayTranscriptions, chatMessages, scrollContainerRef, transcriptEndRef]);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const scrollButton = scrollButtonRef.current;
    if (scrollButton) {
      scrollButton.addEventListener("click", scrollToBottom);
      return () => scrollButton.removeEventListener("click", scrollToBottom);
    }
  }, [scrollButtonRef]);

  return (
    <>
      <div className="flex items-center text-xs font-semibold uppercase tracking-widest sticky top-0 left-0 bg-white w-full p-4">
        Transcript
      </div>
      <div className="p-4 min-h-[300px] relative">
        {displayTranscriptions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-300 text-sm">
            Get talking to start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {/* Combine and sort voice transcriptions and chat messages */}
            {[
              ...displayTranscriptions.map(({ segment, participant }) => ({
                id: segment.id,
                text: segment.text.trim(),
                isAgent: participant?.isAgent,
                timestamp: segment.startTime || 0,
                isChat: false
              })),
              ...chatMessages
            ]
              .filter(item => item.text || item.message)
              .sort((a, b) => {
                const timeA = a.timestamp || 0;
                const timeB = b.timestamp || 0;
                return timeA - timeB;
              })
              .map((item) => (
                <EditableTranscriptItem
                  key={item.id}
                  item={item}
                  onEdit={handleEditTranscript}
                />
              ))
            }
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>
    </>
  );
}
