import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatAPI } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  MessageCircle, 
  Trash2, 
  Edit3,
  Sparkles,
  BookOpen,
  Lightbulb,
  Copy,
  Check,
  RotateCw
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import LoadingSpinner from './LoadingSpinner';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  _id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export default function EduxBot() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Fetch chat sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery(
    'chat-sessions',
    chatAPI.getSessions
  );

  // Fetch current session
  const { data: currentSession, isLoading: sessionLoading } = useQuery(
    ['chat-session', currentSessionId],
    () => chatAPI.getSession(currentSessionId!),
    { enabled: !!currentSessionId }
  );

  // Create new session mutation
  const createSessionMutation = useMutation(chatAPI.createSession, {
    onSuccess: (data: any) => {
      setCurrentSessionId(data._id);
      queryClient.invalidateQueries('chat-sessions');
    }
  });

  // Send message mutation with optimistic update
  const sendMessageMutation = useMutation(
    ({ sessionId, message }: { sessionId: string; message: string }) =>
      chatAPI.sendMessage(sessionId, message),
    {
      onMutate: async ({ message }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(['chat-session', currentSessionId]);
        
        // Snapshot previous value
        const previousSession = queryClient.getQueryData(['chat-session', currentSessionId]);
        
        // Optimistically update - add user message immediately
        queryClient.setQueryData(['chat-session', currentSessionId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: [
              ...old.messages,
              {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
              }
            ]
          };
        });
        
        setIsTyping(true);
        setMessage('');
        
        return { previousSession };
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-session', currentSessionId]);
        queryClient.invalidateQueries('chat-sessions');
        setIsTyping(false);
      },
      onError: (err, variables, context: any) => {
        // Rollback on error
        if (context?.previousSession) {
          queryClient.setQueryData(['chat-session', currentSessionId], context.previousSession);
        }
        setIsTyping(false);
      }
    }
  );

  // Delete session mutation
  const deleteSessionMutation = useMutation(chatAPI.deleteSession, {
    onSuccess: () => {
      queryClient.invalidateQueries('chat-sessions');
      if (currentSessionId) {
        setCurrentSessionId(null);
      }
    }
  });

  // Edit message mutation
  const editMessageMutation = useMutation(
    ({ sessionId, messageIndex, message }: { sessionId: string; messageIndex: number; message: string }) =>
      chatAPI.editMessage(sessionId, messageIndex, message),
    {
      onMutate: () => {
        setIsTyping(true);
        setEditingMessageIndex(null);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-session', currentSessionId]);
        queryClient.invalidateQueries('chat-sessions');
        setIsTyping(false);
      },
      onError: () => {
        setIsTyping(false);
      }
    }
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [(currentSession as any)?.messages, isTyping]);

  // Select first session by default
  useEffect(() => {
    if (sessions && (sessions as any).length > 0 && !currentSessionId) {
      setCurrentSessionId((sessions as any)[0]._id);
    }
  }, [sessions, currentSessionId]);

  const handleSendMessage = () => {
    if (!message.trim() || !currentSessionId || sendMessageMutation.isLoading) return;
    
    const messageToSend = message.trim();
    
    sendMessageMutation.mutate({
      sessionId: currentSessionId,
      message: messageToSend
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    createSessionMutation.mutate(undefined);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this chat session?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const handleEditMessage = (index: number, content: string) => {
    setEditingMessageIndex(index);
    setEditingContent(content);
  };

  const handleSaveEdit = () => {
    if (!editingContent.trim() || !currentSessionId || editingMessageIndex === null) return;
    
    editMessageMutation.mutate({
      sessionId: currentSessionId,
      messageIndex: editingMessageIndex,
      message: editingContent.trim()
    });
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const suggestedQuestions = [
    "How can I improve my study habits?",
    "Explain React hooks to me",
    "What are the best practices for learning programming?",
    "Help me understand machine learning concepts",
    "How do I stay motivated while learning?"
  ];

  if (sessionsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full flex">
      {/* Sidebar - Chat Sessions */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                EduxBot
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              icon={<Plus className="w-4 h-4" />}
              disabled={createSessionMutation.isLoading}
            >
              New Chat
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your AI learning assistant
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions && (sessions as any).length > 0 ? (
            <div className="p-2">
              {(sessions as any).map((session: any) => (
                <div
                  key={session._id}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session._id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setCurrentSessionId(session._id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No chat sessions yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSessionId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {(currentSession as any)?.title || 'EduxBot Chat'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    AI-powered learning assistant
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sessionLoading ? (
                <div className="flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : (currentSession as any)?.messages && (currentSession as any).messages.length > 0 ? (
                <>
                  {(currentSession as any).messages.map((msg: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex space-x-3 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === 'user' 
                            ? 'bg-blue-500' 
                            : 'bg-slate-600'
                        }`}>
                          {msg.role === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          {editingMessageIndex === index ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={!editingContent.trim() || editMessageMutation.isLoading}
                                >
                                  Save & Regenerate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMessageIndex(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={`group relative rounded-2xl px-4 py-3 ${
                                msg.role === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                              }`}>
                                {msg.role === 'assistant' ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                        ul: ({node, ...props}) => <ul className="mb-2 ml-4 list-disc" {...props} />,
                                        ol: ({node, ...props}) => <ol className="mb-2 ml-4 list-decimal" {...props} />,
                                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                                        em: ({node, ...props}) => <em className="italic" {...props} />,
                                        code: ({node, inline, ...props}: any) => 
                                          inline ? (
                                            <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props} />
                                          ) : (
                                            <code className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-sm overflow-x-auto" {...props} />
                                          ),
                                        h3: ({node, ...props}) => <h3 className="font-semibold text-base mb-2 mt-3 first:mt-0" {...props} />,
                                        h4: ({node, ...props}) => <h4 className="font-semibold text-sm mb-1 mt-2 first:mt-0" {...props} />,
                                      }}
                                    >
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                )}
                                
                                {/* Message Actions */}
                                <div className={`flex items-center justify-between mt-2 pt-2 border-t ${
                                  msg.role === 'user' 
                                    ? 'border-blue-400' 
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}>
                                  <p className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {formatTime(msg.timestamp)}
                                  </p>
                                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleCopyMessage(msg.content, index)}
                                      className={`p-1 rounded hover:bg-white/10 transition-colors ${
                                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                                      }`}
                                      title="Copy message"
                                    >
                                      {copiedIndex === index ? (
                                        <Check className="w-3 h-3" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                    {msg.role === 'user' && (
                                      <button
                                        onClick={() => handleEditMessage(index, msg.content)}
                                        className="p-1 rounded hover:bg-white/10 transition-colors text-blue-100"
                                        title="Edit and regenerate"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex space-x-3 max-w-3xl">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome to EduxBot!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    I'm here to help you learn and answer your questions. Try asking me something!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setMessage(question)}
                        className="p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {question}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about learning..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isLoading}
                  icon={<Send className="w-4 h-4" />}
                  className="px-4 py-3"
                >
                  Send
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to EduxBot
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start a new conversation to begin learning with AI assistance
              </p>
              <Button
                onClick={handleNewChat}
                icon={<Plus className="w-4 h-4" />}
                disabled={createSessionMutation.isLoading}
              >
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}