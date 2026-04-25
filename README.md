# Swaryx 🎹

**Swaryx** is a swar-driven digital instrument for Hindustani classical music.

Unlike traditional piano apps, Swaryx maps your keyboard to **Sa Re Ga Ma Pa Dha Ni**, allowing you to play in any tonic, thaat, or swar configuration instantly — just like a real riyaaz instrument.

---

## ✨ Features

* 🎼 **Dynamic Tonic (Sa) Selection**
  Shift Sa to any note — the entire system adapts instantly.

* 🎛️ **Swar Controls (Komal / Shuddha / Teevra)**
  Fine-tune Re, Ga, Ma, Dha, Ni in real time.

* 🔁 **Bidirectional Thaat Sync**

  * Select a thaat → swars update
  * Change swars → thaat auto-detects

* 🧠 **Automatic Thaat Detection**
  Recognizes Bilawal, Asavari, Kafi, Bhairav, etc.

* 🎹 **Keyboard → Swar Mapping**
  Keys map to swars (not fixed notes):
  `q = Sa`, `w = Re`, `e = Ga`, ...

* 🎧 **Realistic Piano Sound (SF2)**
  Powered by WebAudioFont for expressive playback.

* 🏷️ **Accurate Swar Labels**
  Labels update dynamically based on tonic and swar configuration.

* 🎨 **Modern UI + Visual Feedback**
  Animated keys, glow effects, and color-coded swars.

---

## 🧠 Core Concept

```text
Key → Swar → Interval → Tonic → Note
```

Swaryx is built around the idea that **music is relative, not absolute**.

Instead of playing fixed notes, you play **relationships (swars)** — just like in Indian classical music.

---

## 🎼 Example

### Tonic = C

| Key | Swar | Output |
| --- | ---- | ------ |
| q   | Sa   | C      |
| w   | Re   | D / Db |
| e   | Ga   | E / Eb |

---

### Change to Tonic = D

| Key | Swar | Output |
| --- | ---- | ------ |
| q   | Sa   | D      |
| w   | Re   | E / Eb |

👉 Same keys, completely different scale — **musically correct behavior**

---

## 🚀 Getting Started

```bash
git clone https://github.com/<your-username>/swaryx.git
cd swaryx
npm install
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🧱 Tech Stack

* **Next.js (App Router)**
* **React**
* **TypeScript**
* **Web Audio API**
* **WebAudioFont (SF2 playback)**
* **CSS (custom UI styling)**

---

## 🎯 Vision

Swaryx aims to evolve into a complete **digital riyaaz system**:

* 🎵 Tanpura drone
* 🎼 Raga presets
* 🎤 Voice pitch detection
* 🧠 Intelligent feedback system

---

## 📸 Demo

> Add screenshots / GIFs here

---

## 🧑‍💻 Author

Built with intent and curiosity.

---

## ⭐ If you like this

Give it a star ⭐ — it helps a lot!
