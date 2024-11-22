import React, { useRef, useState } from 'react';

const ImageProcessor = () => {
  const [image, setImage] = useState(null);
  const [value, setValue] = useState(0);
  const canvasRef = useRef(null);

  const loadImage = (event) => {
    const file = event.target.files[0];
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  };

  const adjustBrightness = (amount) => {
    if (!image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(data[i] + amount, 255);     // Red
      data[i + 1] = Math.min(data[i + 1] + amount, 255); // Green
      data[i + 2] = Math.min(data[i + 2] + amount, 255); // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const applyOperation = (operation, value) => {
    if (!image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      if (operation === "add") {
        data[i] = Math.min(data[i] + value, 255);     // Red
        data[i + 1] = Math.min(data[i + 1] + value, 255); // Green
        data[i + 2] = Math.min(data[i + 2] + value, 255); // Blue
      } else if (operation === "subtract") {
        data[i] = Math.max(data[i] - value, 0);       // Red
        data[i + 1] = Math.max(data[i + 1] - value, 0);   // Green
        data[i + 2] = Math.max(data[i + 2] - value, 0);   // Blue
      } else if (operation === "multiply") {
        data[i] = Math.min(data[i] * value, 255);     // Red
        data[i + 1] = Math.min(data[i + 1] * value, 255); // Green
        data[i + 2] = Math.min(data[i + 2] * value, 255); // Blue
      } else if (operation === "divide") {
        data[i] = Math.min(data[i] / value, 255);     // Red
        data[i + 1] = Math.min(data[i + 1] / value, 255); // Green
        data[i + 2] = Math.min(data[i + 2] / value, 255); // Blue
      }
    }
  
    ctx.putImageData(imageData, 0, 0);
  };
  
  
  const applyGrayscale = (method) => {
    if (!image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      let gray;
      if (method === "average") {
        gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      } else if (method === "luminosity") {
        gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      data[i] = gray; // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
    }
  
    ctx.putImageData(imageData, 0, 0);
  };

  const convolve = (imageData, kernel) => {
    const { width, height, data } = imageData;
    const output = new Uint8ClampedArray(data.length);
    const half = Math.floor(kernel.length / 2);
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0;
  
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const iy = y + ky;
            const ix = x + kx;
  
            if (iy >= 0 && iy < height && ix >= 0 && ix < width) {
              const i = (iy * width + ix) * 4;
              const weight = kernel[ky + half][kx + half];
  
              r += data[i] * weight;
              g += data[i + 1] * weight;
              b += data[i + 2] * weight;
            }
          }
        }
  
        const index = (y * width + x) * 4;
        output[index] = Math.min(Math.max(r, 0), 255); // Red
        output[index + 1] = Math.min(Math.max(g, 0), 255); // Green
        output[index + 2] = Math.min(Math.max(b, 0), 255); // Blue
        output[index + 3] = data[index + 3]; // Alpha
      }
    }
    return new ImageData(output, width, height);
  };
  
  const smoothingKernel = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ].map(row => row.map(value => value / 9)); // Normalizacja
  
  const applySmoothing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const smoothedData = convolve(imageData, smoothingKernel);
    ctx.putImageData(smoothedData, 0, 0);
  };

  const applyMedianFilter = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { width, height, data } = imageData;
    const output = new Uint8ClampedArray(data.length);
    const size = 3; // Rozmiar maski
    const half = Math.floor(size / 2);
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const reds = [];
        const greens = [];
        const blues = [];
  
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const iy = y + ky;
            const ix = x + kx;
  
            if (iy >= 0 && iy < height && ix >= 0 && ix < width) {
              const i = (iy * width + ix) * 4;
              reds.push(data[i]);
              greens.push(data[i + 1]);
              blues.push(data[i + 2]);
            }
          }
        }
  
        reds.sort((a, b) => a - b);
        greens.sort((a, b) => a - b);
        blues.sort((a, b) => a - b);
  
        const medianIndex = Math.floor(reds.length / 2);
        const index = (y * width + x) * 4;
  
        output[index] = reds[medianIndex];
        output[index + 1] = greens[medianIndex];
        output[index + 2] = blues[medianIndex];
        output[index + 3] = data[index + 3]; // Alpha
      }
    }
  
    ctx.putImageData(new ImageData(output, width, height), 0, 0);
  };

  
  const sobelX = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  const sobelY = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  const applySobelFilter = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const gradientX = convolve(imageData, sobelX);
    const gradientY = convolve(imageData, sobelY);
  
    const { width, height, data: dataX } = gradientX;
    const { data: dataY } = gradientY;
    const output = new Uint8ClampedArray(dataX.length);
  
    for (let i = 0; i < dataX.length; i += 4) {
      const magnitude = Math.sqrt(
        dataX[i] ** 2 + dataY[i] ** 2
      );
      output[i] = output[i + 1] = output[i + 2] = Math.min(Math.max(magnitude, 0), 255);
      output[i + 3] = dataX[i + 3]; // Alpha
    }
  
    ctx.putImageData(new ImageData(output, width, height), 0, 0);
  };

  const gaussianKernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ].map(row => row.map(value => value / 16));

  const applyGaussianBlur = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const blurredData = convolve(imageData, gaussianKernel);
    ctx.putImageData(blurredData, 0, 0);
  };
  
  return (
    <div>
      <h1>Przetwarzanie obrazu</h1>
      <input type="file" onChange={loadImage} />
      <div>
        <label>
          Wartość:
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <input 
        type="range"
        min="-100"
        max="100"
        value={value}
        onChange={(e) => {
          setValue(Number(e.target.value));
          adjustBrightness(Number(e.target.value));
        }}/>
        <button onClick={() => applyOperation("add", value)}>Dodaj</button>
        <button onClick={() => applyOperation("subtract", value)}>Odejmij</button>
        <button onClick={() => applyOperation("multiply", value)}>Pomnóż</button>
        <button onClick={() => applyOperation("divide", value)}>Podziel</button>
      </div>
      <div>
        <button onClick={applySmoothing}>Filtr Wygładzający</button>
        <button onClick={applyMedianFilter}>Filtr Medianowy</button>
        <button onClick={applySobelFilter}>Filtr Sobela</button>
        <button onClick={applyGaussianBlur}>Filtr Gausa</button>
      </div>
      <div>
        <button onClick={() => applyGrayscale("average")}>
          Skala szarości (średnia)
        </button>
        <button onClick={() => applyGrayscale("luminosity")}>
          Skala szarości (luminancja)
        </button>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default ImageProcessor;