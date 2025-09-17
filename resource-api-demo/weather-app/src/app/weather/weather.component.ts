// import { Component, inject, signal } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { rxResource } from '@angular/core/rxjs-interop';
// import { NgIf, NgFor, JsonPipe } from '@angular/common';

// @Component({
//   selector: 'app-weather',
//   standalone: true,
//   imports: [NgIf, NgFor,JsonPipe],
//   template: `
//     <h2>🌤️ City Weather Info</h2>

//     <!-- Dropdown for quick cities -->
//     <!-- <label>
//       Select City:
//       <select [value]="selectedCity()" (change)="onCityChange($event)">
//         <option *ngFor="let city of cityNames" [value]="city">{{ city }}</option>
//       </select>
//     </label> -->

//     <!-- Input for dynamic city search -->
//     <div style="margin-top:10px;">
//       <label>
//         Or enter a city:
//         <input type="text" (keyup.enter)="onCitySearch($event)" placeholder="Type and press Enter"/>
//       </label>
//     </div>

//     @if (weather.value(); as w) {
//       <div class="weather-card">
//         <h3>{{ currentCity() }} Weather</h3>
//         <p>🌡️ Temperature: {{ w.current_weather.temperature }} °C</p>
//         <p>💨 Windspeed: {{ w.current_weather.windspeed }} km/h</p>
//         <p>🧭 Wind Direction: {{ w.current_weather.winddirection }}°</p>
//         <p>⏰ Time: {{ w.current_weather.time }}</p>
//       </div>
//     } 
//     @else if (weather.isLoading()) {
//       <p>Loading weather data...</p>
//     } 
//     @else if (weather.error()) {
//       <p>❌ Error: {{ weather.error() | json }}</p>
//     }
//   `,
//   styles: [`
//     .weather-card {
//       margin-top: 10px;
//       padding: 10px;
//       border: 1px solid #ccc;
//       border-radius: 8px;
//       width: 250px;
//     }
//     select, input {
//       margin-left: 8px;
//       padding: 4px;
//     }
//   `]
// })
// export class WeatherComponent {
//   private http = inject(HttpClient);

//   // Predefined city list
//   cities: Record<string, { lat: number; lon: number }> = {
//     Pune: { lat: 18.5204, lon: 73.8567 },
//     Jalgaon: { lat: 21.0077, lon: 75.5626 },
//     Mumbai: { lat: 19.0760, lon: 72.8777 },
//     Delhi: { lat: 28.6139, lon: 77.2090 }
//   };

//   cityNames = Object.keys(this.cities);
//   selectedCity = signal<string>('Pune');
//   currentCity = signal<string>('Pune');

//   weather = rxResource({
//     loader: () => {
//       const c = this.cities[this.selectedCity()];
//       return this.http.get<any>(
//         `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current_weather=true`
//       );
//     }
//   });

//   // When dropdown is used
//   onCityChange(event: Event) {
//     const value = (event.target as HTMLSelectElement).value;
//     this.selectedCity.set(value);
//     this.currentCity.set(value);
//     this.weather.reload();
//   }

//   // When user types a city
//   onCitySearch(event: Event) {
//     const value = (event.target as HTMLInputElement).value.trim();
//     if (!value) return;

//     // Call geocoding API to get lat/lon for typed city
//     this.http.get<any>(
//       `https://geocoding-api.open-meteo.com/v1/search?name=${value}&count=1`
//     ).subscribe(res => {
//       if (res && res.results && res.results.length > 0) {
//         const result = res.results[0];
//         // Dynamically add city coords
//         this.cities[value] = { lat: result.latitude, lon: result.longitude };
//         this.selectedCity.set(value);
//         this.currentCity.set(value);
//         this.weather.reload();
//       } else {
//         alert("❌ City not found. Try again.");
//       }
//     });
//   }
// }


import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { resource } from '@angular/core';  
import { NgIf, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';


// ---- Define API Response Type ----
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
    <h2>🌤️ Weather App</h2>

    <label>
      Enter City:
      <input [(ngModel)]="cityName" placeholder="e.g. Pune, London, New York" />
      <button (click)="fetchWeather()">Get Weather</button>
    </label>

    @if (weather.value(); as w) {
      <div class="weather-card">
        <h3>{{ cityName }} Weather</h3>
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

  cityName = 'Pune';

  // ✅ Use resource instead of rxResource
  weather = resource({
    loader: async () => {
      const geo: any = await this.http.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.cityName}`
      ).toPromise();

      if (!geo.results?.length) {
        throw new Error('City not found');
      }

      const { latitude, longitude } = geo.results[0];
      return await this.http.get<WeatherResponse>(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      ).toPromise();
    }
  });

  fetchWeather() {
    this.weather.reload();
  }
}