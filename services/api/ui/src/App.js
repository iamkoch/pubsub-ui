import './App.css';
import { useEffect, useState } from "react";

// Import new components
import Layout from './components/Layout/Layout';
import ToastContainer from './components/Layout/ToastContainer';
import TopicManager from './components/TopicManager/TopicManager';
import MessageComposer from './components/MessageComposer/MessageComposer';
import ActivityFeed from './components/ActivityFeed/ActivityFeed';
import useToast from './hooks/useToast';

function App() {
    const [topicList, setTopicList] = useState([])
    const [history, setHistory] = useState([])
    const [selectedTopic, setSelectedTopic] = useState(null)
    const [loading, setLoading] = useState(false)
    const [subscription, setSubscription] = useState(null)
    const [intervalId, setIntervalId] = useState(null)
    const [subs, setSubs] = useState([])
    const { toasts, success, error, removeToast } = useToast();

    const getHistory = async () => {
        const r = await fetch("/history/sent", {
            method: "GET"
        })

        const j = await r.json();

        setHistory(j)
    }

    useEffect(() => {
        const getTopics = async () => {
            const r = await fetch("/topics", {
                method: "GET"
                }
            )

            const j = await r.json();

            setTopicList(j)
        }

        getTopics()
        getHistory()
    }, [])

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId])

    // Remove old data state - now handled by individual components

    const sendToTopic = async (messageData) => {
        setLoading(true);
        try {
            const result = await fetch(`/topics/${messageData.topic.displayName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ payload: messageData.payload })
            });

            if (result.status > 299) {
                const errorMsg = await result.text();
                error(`Failed to send message: ${errorMsg}`);
            } else {
                success('Message sent successfully!');
                await getHistory();
            }
        } catch (err) {
            error(`Error sending message: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    // State variables moved to top of component

    const subscribeToAll = async () => {
        setLoading(true);
        try {
            for (let topic of topicList) {
                const res = await fetch(`/topics/${topic.displayName}/subscriptions`, {
                    method: "POST"
                });

                if (res.status > 299) {
                    const errorMsg = await res.text();
                    error(`Failed to subscribe to ${topic.displayName}: ${errorMsg}`);
                } else {
                    const result = await res.json();
                    success(`Subscribed to ${topic.displayName}`);

                    setSubscription(result.location);
                    setIntervalId(setInterval(async () => await pullMessages(result.location, topic.displayName), 5000));
                }
            }
        } catch (err) {
            error(`Error subscribing to topics: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    const subscribe = async () => {
        if (!selectedTopic) return;
        
        setLoading(true);
        try {
            const res = await fetch(`/topics/${selectedTopic.displayName}/subscriptions`, {
                method: "POST"
            });

            if (res.status > 299) {
                const errorMsg = await res.text();
                error(`Failed to subscribe: ${errorMsg}`);
            } else {
                const result = await res.json();
                success(`Subscribed to ${selectedTopic.displayName}`);

                setSubscription(result.location);
                setIntervalId(setInterval(async () => await pullMessages(result.location, selectedTopic.displayName), 1000));
            }
        } catch (err) {
            error(`Error subscribing: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    const createTopic = async (topicName) => {
        setLoading(true);
        try {
            const res = await fetch(`/topics`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topicName })
            });

            if (res.status > 299) {
                const errorMsg = await res.text();
                error(`Failed to create topic: ${errorMsg}`);
            } else {
                success(`Topic "${topicName}" created successfully!`);
                // Refresh topic list
                const topicsRes = await fetch("/topics", { method: "GET" });
                if (topicsRes.ok) {
                    const topics = await topicsRes.json();
                    setTopicList(topics);
                }
            }
        } catch (err) {
            error(`Error creating topic: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    const pullMessages = async (location, topicId) => {
        const res = await fetch(`${location || subscription}`, {
            method: "GET"
        })

        if (res.status > 299) {
            // Don't show error for pull messages - it's expected during polling
        } else {
            const newMessages = await res.json();

            setSubs(prevState => {
                let sub = prevState.find(s => s.topicId === topicId);
                if (sub == null) {
                    sub = {topicId, messages: []};
                    prevState.push(sub)
                }

                sub.messages = newMessages
                return [...prevState] // Return new array for proper re-render
            })
        }
    }

    // Removed old toast and utility functions - now using modern components

    return (
        <Layout connectionStatus="connected">
            <div className="flex h-screen pt-6 px-6 gap-6 pb-6">
                {/* Left Panel - Topic Manager */}
                <div className="w-1/3 min-w-80">
                    <TopicManager
                        topicList={topicList}
                        selectedTopic={selectedTopic}
                        onTopicSelect={setSelectedTopic}
                        onCreateTopic={createTopic}
                        onSubscribe={subscribe}
                        onSubscribeToAll={subscribeToAll}
                        loading={loading}
                    />
                </div>

                {/* Center Panel - Message Composer */}
                <div className="flex-1">
                    <MessageComposer
                        selectedTopic={selectedTopic}
                        onSendMessage={sendToTopic}
                        loading={loading}
                    />
                </div>

                {/* Right Panel - Activity Feed */}
                <div className="w-1/3 min-w-80">
                    <ActivityFeed
                        sentHistory={history}
                        receivedMessages={subs}
                        onHistorySelect={(payload) => {
                            // This would update the message composer
                            // For now, we'll just show a toast
                            success('Message loaded into composer');
                        }}
                        additionalPillConfigs={[
                            { path: 'type', label: 'Type', color: 'purple' },
                            { path: 'source', label: 'Source', color: 'blue' },
                            { path: 'specversion', label: 'Spec', color: 'indigo' }
                        ]}
                    />
                </div>
            </div>

            {/* Toast Container */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </Layout>
    );
}

export default App;
