import React, { useState } from 'react';
import { Button, Input, Label } from "reactstrap";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const MessageComposer = ({ 
  selectedTopic,
  onSendMessage,
  loading = false 
}) => {
  const [messageData, setMessageData] = useState({
    json: '{\n  "sample": "json",\n  "timestamp": "' + new Date().toISOString() + '"\n}',
    attKey: 'eventid',
    attVal: '',
    attributes: {}
  });

  const [showAttributes, setShowAttributes] = useState(false);

  const handleInputChange = (field, value) => {
    setMessageData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAttribute = () => {
    if (messageData.attKey && messageData.attVal) {
      setMessageData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [prev.attKey]: prev.attVal
        },
        attKey: '',
        attVal: ''
      }));
    }
  };

  const removeAttribute = (key) => {
    setMessageData(prev => {
      const newAttributes = { ...prev.attributes };
      delete newAttributes[key];
      return {
        ...prev,
        attributes: newAttributes
      };
    });
  };

  const formatJson = () => {
    try {
      return JSON.stringify(JSON.parse(messageData.json), null, 2);
    } catch (e) {
      return messageData.json;
    }
  };

  const isValidJson = () => {
    try {
      JSON.parse(messageData.json);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSendMessage = () => {
    if (selectedTopic && isValidJson()) {
      onSendMessage({
        topic: selectedTopic,
        payload: JSON.parse(messageData.json),
        attributes: messageData.attributes
      });
    }
  };

  const loadTemplate = (template) => {
    const templates = {
      simple: '{\n  "message": "Hello World",\n  "timestamp": "' + new Date().toISOString() + '"\n}',
      event: '{\n  "eventType": "user_action",\n  "userId": "12345",\n  "action": "click",\n  "timestamp": "' + new Date().toISOString() + '",\n  "metadata": {\n    "page": "/dashboard",\n    "element": "button"\n  }\n}',
      notification: '{\n  "type": "notification",\n  "title": "New Message",\n  "body": "You have received a new message",\n  "userId": "user123",\n  "priority": "high",\n  "timestamp": "' + new Date().toISOString() + '"\n}'
    };
    setMessageData(prev => ({ ...prev, json: templates[template] }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Composer</h2>
        
        {!selectedTopic && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-800">Please select a topic first</p>
            </div>
          </div>
        )}

        {/* Quick Templates */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</Label>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" color="secondary" onClick={() => loadTemplate('simple')}>
              Simple Message
            </Button>
            <Button size="sm" color="secondary" onClick={() => loadTemplate('event')}>
              Event Data
            </Button>
            <Button size="sm" color="secondary" onClick={() => loadTemplate('notification')}>
              Notification
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* JSON Editor */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">Message Payload (JSON)</Label>
          <textarea
            className={`w-full h-40 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              isValidJson() ? 'border-gray-300' : 'border-red-300 bg-red-50'
            }`}
            value={messageData.json}
            onChange={(e) => handleInputChange('json', e.target.value)}
            placeholder="Enter your JSON message here..."
            disabled={loading}
          />
          {!isValidJson() && (
            <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
          )}
        </div>

        {/* JSON Preview */}
        {isValidJson() && (
          <div className="mb-6">
            <Label className="block text-sm font-medium text-gray-700 mb-2">Preview</Label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <SyntaxHighlighter 
                language="json" 
                style={docco}
                customStyle={{
                  margin: 0,
                  fontSize: '0.875rem'
                }}
              >
                {formatJson()}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* Attributes Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-gray-700">Message Attributes</Label>
            <Button
              size="sm"
              color="link"
              onClick={() => setShowAttributes(!showAttributes)}
              className="p-0 text-primary-500"
            >
              {showAttributes ? 'Hide' : 'Show'} Attributes
            </Button>
          </div>
          
          {showAttributes && (
            <div className="space-y-4">
              {/* Add Attribute */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Attribute key"
                  value={messageData.attKey}
                  onChange={(e) => handleInputChange('attKey', e.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
                <Input
                  type="text"
                  placeholder="Attribute value"
                  value={messageData.attVal}
                  onChange={(e) => handleInputChange('attVal', e.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
                <Button 
                  color="secondary" 
                  onClick={addAttribute}
                  disabled={!messageData.attKey || !messageData.attVal || loading}
                >
                  Add
                </Button>
              </div>

              {/* Existing Attributes */}
              {Object.keys(messageData.attributes).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(messageData.attributes).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{key}:</span>
                        <span className="ml-2 text-gray-600">{value}</span>
                      </div>
                      <Button 
                        size="sm" 
                        color="danger" 
                        onClick={() => removeAttribute(key)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Send Button */}
      <div className="p-6 border-t border-gray-200">
        <Button 
          color="primary" 
          size="lg" 
          block 
          onClick={handleSendMessage}
          disabled={!selectedTopic || !isValidJson() || loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </div>
  );
};

export default MessageComposer;