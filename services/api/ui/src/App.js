import './App.css';
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Input,
    Toast,
    ToastHeader,
    ToastBody,
    Label, Row, Col
} from "reactstrap";
import {useEffect, useState} from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

function App() {
    const sampleJson = `{ "sample": "json" }`;

    const [topicList, setTopicList] = useState([])
    const [history, setHistory] = useState([])

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

    const [data, updateData] = useState({topic: '', json: '', attKey: 'eventid', attVal: '', attributes: {}});
    const handleChange = (name, value) => {
        updateData({...data, [name]: value.target.value});
    }

    const sendToTopic = async () => {
        const result = await fetch(`/topics/${data.topic.displayName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payload: JSON.parse(data.json) })
        });

        if (result.status > 299) {
            showToast('Oops', 'Something went wrong: ' + await result.json())
        } else {
            showToast('Topic Send', 'sent to topic')
            await getHistory()
        }
    }

    const [subscription, setSubscription] = useState(null)
    const [t, setT] = useState(null)

    const [subs, setSubs] = useState([])

    const subscribeToAll = async () => {
        for (let topic of topicList) {
            const res = await fetch(`/topics/${topic.displayName}/subscriptions`, {
                method: "POST"
            })

            if (res.status > 299) {
                showToast('Oops', 'Something went wrong: ' + await res.json())
            } else {
                const result = await res.json();
                showToast('Subscribe', 'subscribed OK')

                setSubscription(result.location)
                setT(setInterval(async () => await pullMessages(result.location, topic.displayName), 5000))
            }
        }
    }

    const subscribe = async () => {
        const res = await fetch(`/topics/${data.topic.displayName}/subscriptions`, {
            method: "POST"
        })

        if (res.status > 299) {
            showToast('Oops', 'Something went wrong: ' + await res.json())
        } else {
            const result = await res.json();
            showToast('Subscribe', 'subscribed OK')

            setSubscription(result.location)
            setT(setInterval(async () => await pullMessages(result.location, data.topic.displayName), 1000))
        }
    }

    const createTopic = async () => {
        const res = await fetch(`/topics`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topicName: data.typedTopic })
        })

        if (res.status > 299) {
            showToast('Oops', 'Something went wrong: ' + await res.json())
        } else {
            showToast('Topic Created', 'created topic')
        }

    }

    const pullMessages = async (location, topicId) => {
        const res = await fetch(`${location || subscription}`, {
            method: "GET"
        })

        if (res.status > 299) {
            showToast('Oops', 'Something went wrong: ' + await res.json())
        } else {
            if (location == null) {
                showToast('Pull', 'Pulled OK')
            }
            const newMessages = await res.json();

            setSubs(prevState => {
                let sub = prevState.find(s => s.topicId === topicId);
                if (sub == null) {
                    sub = {topicId, messages: []};
                    prevState.push(sub)
                }

                sub.messages = newMessages
                return prevState
            })
        }
    }

    const [open, setOpen] = useState(false);
    const [showA, setShowA] = useState(false);
    const [toastInfo, setToastInfo] = useState({title: "", body: ""})

    const showToast = (title, msg) => {
        setToastInfo({title, body: msg})
        setShowA(true)
        setTimeout(() => setShowA(false), 3000)
    }

    const toggleShowA = () => setShowA(!showA);
    const formatJson = j => {
        try {
            return JSON.stringify(JSON.parse(data.json), null, 2);
        }
        catch (e) {
            return data.json;
        }
    }

    return (
        <div className="App">
            <Col>
                <Row>
                    <Toast isOpen={showA} onClose={toggleShowA}>
                        <ToastHeader>
                            <img
                                src="holder.js/20x20?text=%20"
                                className="rounded me-2"
                                alt=""
                            />
                            <strong className="me-auto">{toastInfo.title}</strong>
                        </ToastHeader>
                        <ToastBody>{toastInfo.body}</ToastBody>
                    </Toast>
                </Row>
                <Row>
                    <Dropdown isOpen={open} toggle={() => setOpen(!open)}>
                        <DropdownToggle caret>
                            Choose a topic
                        </DropdownToggle>
                        <DropdownMenu>
                            {topicList.map(t => {
                                return (
                                    <DropdownItem onClick={() => updateData({...data, ["topic"]: t})}>{t.displayName}</DropdownItem>
                                )
                            })}
                        </DropdownMenu>
                    </Dropdown>
                    <Button onClick={subscribeToAll}>Subscribe to all (careful!)</Button>
                    </Row>
                <Row>
                    <Input onChange={handleChange.bind(this, 'typedTopic')} value={data.topic.displayName} id="topicName" type="text" placeholder="Topic"/>
                </Row>
                <Row>
                    <Label>Add attributes</Label>
                    <Input onChange={handleChange.bind(this, 'attKey')} value={data.attKey} />
                    <Input onChange={handleChange.bind(this, 'attVal')} value={data.attVal} />
                </Row>
                <Row>
                    <Input onChange={handleChange.bind(this, 'json')} value={data.json} id="json" type="textarea" placeholder={sampleJson}/>
                    {data.json && (<SyntaxHighlighter language="json" style={docco}>
                        {formatJson(data.json)}
                    </SyntaxHighlighter>)}
                </Row>
                <Row>
                    <Button  onClick={sendToTopic} >Send to topic</Button>
                </Row>
                <Row>
                    <Button  onClick={createTopic} >Create topic</Button>
                </Row>
                <Row>
                    <Button onClick={subscribe}>Subscribe</Button>
                </Row>
                <Row>
                    {history.map(h => {
                        return (
                            <a onClick={() => updateData({...data, json: h.payload})}>{h.id} - {h.payload.substring(0, 10)}...</a>
                        )
                    })}
                </Row>
                <Row>
                    {subs.map(sub => {
                        return (
                            <div>
                                <Label>{sub.topicId}</Label>
                                <SyntaxHighlighter language="json" style={docco}>
                                    {JSON.stringify(sub.messages, null, 2)}
                                </SyntaxHighlighter>
                            </div>
                        )
                    })}
                    <Input type="textarea" id="messages" />

                </Row>
            </Col>
        </div>
    );
}

export default App;
