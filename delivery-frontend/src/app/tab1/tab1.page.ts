import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; // ✅ AGREGADO DE NUEVO
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router';
import { RestaurantService } from '../services/restaurant.service';
import type { RestaurantModel } from '../models/restaurant.model';
import { CITIES, City } from '../models/city.enum';
import { register } from 'swiper/element/bundle'; // ✅ DESCOMENTADO (PRUEBA 2)
import { addIcons } from 'ionicons';
import {
  search,
  searchOutline,
  locationOutline,
  sadOutline,
  chevronDownOutline,
  personCircleOutline,
} from 'ionicons/icons';

// Register icons
addIcons({
  search,
  searchOutline,
  locationOutline,
  sadOutline,
  chevronDownOutline,
  personCircleOutline,
});

register(); // ✅ DESCOMENTADO (PRUEBA 2)

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // ✅ AGREGADO DE NUEVO (PRUEBA 1)
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSelect,
    IonSelectOption,
    RouterLink,
  ],
})
export class Tab1Page implements ViewWillEnter {
  private restaurantsSvc = inject(RestaurantService);
  private router = inject(Router);

  list: RestaurantModel[] = [];
  selectedCategory: string | null = null; // name

  // City filter
  cities = CITIES;
  selectedCity: string = City.BAGUA;

  ionViewWillEnter(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.restaurantsSvc.list().subscribe({
      next: (r) => {
        this.list = r || [];
      },
      error: (err) => {
        console.error('Error loading restaurants:', err);
        this.list = [];
      },
    });
  }

  // Getter para categorías filtradas por ciudad
  get categories(): { id?: string; name: string }[] {
    // Primero filtrar por ciudad (solo restaurantes CON ciudad)
    const restaurantsByCity = this.selectedCity
      ? this.list.filter((r) => r.city === this.selectedCity)
      : this.list;

    // Luego obtener categorías únicas de esos restaurantes
    const isNonEmptyString = (v: unknown): v is string =>
      typeof v === 'string' && v.trim().length > 0;

    const categoryNames: string[] = restaurantsByCity
      .map((x) => x.category?.name ?? null)
      .filter(isNonEmptyString);

    const names: string[] = Array.from(new Set(categoryNames)).sort();

    return names.map((name: string) => ({ name }));
  }

  setFilter(name: string | null): void {
    this.selectedCategory = name;
  }

  navigateToRestaurant(id: string) {
    this.router.navigate(['/restaurant', id]);
  }

  // Getter para el carrusel - solo filtra por ciudad, NO por categoría
  get carouselRestaurants(): RestaurantModel[] {
    let result = this.list;

    // Filter by city
    if (this.selectedCity) {
      result = result.filter(
        (r: RestaurantModel) => r.city === this.selectedCity
      );
    }

    return result;
  }

  // Getter para el grid - filtra por ciudad Y categoría
  get filtered(): RestaurantModel[] {
    let result = this.list;

    // Filter by city (solo restaurantes con la ciudad exacta)
    if (this.selectedCity) {
      result = result.filter(
        (r: RestaurantModel) => r.city === this.selectedCity
      );
    }

    // Filter by category
    if (this.selectedCategory) {
      result = result.filter(
        (r: RestaurantModel) =>
          (r.category?.name ?? null) === this.selectedCategory
      );
    }

    return result;
  }
}
