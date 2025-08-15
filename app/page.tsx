'use client';

import { Container, Row, Col, Card, Button, Form, InputGroup, Navbar, Nav, Badge, Spinner, Alert } from 'react-bootstrap';
import { useState, useRef, useEffect, useCallback } from 'react';
import { trpc } from './providers/trpc-provider';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  image_url?: string;
  created_at: string;
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [isImageMode, setIsImageMode] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [imageLoadErrors, setImageLoadErrors] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  const [messageAnimations, setMessageAnimations] = useState<{ [key: string]: boolean }>({});
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    setLastUpdate(new Date());
    setTimeout(() => setShowWelcomeAnimation(false), 2000);
  }, []);

  const utils = trpc.useUtils();
  const messagesQuery = trpc.getMessages.useQuery(undefined, {
    enabled: isClient,
    refetchOnWindowFocus: isClient,
    retry: (failureCount, error: any) => {
      if (failureCount >= 3) return false;
      if (error?.message?.includes('fetch failed')) return true;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000,
  });

  useEffect(() => {
    if (messagesQuery.error) {
      console.error('Messages query error:', messagesQuery.error);
      setError('Failed to load messages. Retrying...');
    } else if (messagesQuery.data && isClient) {
      setError(null);
      setLastUpdate(new Date());
    }
  }, [messagesQuery.error, messagesQuery.data, isClient]);

  const messages: Message[] = messagesQuery.data || [];

  useEffect(() => {
    if (messages.length > previousMessageCount) {
      const newMessages = messages.slice(previousMessageCount);
      newMessages.forEach(msg => {
        setMessageAnimations(prev => ({ ...prev, [msg.id]: true }));
        setTimeout(() => {
          setMessageAnimations(prev => ({ ...prev, [msg.id]: false }));
        }, 600);
      });
      setPreviousMessageCount(messages.length);
    }
  }, [messages.length, previousMessageCount]);

  const sendMessageMutation = trpc.sendMessage.useMutation({
    onMutate: () => {
      setIsTyping(true);
      setTypingText(isImageMode ? 'Generating your image...' : 'Thinking...');
    },
    onSuccess: () => {
      utils.getMessages.invalidate();
      setMessage('');
      setIsTyping(false);
      setTypingText('');
      if (isClient) setLastUpdate(new Date());
      setError(null);
      if (inputRef.current) inputRef.current.focus();
    },
    onError: (err: any) => {
      console.error('Send message error:', err);
      setIsTyping(false);
      setTypingText('');
      if (err?.message?.includes('Service Unavailable') || err?.message?.includes('503')) {
        setError('AI service is temporarily overloaded. Please try again in a few moments.');
      } else if (err?.message?.includes('quota')) {
        setError('API quota exceeded. Please try again later.');
      } else {
        setError('Failed to send message. Please try again.');
      }
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('503') || error?.message?.includes('Service Unavailable')) {
        return failureCount < 2;
      }
      return false;
    },
    retryDelay: 3000,
  });

  const clearMessagesMutation = trpc.clearMessages.useMutation({
    onSuccess: () => {
      utils.getMessages.invalidate();
      setPreviousMessageCount(0);
      if (isClient) setLastUpdate(new Date());
      setError(null);
    },
    onError: (err: any) => {
      console.error('Clear messages error:', err);
      setError('Failed to clear messages. Please try again.');
    },
  });

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isClient && messages.length > 0) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom, isClient]);

  useEffect(() => {
    if (!autoRefresh || !isClient) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        utils.getMessages.invalidate();
        setLastUpdate(new Date());
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [utils, autoRefresh, isClient]);

  const formatMessageContent = (content: string) => {
    if (content.includes('🆚') || content.includes('🌤️')) return formatRichContent(content);
    return content;
  };

  const formatRichContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    return (
      <div>
        {lines.map((line, index) => {
          if (line.startsWith('**') && line.endsWith('**')) {
            return <h6 key={index} className="mb-2 text-light animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>{line.replace(/\*\*/g, '')}</h6>;
          }
          if (line.match(/^\d+\./)) {
            return <div key={index} className="mb-2 ps-2 border-start border-light border-2 animate-slide-in" style={{ animationDelay: `${index * 150}ms` }}>{line}</div>;
          }
          if (line.includes('Source:')) {
            return <small key={index} className="text-light opacity-75 d-block mb-2 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>{line}</small>;
          }
          return <div key={index} className="mb-1 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>{line}</div>;
        })}
      </div>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    if (!isClient) return '';
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return 'Invalid time';
    }
  };

  const getLastUpdateString = () => {
    if (!isClient || !lastUpdate) return 'Loading...';
    return lastUpdate.toLocaleTimeString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending || !isClient) return;
    if (message.length > 4000) {
      setError('Message is too long. Please keep it under 4000 characters.');
      return;
    }
    setError(null);
    try {
      await sendMessageMutation.mutateAsync({
        message: message.trim(),
        isImageRequest: isImageMode,
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleClearChat = () => {
    if (clearMessagesMutation.isPending || !isClient) return;
    if (window.confirm('Are you sure you want to clear all messages? This action cannot be undone.')) {
      clearMessagesMutation.mutate();
    }
  };

  const handleRefresh = () => {
    if (!isClient) return;
    setError(null);
    utils.getMessages.invalidate();
    setLastUpdate(new Date());
  };

  const toggleAutoRefresh = () => setAutoRefresh(prev => !prev);

  const handleImageError = (messageId: string) => {
    setImageLoadErrors(prev => ({ ...prev, [messageId]: true }));
  };

  const handleImageLoad = (messageId: string) => {
    setImageLoadErrors(prev => ({ ...prev, [messageId]: false }));
  };

  const retryImageLoad = (messageId: string, imageUrl: string) => {
    setImageLoadErrors(prev => ({ ...prev, [messageId]: false }));
    const img = document.querySelector(`img[data-message-id="${messageId}"]`) as HTMLImageElement | null;
    if (img) img.src = `${imageUrl}&t=${Date.now()}`;
  };

  const handleModeToggle = () => {
    setIsImageMode(!isImageMode);
    if (inputRef.current) inputRef.current.focus();
  };

  const suggestedPrompts = [
    "🌅 Create a serene mountain landscape at sunrise",
    "🚀 Explain quantum computing in simple terms",
    "🎨 Generate a futuristic city skyline",
    "📚 Write a short story about time travel",
    "🔬 How does photosynthesis work?"
  ];

  if (!isClient) {
    return (
      <Container fluid className="vh-100 d-flex align-items-center justify-content-center loading-screen">
        <div className="text-center text-white">
          <div className="loading-spinner mb-4">
            <Spinner animation="border" role="status" className="text-primary" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
          <h4 className="animate-pulse">Initializing AI Chat...</h4>
          <p className="text-muted animate-fade-in">Connecting to servers...</p>
        </div>
      </Container>
    );
  }

  if (messagesQuery.isError && !messagesQuery.isLoading && !messagesQuery.isFetching) {
    return (
      <Container fluid className="vh-100 d-flex align-items-center justify-content-center">
        <Card style={{ maxWidth: '500px', width: '100%' }} className="shadow enhanced-card animate-scale-in">
          <Card.Body className="text-center">
            <div className="error-icon mb-3">⚠️</div>
            <h3 className="text-warning mb-3">Connection Error</h3>
            <p className="text-white">Unable to connect to the server. Please check your connection and try again.</p>
            <Button onClick={handleRefresh} variant="primary" className="me-2 enhanced-btn" disabled={messagesQuery.isRefetching}>
              {messagesQuery.isRefetching ? <Spinner size="sm" className="me-2" /> : '🔄'} Retry Connection
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <Navbar className="enhanced-navbar shadow-sm">
        <Container fluid>
          <Navbar.Brand className="enhanced-brand d-flex align-items-center">
            <div className="brand-icon me-3">
              <span className="animate-bounce">🤖</span>
            </div>
            <div>
              <div className="brand-title">AI Chat Assistant</div>
              <div className="brand-subtitle">Powered by Advanced AI</div>
            </div>
            {messagesQuery.isRefetching && (
              <Spinner size="sm" className="ms-3 text-primary animate-spin" />
            )}
          </Navbar.Brand>
          
          <div className="d-flex align-items-center">
            <Badge bg={autoRefresh ? "success" : "secondary"} className="status-badge me-3 animate-pulse">
              <span className="pulse-dot me-1"></span>
              {autoRefresh ? "Live" : "Paused"}
            </Badge>
            <small className="text-light me-3 d-none d-md-block">
              Updated: {getLastUpdateString()}
            </small>
          </div>
          
          <Nav className="ms-auto">
            <Button 
              variant={autoRefresh ? "outline-warning" : "outline-success"}
              size="sm" 
              onClick={toggleAutoRefresh}
              className="me-2 control-btn"
              title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
            >
              {autoRefresh ? "⏸️ Pause" : "▶️ Resume"}
            </Button>
            <Button 
              variant="outline-info" 
              size="sm" 
              onClick={handleRefresh}
              disabled={messagesQuery.isRefetching}
              className="me-2 control-btn"
              title="Refresh messages"
            >
              {messagesQuery.isRefetching ? <Spinner size="sm" /> : '🔄'} Refresh
            </Button>
            <Button 
              variant="outline-warning" 
              size="sm" 
              onClick={handleClearChat}
              disabled={clearMessagesMutation.isPending || messages.length === 0}
              className="me-2 control-btn"
              title="Clear all messages"
            >
              {clearMessagesMutation.isPending ? <Spinner size="sm" /> : '🗑️'} Clear
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="chat-container p-0">
        {error && (
          <Alert variant="danger" className="m-3 enhanced-alert animate-slide-down" dismissible onClose={() => setError(null)}>
            <Alert.Heading>Error</Alert.Heading>
            {error}
          </Alert>
        )}

        <div className="messages-container">
          {messagesQuery.isLoading || (messagesQuery.isRefetching && messages.length === 0) ? (
            <div className="text-center text-white mt-5">
              <div className="loading-spinner mb-4">
                <Spinner animation="border" role="status" className="text-primary" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
              <h4 className="animate-pulse">Loading messages...</h4>
            </div>
          ) : messages.length === 0 ? (
            <div className={`welcome-screen text-center text-white mt-5 px-4 ${showWelcomeAnimation ? 'animate-scale-in' : ''}`}>
              <div className="mb-5">
                <div className="welcome-icon mb-4" style={{ fontSize: '4rem' }}>🌟</div>
                <h1 className="display-4 mb-3 animate-fade-in">Welcome to AI Chat Assistant</h1>
                <p className="lead mb-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  Experience intelligent conversations with advanced AI capabilities
                </p>
              </div>
              
              <div className="feature-showcase mb-5">
                <Row className="justify-content-center">
                  <Col md={6} lg={4} className="mb-4">
                    <Card className="feature-card h-100 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                      <Card.Body className="text-center">
                        <div style={{ fontSize: '2.5rem' }} className="mb-3">💬</div>
                        <h5 className="text-light">Smart Conversations</h5>
                        <p className="text-muted">Engage in natural, context-aware discussions</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={4} className="mb-4">
                    <Card className="feature-card h-100 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                      <Card.Body className="text-center">
                        <div style={{ fontSize: '2.5rem' }} className="mb-3">🖼️</div>
                        <h5 className="text-light">Image Generation</h5>
                        <p className="text-muted">Create stunning visuals from text descriptions</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={4} className="mb-4">
                    <Card className="feature-card h-100 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                      <Card.Body className="text-center">
                        <div style={{ fontSize: '2.5rem' }} className="mb-3">⚡</div>
                        <h5 className="text-light">Real-time Updates</h5>
                        <p className="text-muted">Get instant responses and live updates</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
              
              <Row className="justify-content-center">
                <Col md={10} lg={8}>
                  <Card className="suggestion-card border-0 mb-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                    <Card.Body>
                      <h5 className="text-light mb-3">💡 Try these suggestions:</h5>
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        {suggestedPrompts.map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline-light"
                            size="sm"
                            className="suggestion-btn animate-fade-in"
                            style={{ animationDelay: `${1 + index * 0.1}s` }}
                            onClick={() => {
                              setMessage(prompt.split(' ').slice(1).join(' '));
                              if (prompt.includes('Create') || prompt.includes('Generate')) {
                                setIsImageMode(true);
                              }
                              if (inputRef.current) {
                                inputRef.current.focus();
                              }
                            }}
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`message-wrapper ${msg.role} ${messageAnimations[msg.id] ? 'animate-message-in' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="enhanced-message">
                  <div className="message-header">
                    <div className="user-info">
                      <div className={`avatar ${msg.role}`}>
                        {msg.role === 'user' ? '👤' : '🤖'}
                      </div>
                      <span className="role-name">
                        {msg.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                    </div>
                    <span className="timestamp">
                      {formatTimestamp(msg.created_at)}
                    </span>
                  </div>
                  <div className="message-content">
                    {typeof formatMessageContent(msg.content) === 'string' 
                      ? formatMessageContent(msg.content)
                      : formatMessageContent(msg.content)
                    }
                  </div>
                  {msg.image_url && (
                    <div className="image-container mt-3">
                      {imageLoadErrors[msg.id] ? (
                        <div className="image-error animate-shake">
                          <div className="error-content">
                            <p className="mb-2">🖼️ Image failed to load</p>
                            <Button 
                              size="sm" 
                              variant="outline-light"
                              className="retry-btn"
                              onClick={() => retryImageLoad(msg.id, msg.image_url!)}
                            >
                              🔄 Retry
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="image-wrapper animate-scale-in">
                          <img
                            data-message-id={msg.id}
                            src={msg.image_url}
                            alt="Generated image"
                            className="generated-image"
                            onError={() => handleImageError(msg.id)}
                            onLoad={() => handleImageLoad(msg.id)}
                            loading="lazy"
                          />
                          <Badge bg="dark" className="image-badge">
                            🖼️ AI Generated
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="message-wrapper assistant animate-message-in">
              <div className="enhanced-message">
                <div className="message-header">
                  <div className="user-info">
                    <div className="avatar assistant animate-pulse">🤖</div>
                    <span className="role-name">AI Assistant</span>
                  </div>
                  <span className="timestamp">Now</span>
                </div>
                <div className="typing-indicator">
                  <span className="me-2">{typingText}</span>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-section">
          <Container fluid>
            <Card className="input-card">
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <InputGroup className="enhanced-input-group" size="lg">
                    <Form.Control
                      ref={inputRef}
                      type="text"
                      placeholder={isImageMode ? "🖼️ Describe an image to generate..." : "💬 Ask me anything..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={sendMessageMutation.isPending}
                      className="enhanced-input"
                      autoFocus
                      maxLength={4000}
                    />
                    <Button
                      type="button"
                      variant={isImageMode ? "warning" : "outline-secondary"}
                      onClick={handleModeToggle}
                      disabled={sendMessageMutation.isPending}
                      className="mode-toggle-btn"
                      title={isImageMode ? "Switch to text mode" : "Switch to image generation"}
                    >
                      <span className="animate-bounce">{isImageMode ? "🖼️" : "💬"}</span>
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={sendMessageMutation.isPending || !message.trim()}
                      className="send-btn"
                    >
                      {sendMessageMutation.isPending ? (
                        <Spinner size="sm" />
                      ) : (
                        <span className="animate-pulse">📤</span>
                      )}
                      <span className="ms-2">Send</span>
                    </Button>
                  </InputGroup>
                </Form>
                
                <div className="input-footer mt-3">
                  <Row>
                    <Col md={6}>
                      <small className="text-muted d-flex align-items-center">
                        <span className={`pulse-dot me-2 ${autoRefresh ? 'active' : ''}`}></span>
                        {autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh paused'} • 
                        Last update: {getLastUpdateString()}
                      </small>
                    </Col>
                    <Col md={6} className="text-md-end">
                      <small className="text-muted status-info">
                        ⚡ Real-time • 🛡️ Secure • {message.length}/4000
                      </small>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </Container>
    </>
  );
}