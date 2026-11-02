# ForestWatch 🌲

ForestWatch is a machine learning project that explores next-day fire-start prediction using historical California weather and fire data.

It combines a React frontend, a FastAPI backend, and a Random Forest classification model.

> **Disclaimer:** This project is for educational purposes. It is not an official wildfire warning system and should not be used for emergency decisions.

## Features

- Forest-inspired web interface.
- Next-day fire-start prediction from weather inputs.
- Machine learning using a Random Forest classifier.
- FastAPI prediction and health-check endpoints.
- Separate frontend and backend.
- Historical dataset analysis and model evaluation.

## Tech Stack

**Frontend**
- React
- Vite
- React Router

**Backend**
- Python
- FastAPI
- Pydantic

**Machine Learning**
- pandas
- NumPy
- scikit-learn
- joblib

## Project Structure

```text
ForestWatch/
├── backend/
│   └── api/
│       └── main.py
├── data/
│   ├── CA_Weather_Fire_Dataset_1984-2025.csv
│   └── next_day_fire_dataset.csv
├── frontend/
│   ├── src/
│   ├── package.json
│   └── index.html
├── models/
│   ├── forest_fire_model.pkl
│   └── forest_fire_baseline.pkl
├── output/
├── train_model.py
├── predict.py
├── save_model.py
├── evaluate_saved_model.py
└── README.md
```

The project also contains additional data-validation files and analysis scripts.

## Requirements

- Python 3.13 recommended for the current development setup.
- Node.js and npm.
- Project virtual environment and required Python packages.
- Dataset and trained model files.

## Installation and Setup

### 1. Start the Backend

Open PowerShell in the project folder:

```powershell
Set-Location "$HOME\Desktop\ForestWatch"
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.api.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URL: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

### 2. Start the Frontend

Open a second PowerShell terminal:

```powershell
Set-Location "$HOME\Desktop\ForestWatch\frontend"
npm install
npm run dev
```

Open the local URL displayed by Vite, usually http://localhost:5173.

## Application Pages

- `/` — Home page
- `/predict` — Fire prediction page
- `/future-updates` — Future updates page

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Checks whether the API is running |
| GET | `/api/health` | Checks API health and model-file availability |
| POST | `/api/predict` | Generates a next-day prediction |

The prediction API accepts previous-day precipitation, maximum and minimum temperature, average wind speed, previous seven-day weather summaries, target month, and target day of year.

**Units:** Temperature is in Fahrenheit, precipitation in inches, and wind speed in miles per hour.

## Machine Learning Workflow

The training script uses `data/next_day_fire_dataset.csv` and predicts the `FIRE_START_DAY` target.

The dataset is sorted by date. The current training script uses:
- Records before 1 January 2020 for training.
- Records from 1 January 2020 onward for testing.

The feature set includes previous-day weather measurements, previous seven-day weather summaries, and calendar features.

The training workflow evaluates classification performance using metrics such as accuracy, balanced accuracy, precision, recall, F1-score, average precision, and ROC-AUC.

## Dataset

The project includes the *California Weather and Fire Prediction Dataset (1984–2025) with Engineered Features*, published on Zenodo, along with a derived next-day dataset and supporting validation files.

Historical fire labels and weather observations may not always align perfectly. Dataset quality and label accuracy can affect predictions, so results should be interpreted carefully.

## Limitations

- Predictions follow the dataset's target definition.
- A predicted label is not a confirmed real-world fire event or a calibrated fire probability.
- Historical test performance does not guarantee future accuracy.
- The application does not replace official fire-risk assessments or emergency services.

## Future Improvements

- Improve historical fire-label validation.
- Compare additional machine learning algorithms.
- Add clearer model evaluation charts.
- Explain which input factors influence a prediction.
- Explore reliable, current weather and fire data integrations.

## Academic Purpose

ForestWatch demonstrates data preparation, machine learning, model evaluation, API development, and frontend integration as part of an educational project.
