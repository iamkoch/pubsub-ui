import React, { useState } from 'react';
import { Button, Input, Badge } from "reactstrap";

const TopicManager = ({ 
  topicList = [], 
  selectedTopic, 
  onTopicSelect, 
  onCreateTopic, 
  onSubscribe,
  onSubscribeToAll,
  loading = false
}) => {
  const [newTopicName, setNewTopicName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTopics = topicList.filter(topic => 
    topic.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTopic = () => {
    if (newTopicName.trim()) {
      onCreateTopic(newTopicName);
      setNewTopicName('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Topic Manager</h2>
        
        {/* Create Topic */}
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700">Create New Topic</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter topic name"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTopic()}
              className="flex-1"
              disabled={loading}
            />
            <Button 
              color="primary" 
              onClick={handleCreateTopic}
              disabled={!newTopicName.trim() || loading}
            >
              Create
            </Button>
          </div>
        </div>

        {/* Search Topics */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Select Topic</label>
          <Input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3"
          />
        </div>
      </div>

      {/* Topic List */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredTopics.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2a2 2 0 00-2 2v3a2 2 0 01-2 2H8a2 2 0 01-2-2v-3a2 2 0 00-2-2H4" />
            </svg>
            <p>No topics found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTopics.map((topic, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTopic?.displayName === topic.displayName
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onTopicSelect(topic)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{topic.displayName}</span>
                  {selectedTopic?.displayName === topic.displayName && (
                    <Badge color="primary" className="text-xs">Selected</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 space-y-3">
        <Button 
          color="primary" 
          block 
          onClick={onSubscribe}
          disabled={!selectedTopic || loading}
        >
          Subscribe to Selected Topic
        </Button>
        <Button 
          color="warning" 
          outline 
          block 
          onClick={onSubscribeToAll}
          disabled={topicList.length === 0 || loading}
        >
          Subscribe to All Topics (Caution!)
        </Button>
      </div>
    </div>
  );
};

export default TopicManager;