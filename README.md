# Detectify-AI
# 🚀 Smart Object Interaction Dashboard

An AI-powered real-time object detection dashboard built with **TensorFlow.js**, **COCO-SSD**, and **Webcam API**.  
The system detects objects through your webcam and dynamically displays smart interaction widgets like study mode, hydration reminders, coding mode, distraction alerts, and more.

---

## ✨ Features

✅ Real-time object detection using COCO-SSD  
✅ Live webcam feed integration  
✅ FPS (Frames Per Second) monitoring  
✅ Bounding boxes with confidence scores  
✅ Smart widget-based interactions  
✅ Distraction detection (Phone alert)  
✅ Study mode with timer  
✅ Hydration reminders  
✅ Coding mode detection  
✅ Modern Glassmorphism UI design  
✅ Responsive dashboard interface  

---

## 🛠️ Tech Stack

- HTML5
- CSS3
- JavaScript (ES6)
- TensorFlow.js
- COCO-SSD Model
- Vite

---

## 📷 Detected Objects & Actions

| Object | Action |
|----------|---------|
| 👤 Person | User tracking activated |
| 📱 Cell Phone | Distraction alert |
| 💧 Bottle | Hydration reminder |
| 💻 Laptop | Coding mode |
| 📚 Book | Study mode + timer |
| ☕ Cup | Break reminder |

---

## 📂 Project Structure

```bash
Smart-Object-Dashboard/
│
├── index.html
├── style.css
├── main.js
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Installation & Setup

Clone the repository:

```bash
git clone https://github.com/your-username/smart-object-dashboard.git
```

Move into project directory:

```bash
cd smart-object-dashboard
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build project:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## 🎯 How It Works

1. Webcam access is requested.
2. TensorFlow.js loads the COCO-SSD model.
3. The model continuously scans webcam frames.
4. Detected objects are filtered by confidence score.
5. Smart widgets respond based on detected objects.
6. Bounding boxes and prediction confidence are displayed in real time.

---

## 🔮 Future Improvements

- Voice assistant integration
- Face recognition support
- Emotion detection
- Custom object training
- User analytics dashboard
- Productivity insights

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create your feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push changes

```bash
git push origin feature-name
```

5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

### ⭐ If you like this project, give it a star on GitHub!
