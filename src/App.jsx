import axios from "axios";
import { Route, Router } from "@solidjs/router";
import Workspace from "./pages/Workspace";

const App = () => {
  axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

  document.addEventListener('keydown', (e) => { if (e.key === 'Tab') e.preventDefault() });
  document.addEventListener('wheel', (e) => { e.preventDefault() }, {passive: false});
  document.addEventListener('dragover', (e) => { e.preventDefault() }, {passive: false});
  document.addEventListener('drop', (e) => { e.preventDefault() }, {passive: false});

  return (
    <Router>
      <Route path="/:id" component={Workspace} />
    </Router>
  );
};

export default App;
