import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, X, RotateCcw } from "lucide-react";
import api from "@/api/api"; // ✅ centralized axios instance

export default function AppointmentChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => `conv_${Date.now()}`);
  const messagesEndRef = useRef(null);

  const predefinedQuestions = [
    "What are your office hours?",
    "How do I schedule an appointment?",
    "Do you have available slots for baptism?",
    "What upcoming parish events do you have?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi there! 👋 I'm your parish assistant from Our Lady of Peace and Good Voyage Parish. You can ask about office hours, available slots, events, or services.",
        },
      ]);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/chat", {
        message: messageText,
        conversationId,
      });

      const reply =
        typeof data.message === "string"
          ? data.message
          : JSON.stringify(data.message, null, 2);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I’m having trouble connecting to the parish system right now. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.post("/chat/reset", { conversationId });
      setMessages([
        {
          role: "assistant",
          content:
            "Conversation cleared ✅. How can I help you today? You can ask about appointments, parish hours, or events.",
        },
      ]);
    } catch (error) {
      console.error("Error resetting conversation:", error);
    }
  };

  const handlePredefinedQuestion = async (question) => {
    await sendMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="
            bg-white rounded-lg shadow-2xl flex flex-col 
            w-[380px] h-[600px]
            sm:w-[400px]
            md:w-[420px]
            max-w-[90vw] max-h-[80vh]
            fixed bottom-20 right-4 sm:bottom-6 sm:right-6
            animate-fadeIn
          "
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare size={22} />
              <h3 className="font-semibold text-sm sm:text-base">
                Parish Assistant
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="hover:bg-blue-700 p-1 rounded transition-colors"
                title="Reset conversation"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-700 p-1 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-2 sm:p-3 rounded-lg text-sm sm:text-base ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 shadow rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow p-3 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-600 mb-2 font-medium">
                Quick questions:
              </p>
              <div className="flex flex-col gap-2">
                {predefinedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePredefinedQuestion(question)}
                    className="text-left text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
