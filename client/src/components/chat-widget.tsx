import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@shared/schema";

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatWidget({ isOpen, onToggle }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [userName, setUserName] = useState("");
  const [hasSetName, setHasSetName] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !wsRef.current) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Join session
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'join_session',
          sessionId: sessionId
        }));
      }

      // Load existing messages
      loadMessages();
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.data]);
      }
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      wsRef.current = null;
      
      // Auto-reconnect after 3 seconds if chat is still open
      if (isOpen) {
        setTimeout(() => {
          if (isOpen && !wsRef.current) {
            connectWebSocket();
          }
        }, 3000);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !hasSetName) return;

    const messageData = {
      sessionId,
      message: newMessage,
      senderType: 'user' as const,
      senderName: userName
    };

    try {
      // Send via WebSocket for real-time delivery
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          ...messageData,
          content: newMessage
        }));
      } else {
        // Fallback to HTTP API
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData),
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSetName = () => {
    if (userName.trim()) {
      setHasSetName(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: Date | string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          size="lg"
          className="rounded-full shadow-lg h-14 w-14 bg-blue-600 hover:bg-blue-700"
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 h-[500px] shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">Want to Ask Human Farmulator</CardTitle>
              {isConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Connecting...
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col h-[420px]">
          {!hasSetName ? (
            <div className="p-4 space-y-4 flex-1 flex flex-col justify-center">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Welcome to Human Support!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please enter your name to start chatting with our formulation experts.
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Enter your name..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSetName()}
                  data-testid="input-user-name"
                />
                <Button 
                  onClick={handleSetName} 
                  disabled={!userName.trim()}
                  className="w-full"
                  data-testid="button-set-name"
                >
                  Start Chat
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            message.senderType === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                          data-testid={`message-${message.senderType}-${message.id}`}
                        >
                          <div className="flex items-center space-x-1 mb-1">
                            {message.senderType === 'admin' ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            <span className="text-xs font-medium">
                              {message.senderName || (message.senderType === 'admin' ? 'Support' : 'You')}
                            </span>
                            <span className={`text-xs opacity-75`}>
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!isConnected}
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    size="sm"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-xs text-red-500 mt-1">
                    Connection lost. Trying to reconnect...
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}