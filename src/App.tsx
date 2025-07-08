import { useState } from 'react'
import TranslatorStart from "../src/Component/TranslatorStart"
import TranslatorApp from "../src/Component/TranslatorApp"

const App = () => {
  const [showTranslatorApp, setShowTranslatorApp] = useState(false)
  return (
    <div className="w-full h-screen bg-gradient-to-l from-[#b6f492] to-[#338b93] flex justify-center items-center">
      <div className="w-[90%] max-w-lg bg-[#2d2d2d] rounded-xl shadow-2xl shadow-gray-800 flex flex-col">
      
      {showTranslatorApp ? (

        <TranslatorApp onClose={() =>
           setShowTranslatorApp(false)} />
      ): (
        <TranslatorStart onStart ={() => setShowTranslatorApp(true)} />
      )}
      </div>
    </div>
  )
}

export default App