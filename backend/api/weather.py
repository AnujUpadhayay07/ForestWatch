from datetime import date

import httpx


LOCATIONS = {
    "Los Angeles": {"latitude": 34.0522, "longitude": -118.2437},
    "San Francisco": {"latitude": 37.7749, "longitude": -122.4194},
    "Sacramento": {"latitude": 38.5816, "longitude": -121.4944},
    "San Diego": {"latitude": 32.7157, "longitude": -117.1611},
    "Redding": {"latitude": 40.5865, "longitude": -122.3917},
}


WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
}


def get_live_weather(location: str):
    if location not in LOCATIONS:
        raise ValueError("Please select a supported California location.")

    coordinates = LOCATIONS[location]

    params = {
        "latitude": coordinates["latitude"],
        "longitude": coordinates["longitude"],
        "current": (
            "temperature_2m,relative_humidity_2m,apparent_temperature,"
            "precipitation,weather_code,wind_speed_10m"
        ),
        "daily": (
            "weather_code,temperature_2m_max,temperature_2m_min,"
            "precipitation_sum,wind_speed_10m_max"
        ),
        "temperature_unit": "fahrenheit",
        "wind_speed_unit": "mph",
        "precipitation_unit": "inch",
        "timezone": "America/Los_Angeles",
        "past_days": 7,
        "forecast_days": 1,
    }

    try:
        response = httpx.get(
            "https://api.open-meteo.com/v1/forecast",
            params=params,
            timeout=20.0,
        )
        response.raise_for_status()
        data = response.json()

    except httpx.HTTPError as exc:
        raise RuntimeError("Unable to fetch weather data. Please try again later.") from exc

    current = data.get("current", {})
    daily = data.get("daily", {})
    daily_units = data.get("daily_units", {})

    dates = daily.get("time", [])
    today = date.today().isoformat()

    history = []

    for index, day in enumerate(dates):
        if day >= today:
            continue

        history.append({
            "date": day,
            "weather_code": daily["weather_code"][index],
            "condition": WEATHER_CODES.get(
                daily["weather_code"][index], "Unknown conditions"
            ),
            "max_temperature": daily["temperature_2m_max"][index],
            "min_temperature": daily["temperature_2m_min"][index],
            "precipitation": daily["precipitation_sum"][index],
            "max_wind_speed": daily["wind_speed_10m_max"][index],
        })

    history = history[-7:]

    if len(history) != 7:
        raise RuntimeError("Seven complete days of weather data are not available.")

    return {
        "location": location,
        "coordinates": coordinates,
        "timezone": data.get("timezone"),
        "current": {
            "temperature": current.get("temperature_2m"),
            "feels_like": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "precipitation": current.get("precipitation"),
            "wind_speed": current.get("wind_speed_10m"),
            "weather_code": current.get("weather_code"),
            "condition": WEATHER_CODES.get(
                current.get("weather_code"), "Unknown conditions"
            ),
            "time": current.get("time"),
        },
        "history": history,
        "units": {
            "temperature": "°F",
            "precipitation": daily_units.get("precipitation_sum", "inch"),
            "wind_speed": "mph",
        },
        "source": "Open-Meteo",
        "note": "Historical weather observations for exploration only. Not connected to the fire prediction model.",
    }
