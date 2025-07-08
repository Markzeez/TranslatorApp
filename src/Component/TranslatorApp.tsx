import { useState, useRef, useEffect } from 'react'
import { languages } from '../languagesData'
import { X, RefreshCw, ChevronDown, Mic, Volume2 } from 'lucide-react'

// Extend Window interface to include SpeechRecognition types for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TranslatorAppProps {
  onClose: () => void
}

const TranslatorApp: React.FC<TranslatorAppProps> = ({ onClose }) => {
  const [selectedLanguageFrom, setSelectedLanguageFrom] = useState<string>('en')
  const [selectedLanguageTo, setSelectedLanguageTo] = useState<string>('en')
  const [showLanguages, setShowLanguages] = useState<boolean>(false)
  const [currentLanguageSelection, setCurrentLanguageSelection] = useState<'from' | 'to' | null>(null)
  const [inputText, setInputText] = useState<string>('')
  const [translatedText, setTranslatedText] = useState<string>('')
  const [charCount, setCharCount] = useState<number>(0)
  const [isListening, setIsListening] = useState<boolean>(false)

  const maxChars = 200
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Add SpeechRecognition type for TypeScript
  type SpeechRecognitionType = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;
  type SpeechRecognitionInstance = InstanceType<SpeechRecognitionType> | null;
  
    const recognitionRef = useRef<SpeechRecognitionInstance>(null)

  const getLanguageName = (code: keyof typeof languages | string): string => {
    return languages[code as keyof typeof languages] ?? code.toUpperCase()
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setShowLanguages(false)
    }
  }

  useEffect(() => {
    if (showLanguages) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguages])

  const handleLanguageClick = (type: 'from' | 'to') => {
    setCurrentLanguageSelection(type)
    setShowLanguages(true)
  }

  const handleLanguagesSelect = (languageCode: string) => {
    if (currentLanguageSelection === 'from') {
      setSelectedLanguageFrom(languageCode)
    } else if (currentLanguageSelection === 'to') {
      setSelectedLanguageTo(languageCode)
    }
    setShowLanguages(false)
  }

  const handleSwapLanguages = () => {
    setSelectedLanguageFrom(selectedLanguageTo)
    setSelectedLanguageTo(selectedLanguageFrom)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxChars) {
      setInputText(value)
      setCharCount(value.length)
    }
  }

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setTranslatedText('')
      return
    }

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          inputText,
        )}&langpair=${selectedLanguageFrom}|${selectedLanguageTo}`,
      )
      const data = await response.json()
      setTranslatedText(data.responseData.translatedText)
    } catch (error) {
      console.error('Translation failed:', error)
      setTranslatedText('Error occurred during translation.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTranslate()
    }
  }

  const handleSpeechInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = selectedLanguageFrom
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputText(transcript)
      setCharCount(transcript.length)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.start()
    recognitionRef.current = recognition
  }

  const handleSpeak = () => {
    if (!translatedText) return
    const utterance = new SpeechSynthesisUtterance(translatedText)
    utterance.lang = selectedLanguageTo
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="w-full flex flex-col gap-y-4 justify-center items-center px-6 sm:px-8 pt-12 pb-6 relative">
      <button className="absolute top-4 right-4" onClick={onClose}>
        <X className="w-5 h-5 text-gray-300" />
      </button>

      <div className="flex items-center gap-4">
        <div className="language cursor-pointer" onClick={() => handleLanguageClick('from')}>
          {getLanguageName(selectedLanguageFrom)}
        </div>
        <RefreshCw className="w-6 h-6 cursor-pointer" onClick={handleSwapLanguages} />
        <div className="language cursor-pointer" onClick={() => handleLanguageClick('to')}>
          {getLanguageName(selectedLanguageTo)}
        </div>
      </div>

      {showLanguages && (
        <div
          className="w-[calc(100%-4rem)] h-[calc(100%-9rem)] bg-gradient-to-r from-[#b6f492] to-[#338b93] absolute top-32 left-8 z-10 rounded shadow-lg p-4 overflow-y-scroll scrollbar-hide"
          ref={dropdownRef}
        >
          <ul>
            {Object.entries(languages).map(([code, name]) => (
              <li
                key={code}
                className="cursor-pointer hover:bg-[#10646b] transition duration-200 p-2 rounded"
                onClick={() => handleLanguagesSelect(code)}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="w-full relative">
        <textarea
          className="textarea text-gray-200 border-white"
          value={inputText}
          rows={4}
          cols={50}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        ></textarea>
        <div className="absolute bottom-2 right-4 text-gray-400">
          {charCount}/{maxChars}
        </div>
        <button
          className="absolute bottom-2 left-2 text-gray-400"
          onClick={handleSpeechInput}
          title="Speak"
        >
          <Mic className={`w-5 h-5 ${isListening ? 'text-green-400 animate-pulse' : ''}`} />
        </button>
      </div>

      <button
        className="w-12 h-12 bg-gradient-to-r from-[#b6f492] to-[#338b93] rounded-full text-2xl text-gray-600 flex justify-center items-center active:translate-y-[1px]"
        onClick={handleTranslate}
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      <div className="w-full relative">
        <textarea
          className="textarea text-[#b6f492] border-white"
          value={translatedText}
           rows={4}
          cols={50}
          readOnly
        ></textarea>
        <button
          className="absolute bottom-2 left-2 text-[#b6f492]"
          onClick={handleSpeak}
          title="Play Translation"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default TranslatorApp