import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import CardDatabase from "./components/Database";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);

  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOcrReady, setIsOcrReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");

  //tabs to swap between both the camera and database
  const [activeTab, setActiveTab] = useState("scanner");
  const [savedCards, setSavedCards] = useState(() => {
    const storedCards = localStorage.getItem("savedCards");
    return storedCards ? JSON.parse(storedCards) : [];
  });

  useEffect(() => {
    localStorage.setItem("savedCards", JSON.stringify(savedCards));
  }, [savedCards]);
   
  // Initialize Card values as placeholders for now, will be populated after OCR processing
  const [ cardDetails, setCardDetails ] = useState({
    cardName: "Monkey D. Luffy",
    cardSet: "OP05",
    Quantity: "1"
  });

  //Function to save the card from card details, will be used to save the card to the database in the future
  function saveCard() {
    const newCard = {
      name: cardDetails.cardName,
      set: cardDetails.cardSet,
      cost: cardDetails.cardCost,
      rarity: cardDetails.cardRarity,
      text: cardDetails.cardText,
    };
    setSavedCards(prevCards => [...prevCards, newCard]);
  }

  //Handling for the camera start up 
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setError("Could not access the camera.");
        console.error(err);
      }
    }

    //OCR Used to read the text on the card, will be used to populate the card details fields
    //Will be changed to GPT API in the future to better parse the text and extract relevant information
    async function loadOCR() {
      try {
        const worker = await createWorker("eng");

        await worker.setParameters({
          tessedit_char_whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:/.- ",
        });

        workerRef.current = worker;
        setIsOcrReady(true);
      } catch (err) {
        console.error("Error loading OCR:", err);
        setError("OCR failed to load.");
      }
    }

    // Cleanup function to stop the camera and terminate the OCR worker
    const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();

        tracks.forEach((track) => track.stop());

        videoRef.current.srcObject = null;
      }
    };
    

    //Process to start the camera and load the OCR worker when the component mounts
    startCamera();
    loadOCR();

    return () => {
      if (workerRef.current) {
            workerRef.current.terminate();
          }
        };
  }, []);

  async function captureCard() {
  if (!videoRef.current || !canvasRef.current) return;

  if (!workerRef.current) {
    setError("OCR is still loading. Try again in a few seconds.");
    return;
  }

  setIsProcessing(true);
  setText("");
  setError("");

  const video = videoRef.current;
  const canvas = canvasRef.current;
  const context = canvas.getContext("2d");

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (!videoWidth || !videoHeight) {
    setError("Camera is not ready yet. Try again in a moment.");
    setIsProcessing(false);
    return;
  }

  // Crop from the actual video size
  const cropWidth = videoWidth * 0.7;
  const cropHeight = videoHeight * 0.7;
  const cropX = videoWidth * 0.32;
  const cropY = videoHeight * 0.15;

  // Output size for OCR
  canvas.width = 600;
  canvas.height = 400;

  // Draw cropped video area into smaller canvas
  context.drawImage(
    video,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Image cleanup
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Convert to grayscale
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Increase contrast without forcing pure black/white
    gray = (gray - 128) * 1.5 + 128;

    // Clamp value between 0 and 255
    gray = Math.max(0, Math.min(255, gray));

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  context.putImageData(image, 0, 0);

  const imageData = canvas.toDataURL("image/png");

  setCapturedImage(imageData);

  try {
    const result = await workerRef.current.recognize(imageData);
    setText(result.data.text);
  } catch (err) {
    console.error("Error processing OCR:", err);
    setError("Error processing the card. Please try again.");
  }

  setIsProcessing(false);
}


//Frontend deployed
  return (
    <div className="app-container">

      <div className="tabs">
        <button
          className={activeTab === "scanner" ? "tab active" : "tab"}
          onClick={() => setActiveTab("scanner")}
        >
          Scanner
        </button>

        <button
          className={activeTab === "database" ? "tab active" : "tab"}
          onClick={() => setActiveTab("database")}
        >
          Database
        </button>
      </div>
      
      {activeTab === "scanner" && (
        <div className="scanner-section">
          <div className="video-container">
        <h1>Card Scanner</h1>

        {error && <p className="error">{error}</p>}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera"
        />

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <button onClick={captureCard} disabled={isProcessing || !isOcrReady}>
          {isProcessing ? "Scanning..." : "Scan Text"}
        </button>

        {capturedImage && (
        <div className="capture-preview">
          <h2>Captured Image</h2>
          <img src={capturedImage} alt="Captured card preview" width="300" />
        </div>
        )}
        
        {/* Display OCR result (Remove later, this is in use for debugging) */}
        <div className="result-box">
          <h2>Detected Text</h2>
          <pre>{text}</pre>
        </div>
      </div>

      <div className="info-container">
        <div className="field-group">
          <label>Card Name</label>
          <input type="text" 
          value={text}
          placeholder="Waiting for scan..."
          onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label>Set</label>
          <input type="text" 
          value={cardDetails.cardSet}
          placeholder="Waiting for scan..." 
          onChange={(e) => setCardDetails({ ...cardDetails, cardSet: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label>Cost</label>
          <input type="text" 
          value={cardDetails.cardCost}
          placeholder="Waiting for scan..."
          onChange={(e) => setCardDetails({ ...cardDetails, cardCost: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label>Rarity</label>
          <input type="text" 
          value={cardDetails.cardRarity}
          placeholder="Waiting for scan..." 
          onChange={(e) => setCardDetails({ ...cardDetails, cardRarity: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label>Text</label>
          <input type="text" 
          value={cardDetails.cardText}
          placeholder="Waiting for scan..." 
          onChange={(e) => setCardDetails({ ...cardDetails, cardText: e.target.value })}
          />
        </div>

        <button onClick={saveCard}> Save Card </button>

      </div>
        </div>
      )}

      {activeTab === "database" && (
        <div className="database-section">
          <CardDatabase savedCards={savedCards} />
        </div>
      )}

      
    </div>
  );
}

export default App;