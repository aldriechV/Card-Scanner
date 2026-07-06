import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import CardDatabase from "./components/Database";
import "./component-css/App.css";

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

  // Initialize Card values as placeholders for now, will be populated after OCR processing
  const [ cardDetails, setCardDetails ] = useState({
    cardName: "Monkey D. Luffy",
    cardSet: "OP05",
    quantity: 1
  });

  //Save Cards into a local storage
  useEffect(() => {
    localStorage.setItem("savedCards", JSON.stringify(savedCards));
  }, [savedCards]);

  //Function to start the camera, includes error handling
  const startCamera = async () => {
  try {
    setError("");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
      },
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    } catch (err) {
      console.error(err);
      setError("Could not access camera.");
    }
  };  

  // Cleanup function to stop the camera and terminate the OCR worker
  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();

        tracks.forEach((track) => track.stop());

        videoRef.current.srcObject = null;
      }
  };
  
  //OCR Used to read the text on the card, will be used to populate the card details fields
  //Will be changed to GPT API in the future to better parse the text and extract relevant information
  const loadOCR = async () => {

    //Added to handle if OCR already exists
    if (workerRef.current) {
      setIsOcrReady(true);
      return;
    }

      try {
        setIsOcrReady(false);

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
        setIsOcrReady(false);
      }
  };

  //Control Camera when switching tabs
  useEffect(() => {
    if (activeTab === "scanner") {
      startCamera();
      loadOCR();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  //Function to save the card from card details, will be used to save the card to the database in the future
  function saveCard() {
    const newCard = {
      name: cardDetails.cardName.trim(),
      set: cardDetails.cardSet.trim(),
      quantity: Number(cardDetails.quantity) || 1,
      dateScanned: new Date().toLocaleString(),
    };

    setSavedCards((prevCards) => {
      const existingCardIndex = prevCards.findIndex(
        (card) =>
          card.name.toLowerCase() === newCard.name.toLowerCase() &&
          card.set.toLowerCase() === newCard.set.toLowerCase()
      );

      if (existingCardIndex !== -1) {
        return prevCards.map((card, index) => {
          if (index === existingCardIndex) {
            return {
              ...card,
              quantity: Number(card.quantity || 1) + newCard.quantity,
              dateScanned: new Date().toLocaleString(),
            };
          }

          return card;
        });
      }

      return [...prevCards, newCard];
    });
  }


  function clearCardDatabase() {
    setSavedCards([]);
    localStorage.removeItem("savedCards");
  }

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

      <header className="top-bar">
        <div className="top-bar-content">
          <div className="brand ">
            Card Scanner
          </div>

          <nav className="tabs">
            <button
              className={`tab ${activeTab === "scanner" ? "active" : ""}`}
              onClick={() => setActiveTab("scanner")}
            >
              Scanner
            </button>

            <button
              className={`tab ${activeTab === "database" ? "active" : ""}`}
              onClick={() => setActiveTab("database")}
            >
              Database
            </button>
          </nav>
        </div>
      </header>

        
        
      {activeTab === "scanner" && (
        <div className="scanner-section">
          <div className="video-container">

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
          value={cardDetails.cardName}
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
          <label>Quantity</label>
          <input type="number" 
          min="1"
          value={cardDetails.quantity}
          placeholder="Waiting for scan..." 
          onChange={(e) => setCardDetails({ ...cardDetails, quantity: e.target.value })}
          />
        </div>

        <button onClick={saveCard}> Save Card </button>

      </div>
        </div>
      )}

      {activeTab === "database" && (
        <div className="database-section">
          <CardDatabase 
          savedCards={savedCards}
          clearDatabase={clearCardDatabase}
          />
        </div>
      )}

      
    </div>
  );
}

export default App;