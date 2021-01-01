import React, { Fragment, useState, useRef, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import VideocamIcon from '@material-ui/icons/Videocam';
import GroupAddIcon from '@material-ui/icons/GroupAdd';
import Slide from '@material-ui/core/Slide';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    Redirect,
    useHistory,
    useLocation,
    useRouteMatch,
    useParams
} from "react-router-dom";
import Snackbar from '@material-ui/core/Snackbar';
import { FacebookProvider, ShareButton } from 'react-facebook';
import './lib/getHTMLMediaElement.css';

const keygen = require("keygenerator");
const RTCMultiConnection = require('rtcmulticonnection')
const getHTMLMediaElement = require('./lib/getHTMLMediaElement');
const DetectRTC = require('detectrtc');




const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

function SlideTransition(props) {
    return <Slide {...props} direction="up" />;
}



function Home() {
    const [open, setOpen] = React.useState({
        create: false,
        join: false
    });
    const [err, setErr] = useState(false)
    const [key, setKey] = useState("")
    const history = useHistory()
    let { url } = useRouteMatch();

    const [transition, setTransition] = React.useState(undefined);

    const refCreateStreaming = useRef(null);

    var connection = new RTCMultiConnection();

    connection.socketURL = 'https://server-streaming.herokuapp.com/';

    connection.socketMessageEvent = 'screen-sharing-demo';

    connection.session = {
        screen: true,
        oneway: true
    };

    connection.iceServers = [{
        'urls': [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun.l.google.com:19302?transport=udp',
        ]
    }];


    function Page() {
        // const {key_streaming} = useParams()

        // useEffect(()=> {
        //     var hashString = window.location.hash.replace('#', '');
        //     if (hashString.length && hashString.indexOf('comment-') == 0) {
        //         hashString = '';
        //     }

        //     var roomid = key;
        //     if (!roomid && hashString.length) {
        //         // roomid = hashString;
        //         connection.sdpConstraints.mandatory = {
        //             OfferToReceiveAudio: false,
        //             OfferToReceiveVideo: true
        //         };
        //         connection.join(hashString);
        //     }

        //     console.log(hashString);


        // })

        connection.videosContainer = document.getElementById('videos-container');

        console.log(document.getElementById('videos-container'));

        connection.onstream = function (event) {
            var existing = document.getElementById(event.streamid);
            if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
            }

            event.mediaElement.removeAttribute('src');
            event.mediaElement.removeAttribute('srcObject');
            // event.mediaElement.muted = true;
            // event.mediaElement.volume = 0;

            var video = document.createElement('video');

            try {
                video.setAttributeNode(document.createAttribute('autoplay'));
                video.setAttributeNode(document.createAttribute('playsinline'));
            } catch (e) {
                video.setAttribute('autoplay', true);
                video.setAttribute('playsinline', true);
            }

            // if (event.type === 'local') {
            //     video.volume = 0;
            //     try {
            //         video.setAttributeNode(document.createAttribute('muted'));
            //     } catch (e) {
            //         video.setAttribute('muted', true);
            //     }
            // }
            video.srcObject = event.stream;

            var width = window.innerWidth - 80;
            var mediaElement = getHTMLMediaElement(video, {
                title: event.userid,
                buttons: ['full-screen'],
                width: width,
                showOnMouseEnter: false
            });

            connection.videosContainer.appendChild(mediaElement);

            setTimeout(function () {
                mediaElement.media.play();
            }, 5000);

            mediaElement.id = event.streamid;
        };

        connection.onstreamended = function (event) {
            var mediaElement = document.getElementById(event.streamid);
            if (mediaElement) {
                mediaElement.parentNode.removeChild(mediaElement);

                if (event.userid === connection.sessionid && !connection.isInitiator) {
                    alert('Broadcast is ended. We will reload this page to clear the cache.');
                    window.location.reload();
                }
            }
        };

        connection.onMediaError = function (e) {
            if (e.message === 'Concurrent mic process limit.') {
                if (DetectRTC.audioInputDevices.length <= 1) {
                    alert('Please select external microphone. Check github issue number 483.');
                    return;
                }

                var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
                connection.mediaConstraints.audio = {
                    deviceId: secondaryMic
                };

                connection.join(connection.sessionid);
            }
        };

        return (
            <div id="videos-container" ></div>
        )
    }




    const handleClickOpen = (prop) => (event) => {
        setOpen({ ...open, [prop]: true });

    };

    const handleErrClose = () => {
        setErr(false);
    }

    const handleClickcCreate = (prop, Transition) => (event) => {
        setOpen({ ...open, [prop]: true });
        if (key !== "") {
            history.push(`home/streaming`)
            switch (prop) {
                case "create":
                    connection.open(key, function () {
                        // showRoomURL(connection.sessionid);
                        console.log('open room');

                    });
                    break;
                case "join":
                    connection.sdpConstraints.mandatory = {
                        OfferToReceiveAudio: false,
                        OfferToReceiveVideo: true
                    };
                    connection.join(key);
                    break;
                default: return (<Fragment></Fragment>)
                    break;
            }

        } else {
            setTransition(() => Transition);
            setErr(true);
        }

    };

    const handleClose = (prop) => (event) => {
        setOpen({ ...open, [prop]: false });
    };

    const KeyChange = (event) => {

        setKey(event.target.value)


    }


    function GenerateKey() {
        let _key = keygen._();
        setKey(_key)
        // console.log(_key);

    }

    useEffect(() => {
        console.log(window.location.hash.replace('#', ''));
        if (window.location.hash.replace('#', '') !== '') {
            setKey(window.location.hash.replace('#', ''))
            setOpen({ ...open, join: true })
        }
    }, [window.location.hash.replace('#', '')])


    return (
        <Switch>

            <Route exact path={`/home`}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: ' -webkit-fill-available',
                    backgroundColor: 'black',
                }}>
                    <div style={{
                        display: "grid"
                    }}>
                        <div style={{
                            display: "flex"
                        }}>
                            <h1 style={{
                                color: '#fb4545',
                                fontWeight: 900,
                                fontVariant: 'all-petite-caps',
                                fontSize: 'xxx-large',
                                marginRight: 22,

                            }}>Live </h1><h1 style={{
                                color: 'aqua',
                                fontWeight: 900,
                                fontVariant: 'all-petite-caps',
                                fontSize: 'xxx-large',
                            }}>Streaming Bata Test</h1></div>
                        <div style={{
                            display: "contents"
                        }}>
                            <Button
                                ref={refCreateStreaming}
                                size="large"
                                variant="contained"
                                style={{
                                    backgroundColor: '#000000',
                                    color: 'white',
                                    margin: 15
                                }}
                                startIcon={<VideocamIcon />}
                                onClick={handleClickOpen('create', SlideTransition)}
                            > Create Streaming</Button>
                        </div>
                        <div style={{
                            display: "contents"
                        }}>
                            <Button
                                size="large"
                                variant="contained"
                                style={{
                                    backgroundColor: '#000000',
                                    color: 'white',
                                    margin: 15
                                }}
                                onClick={handleClickOpen('join')}
                                startIcon={<GroupAddIcon />}
                            >Join Streaming</Button>
                        </div>
                    </div>
                    <Dialog
                        open={open.create}
                        TransitionComponent={Transition}
                        keepMounted
                        onClose={handleClose}
                        aria-labelledby="alert-dialog-slide-title"
                        aria-describedby="alert-dialog-slide-description"
                    >
                        <DialogTitle id="alert-dialog-slide-title">{"Create key streaming"}</DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-slide-description">
                                <div style={{
                                    display: "grid"
                                }}>
                                    <TextField id="key-streaming" label="key" value={key} onChange={KeyChange} style={{
                                        width: 315
                                    }} />
                                    <Button style={{
                                        margin: '15px 70px'
                                    }} variant="contained" onClick={GenerateKey} color="primary"> generate key</Button>
                                </div>
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose('create')} color="primary">
                                Close </Button>
                            <Button onClick={handleClickcCreate('create')} color="primary">
                                Create </Button>
                        </DialogActions>
                    </Dialog>
                    <Dialog
                        open={open.join}
                        TransitionComponent={Transition}
                        keepMounted
                        onClose={handleClose}
                        aria-labelledby="alert-dialog-slide-title"
                        aria-describedby="alert-dialog-slide-description"
                    >
                        <DialogTitle id="alert-dialog-slide-title">{"Join key streaming"}</DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-slide-description">
                                <div style={{
                                    display: "grid"
                                }}>
                                    <TextField id="key-streaming" label="key" value={key} onChange={KeyChange} style={{
                                        width: 315
                                    }} />
                                </div>
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose('join')} color="primary">
                                Close</Button>
                            <Button onClick={handleClickcCreate('join', SlideTransition)} color="primary">
                                Join</Button>
                        </DialogActions>
                    </Dialog>
                    <Snackbar
                        open={err}
                        onClose={handleErrClose}
                        TransitionComponent={transition}
                        message="ไม่มี key"
                    />
                </div>
            </Route>

            <Route path={`/home/streaming`}>
                <Page />
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    display: 'flex',
                    width: '-webkit-fill-available',
                    justifyContent: 'center',
                    alignItems: "center"
                }}>
                    {/* <h3 style={{

                        marginRight: 10
                    }}>Share: </h3> */}

                    <FacebookProvider appId="184647419395707">
                        <ShareButton href={`${window.location.hostname}/home#${key}`}>
                            Facebook Share
        </ShareButton>
                    </FacebookProvider>
                </div>
            </Route>


        </Switch>
    )
}

export default Home;