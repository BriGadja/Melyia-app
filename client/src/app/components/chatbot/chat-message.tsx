import { ChatMessage as ChatMessageType } from "../../../shared/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      } mb-4`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.role === "user"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        <p className="text-sm">{message.content}</p>
        {message.sources && (
          <div className="mt-2 text-xs opacity-75">
            Sources: {message.sources.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
