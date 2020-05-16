import React, { Fragment, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useHistory,
  useLocation
} from "react-router-dom";
import { Home } from '@streaming/pages'

function StartPage(props) {
  const { status } = props;
  switch (status) {
    case true:
      return (<Switch>
        <Redirect exact from="/" to="/home" />
        <Route to="/home">
          <Home />
        </Route>
      </Switch>)
      break;
    case false:
      return (
        <Switch >
          <Redirect exact from="/" to="/login" />
          <Route path="/login">
            {/* <Login /> */}
          </Route>
        </Switch>
      )
      break;
    default: return (<Fragment></Fragment>)
      break;
  }
}

function App() {
  const [status, setStatus] = useState(true)
  return (
    <Router>
      <StartPage status={status}/>
    </Router>

  );
}

export default App;
