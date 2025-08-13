import { BrowserRouter, Routes, Route } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Client from "./pages/Client";
import CreateKey from "./pages/CreateClient";
import ClientDetail from "./pages/ClientDetail";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="client" element={<Client />} />
          <Route path="client/:id" element={<ClientDetail />} />
          <Route path="client/create" element={<CreateKey />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
