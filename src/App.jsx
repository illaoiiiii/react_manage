import { useState } from 'react'
import './App.css'
import MyMap from "./components/MyMap.jsx";
import Header from "@/components/Header.jsx";
import {Route, Routes} from "react-router-dom";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        <Header/>
        <Routes>
            <Route path="/" element={<MyMap/>} />
            <Route path="/map" element={<MyMap />} />
        </Routes>

    </>
  )
}

export default App
