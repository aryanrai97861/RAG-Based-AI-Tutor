import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BookOpen, Upload, Send, X, ImageIcon } from "lucide-react";
import type { Message, UploadResponse, ChatResponse } from "@shared/schema";

export default function Home() {
  const [topicId, setTopicId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("pdf", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload PDF");
      }
      return response.json() as Promise<UploadResponse>;
    },
    onSuccess: (data) => {
      setTopicId(data.topicId);
      setFilename(data.filename);
      toast({
        title: "PDF Uploaded Successfully",
        description: `${data.chunkCount} text chunks extracted and embedded.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest<ChatResponse>("POST", "/api/chat", {
        topicId,
        message,
      });
    },
    onSuccess: (data) => {
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    },
    onError: (error) => {
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !topicId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleRemovePDF = () => {
    setTopicId(null);
    setFilename("");
    setMessages([]);
    toast({
      title: "PDF Removed",
      description: "You can upload a new PDF now",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!topicId) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="h-16 border-b flex items-center px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" data-testid="icon-logo" />
            <h1 className="text-xl font-semibold" data-testid="text-app-title">AI Tutor</h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-accent" : "border-border"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-testid="dropzone-upload"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" data-testid="icon-upload" />
              <h2 className="text-lg font-medium mb-2" data-testid="text-upload-title">Upload Chapter PDF</h2>
              <p className="text-sm text-muted-foreground mb-4" data-testid="text-upload-description">
                Drag and drop or click to browse
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                data-testid="button-browse"
              >
                {uploadMutation.isPending ? "Processing..." : "Browse Files"}
              </Button>
              <p className="text-xs text-muted-foreground mt-4" data-testid="text-file-type">PDF files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                data-testid="input-file"
              />
            </div>

            {uploadMutation.isPending && (
              <div className="mt-6 text-center" data-testid="status-processing">
                <div className="flex justify-center gap-1 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }}></div>
                </div>
                <p className="text-sm text-muted-foreground">Extracting text and generating embeddings...</p>
              </div>
            )}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" data-testid="icon-logo" />
          <h1 className="text-xl font-semibold" data-testid="text-app-title">AI Tutor</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground truncate max-w-xs" data-testid="text-current-pdf">
            {filename}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemovePDF}
            data-testid="button-remove-pdf"
          >
            <X className="w-4 h-4 mr-1" />
            Remove PDF
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12" data-testid="empty-state">
              <p className="text-muted-foreground">Ask me anything about the chapter...</p>
            </div>
          )}

          {messages.filter(m => m && m.role).map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${message.role}-${message.id}`}
            >
              <div
                className={`max-w-3xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl px-4 py-3"
                    : ""
                }`}
              >
                {message.role === "user" ? (
                  <p className="text-base" data-testid={`text-message-${message.id}`}>{message.content}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none leading-relaxed" data-testid={`text-message-${message.id}`}>
                      <p className="text-base whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.image && (
                      <div className="mt-4" data-testid={`image-container-${message.id}`}>
                        <img
                          src={`/api/images/${message.image.filename}`}
                          alt={message.image.title}
                          className="rounded-lg border border-border max-w-md"
                          data-testid={`image-${message.image.id}`}
                        />
                        <p className="text-xs text-muted-foreground mt-2" data-testid={`image-caption-${message.image.id}`}>
                          {message.image.title}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs mt-1 opacity-70" data-testid={`timestamp-${message.id}`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex justify-start" data-testid="status-thinking">
              <div className="bg-accent rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the chapter..."
            className="flex-1"
            disabled={chatMutation.isPending}
            data-testid="input-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatMutation.isPending}
            size="icon"
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
