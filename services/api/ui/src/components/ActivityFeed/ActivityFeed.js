import React, { useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const ActivityFeed = ({ 
  sentHistory = [], 
  receivedMessages = [],
  onHistorySelect,
  onClearHistory,
  additionalPillConfigs = []  // Array of {path: string, label?: string, color?: string}
}) => {
  const [activeTab, setActiveTab] = useState('sent');
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text || '');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getMessageContent = (message, type) => {
    if (type === 'sent') {
      // Sent messages have a payload field that's a JSON string
      return message.payload || 'No content';
    } else {
      // Received messages are the entire message object from PubSub
      return JSON.stringify(message, null, 2);
    }
  };

  const getMessageForCopy = (message, type) => {
    if (type === 'sent') {
      return message.payload || '';
    } else {
      return JSON.stringify(message, null, 2);
    }
  };

  const getMessageForReuse = (message, type) => {
    if (type === 'sent') {
      return message.payload || '';
    } else {
      // For received messages, return the entire message as JSON string
      return JSON.stringify(message, null, 2);
    }
  };

  const expandMessage = (message, type) => {
    setExpandedMessage({ message, type });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExpandedMessage(null);
  };

  // Extract value from nested object using dot notation path
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      return undefined;
    }, obj);
  };

  // Get additional pills for a message
  const getAdditionalPills = (message, type) => {
    if (!additionalPillConfigs.length) return [];
    
    let messageData = message;
    
    // For received messages, the actual data might be nested
    if (type === 'received' && typeof message === 'object') {
      messageData = message;
    }
    
    // For sent messages, parse the payload if it's a JSON string
    if (type === 'sent' && message.payload) {
      try {
        const parsed = JSON.parse(message.payload);
        messageData = parsed;
      } catch {
        // If parsing fails, use the original message
        messageData = message;
      }
    }
    
    return additionalPillConfigs.map(config => {
      const value = getNestedValue(messageData, config.path);
      if (value !== undefined && value !== null) {
        return {
          label: config.label || config.path,
          value: String(value),
          color: config.color || 'gray'
        };
      }
      return null;
    }).filter(Boolean);
  };

  // Get pill color classes based on color name
  const getPillColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800', 
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      pink: 'bg-pink-100 text-pink-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || colorMap.gray;
  };

  const MessageCard = ({ message, type, onSelect }) => {
    const additionalPills = getAdditionalPills(message, type);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                type === 'sent' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {type === 'sent' ? 'Sent' : 'Received'}
              </span>
              {message.topic && (
                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                  {message.topic}
                </span>
              )}
              {additionalPills.map((pill, index) => (
                <span
                  key={`${pill.label}-${index}`}
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPillColorClasses(pill.color)}`}
                  title={`${pill.label}: ${pill.value}`}
                >
                  {pill.value}
                </span>
              ))}
            </div>
          {(message.timestamp || message.time) && (
            <p className="text-xs text-gray-500">{formatTimestamp(message.timestamp || message.time)}</p>
          )}
        </div>
        <div className="flex gap-1">
          {type === 'sent' && onSelect && (
            <Button
              size="sm"
              color="secondary"
              onClick={() => onSelect(getMessageForReuse(message, type))}
              className="text-xs px-2 py-1"
            >
              Reuse
            </Button>
          )}
          <Button
            size="sm"
            color="secondary"
            onClick={() => copyToClipboard(getMessageForCopy(message, type))}
            className="text-xs px-2 py-1"
          >
            Copy
          </Button>
          <Button
            size="sm"
            color="primary"
            onClick={() => expandMessage(message, type)}
            className="text-xs px-2 py-1"
          >
            Expand
          </Button>
        </div>
      </div>
      
      <div className="text-sm">
        <SyntaxHighlighter 
          language="json" 
          style={docco}
          customStyle={{
            margin: 0,
            fontSize: '0.75rem',
            maxHeight: '150px',
            overflow: 'auto'
          }}
        >
          {getMessageContent(message, type)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
          {onClearHistory && (
            <Button
              size="sm"
              color="danger"
              outline
              onClick={onClearHistory}
            >
              Clear History
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Nav tabs className="border-b-0">
          <NavItem>
            <NavLink
              className={`cursor-pointer px-4 py-2 rounded-t-lg border-b-2 transition-colors ${
                activeTab === 'sent'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('sent')}
            >
              Sent Messages ({sentHistory.length})
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={`cursor-pointer px-4 py-2 rounded-t-lg border-b-2 transition-colors ${
                activeTab === 'received'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('received')}
            >
              Received Messages ({receivedMessages.reduce((acc, sub) => acc + sub.messages.length, 0)})
            </NavLink>
          </NavItem>
        </Nav>
      </div>

      <div className="flex-1 overflow-hidden">
        <TabContent activeTab={activeTab} className="h-full">
          <TabPane tabId="sent" className="h-full">
            <div className="h-full overflow-y-auto p-6">
              {sentHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <p>No messages sent yet</p>
                  <p className="text-sm text-gray-400 mt-1">Messages you send will appear here</p>
                </div>
              ) : (
                <div>
                  {sentHistory.map((message, index) => (
                    <MessageCard
                      key={message.id || index}
                      message={message}
                      type="sent"
                      onSelect={onHistorySelect}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabPane>
          
          <TabPane tabId="received" className="h-full">
            <div className="h-full overflow-y-auto p-6">
              {receivedMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2a2 2 0 00-2 2v3a2 2 0 01-2 2H8a2 2 0 01-2-2v-3a2 2 0 00-2-2H4" />
                  </svg>
                  <p>No messages received yet</p>
                  <p className="text-sm text-gray-400 mt-1">Subscribe to topics to see incoming messages</p>
                </div>
              ) : (
                <div>
                  {receivedMessages.map((subscription) => (
                    <div key={subscription.topicId} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Topic: {subscription.topicId}</h3>
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {subscription.messages.length} messages
                        </span>
                      </div>
                      {subscription.messages.length > 0 ? (
                        subscription.messages.map((message, msgIndex) => (
                          <MessageCard
                            key={`${subscription.topicId}-${msgIndex}`}
                            message={{
                              ...message,
                              topic: subscription.topicId,
                              timestamp: message.timestamp || new Date().toISOString()
                            }}
                            type="received"
                          />
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No messages in this subscription</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabPane>
        </TabContent>
      </div>

      {/* Expanded Message Modal */}
      <Modal isOpen={isModalOpen} toggle={closeModal} size="lg" className="modal-lg">
        <ModalHeader toggle={closeModal}>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              expandedMessage?.type === 'sent' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {expandedMessage?.type === 'sent' ? 'Sent Message' : 'Received Message'}
            </span>
            {expandedMessage?.message.topic && (
              <span className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded">
                Topic: {expandedMessage.message.topic}
              </span>
            )}
          </div>
        </ModalHeader>
        <ModalBody>
          {expandedMessage && (
            <div>
              <div className="mb-4">
                {(expandedMessage.message.timestamp || expandedMessage.message.time) && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Timestamp:</strong> {formatTimestamp(expandedMessage.message.timestamp || expandedMessage.message.time)}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <SyntaxHighlighter 
                  language="json" 
                  style={docco}
                  customStyle={{
                    margin: 0,
                    fontSize: '0.875rem',
                    backgroundColor: 'transparent',
                    maxHeight: '70vh',
                    overflow: 'auto'
                  }}
                  showLineNumbers={true}
                >
                  {getMessageContent(expandedMessage.message, expandedMessage.type)}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2">
            <Button
              color="secondary"
              onClick={() => expandedMessage && copyToClipboard(getMessageForCopy(expandedMessage.message, expandedMessage.type))}
            >
              Copy to Clipboard
            </Button>
            {expandedMessage?.type === 'sent' && onHistorySelect && (
              <Button
                color="info"
                onClick={() => {
                  onHistorySelect(getMessageForReuse(expandedMessage.message, expandedMessage.type));
                  closeModal();
                }}
              >
                Reuse in Composer
              </Button>
            )}
            <Button color="primary" onClick={closeModal}>
              Close
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ActivityFeed;