import { Component, inject, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { NgIf, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WeatherResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    time: string;
  };
}

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [NgIf, JsonPipe, FormsModule],
  template: `
    <h2>🌤️ Weather App (httpResource)</h2>

    <label>
      Enter City:
      <input [ngModel]="cityName()" (ngModelChange)="cityName.set($event)" 
             placeholder="e.g. Pune, London, New York" />
      <button (click)="fetchWeather()">Get Weather</button>
    </label>

    @if (weather.value(); as w) {
      <div class="weather-card">
        <h3>{{ cityName() }} Weather</h3>
        <p>🌡️ Temperature: {{ w.current_weather.temperature }} °C</p>
        <p>💨 Windspeed: {{ w.current_weather.windspeed }} km/h</p>
        <p>🧭 Wind Direction: {{ w.current_weather.winddirection }}°</p>
        <p>⏰ Time: {{ w.current_weather.time }}</p>
      </div>
    } @else if (weather.isLoading()) {
      <p>⏳ Loading weather data...</p>
    } @else if (weather.error()) {
      <p>❌ Error: {{ weather.error() | json }}</p>
    }
  `,
  styles: [`
    .weather-card {
      margin-top: 10px;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 8px;
      width: 260px;
    }
    input, button {
      margin-left: 6px;
      padding: 4px;
    }
  `]
})
export class WeatherComponent {
  private http = inject(HttpClient);

  cityName = signal('Pune');
  private coords = signal<{ lat: number; lon: number } | null>(null);

  // ✅ httpResource requires { url }
  weather = httpResource<WeatherResponse>(() => {
    if (!this.coords()) return undefined;
    const { lat, lon } = this.coords()!;
    return {
      url: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    };
  });

  async fetchWeather() {
    const geo: any = await this.http
      .get(`https://geocoding-api.open-meteo.com/v1/search?name=${this.cityName()}&count=1`)
      .toPromise();

    if (!geo?.results?.length) {
      throw new Error('City not found');
    }

    const { latitude, longitude } = geo.results[0];
    this.coords.set({ lat: latitude, lon: longitude });

    // ✅ trigger reload now that coords changed
    this.weather.reload();
  }
}
