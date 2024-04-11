"use client";
import React, { useState, useEffect, useRef } from "react";
import { getPromptResponse } from "../../api/getPromptResponse";
import { ChatResponse, ChatPrompt, TextArea } from "../components/chat";

const agentTypes = {
  user: "User",
  richieRich: "RichieRich",
};

export default function Home() {
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const ws = useRef(null);

  const handleTextAreaChange = (event) => {
    setPrompt(event.target.value);
  };

  const addMessage = (message, agent) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage && lastMessage.agent === agent) {
        return [
          ...prevMessages.slice(0, -1),
          {
            agent,
            contents: lastMessage.contents + " " + message.trim(),
          },
        ];
      } else {
        return [
          ...prevMessages,
          {
            agent,
            contents: message.trim(),
          },
        ];
      }
    });
  };

  const handleSubmit = async () => {
    if (!prompt) {
      setError("Please enter a prompt.");
      return;
    }
    setError(null);
    setIsLoadingResponse(true);
    addMessage(prompt, agentTypes.user);

    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(prompt);
    } else {
      ws.current.onopen = () => {
        console.log("WebSocket connection established.");
        ws.current.send(prompt);
      };
    }

    setPrompt("");
  };

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8082/v1/stream");
    ws.current.onopen = () => console.log("WebSocket connection established.");
    ws.current.onmessage = (event) => {
      const response = event.data;

      addMessage(response, agentTypes.richieRich);

      setIsLoadingResponse(false);
    };
    ws.current.onclose = () => console.log("WebSocket connection closed.");
    ws.current.onerror = (error) => console.error("WebSocket error:", error);

    return () => {
      ws.current.close();
    };
  }, []);

  useEffect(() => {
    scrollContainerRef.current.scrollTop =
      scrollContainerRef.current.scrollHeight;
  }, [messages]);

  return (
    <main className="flex flex-col items-center w-full bg-gray-100 h-[93vh]">
      <div
        ref={scrollContainerRef}
        className="flex flex-col overflow-y-scroll p-20 w-full mb-40"
      >
        {messages.map((message, index) =>
          message.agent === agentTypes.user ? (
            <ChatPrompt key={index} prompt={message.contents} />
          ) : (
            <ChatResponse key={index} response={message.contents} />
          )
        )}
      </div>
      <TextArea
        onChange={handleTextAreaChange}
        onSubmit={handleSubmit}
        isLoading={isLoadingResponse}
        hasError={error !== null}
      />
      {error && (
        <div className="absolute bottom-0 mb-2 text-red-500">{error}</div>
      )}
    </main>
  );
}
