import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
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
   
  // Initialize Card values as placeholders for now, will be populated after OCR processing
  const [ cardDetails, setCardDetails ] = useState({
    cardName: "Monkey D. Luffy",
    cardSet: "OP05",
    cardCost: "10",
    cardRarity: "SEC",
    cardText: 'When this card is played, draw 2 cards. If you have more than 5 cards in your hand, draw 3 cards instead.'
  });



  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError(
          "Unable to access the camera. Please allow camera access and try again."
        );
        console.error("Error accessing camera:", err);
      }
    }

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

  return (
    <div className="app-container">
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
        
        // Display OCR result (Remove later, this is in use for debugging) 
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

      </div>
    </div>
  );
}

export default App;