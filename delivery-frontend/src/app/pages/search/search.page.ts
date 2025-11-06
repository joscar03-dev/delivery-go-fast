import {
  Component,
  OnInit,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonSearchbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';
import type { RestaurantModel } from '../../models/restaurant.model';
import { addIcons } from 'ionicons';
import { locationOutline, restaurantOutline, sadOutline } from 'ionicons/icons';

addIcons({
  'location-outline': locationOutline,
  'restaurant-outline': restaurantOutline,
  'sad-outline': sadOutline,
});

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonSearchbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class SearchPage implements OnInit {
  private restaurantsSvc = inject(RestaurantService);
  private router = inject(Router);

  allRestaurants: RestaurantModel[] = [];
  searchResults: RestaurantModel[] = [];
  searchQuery = '';
  loading = false;

  ngOnInit() {
    this.loadRestaurants();
  }

  loadRestaurants() {
    this.loading = true;
    this.restaurantsSvc.list().subscribe({
      next: (restaurants) => {
        this.allRestaurants = restaurants || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar restaurantes:', err);
        this.allRestaurants = [];
        this.loading = false;
      },
    });
  }

  onSearchChange(event: any) {
    const query = event?.target?.value?.trim().toLowerCase() || '';
    this.searchQuery = query;

    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    // Búsqueda simple por nombre
    this.searchResults = this.allRestaurants
      .filter((r) => r?.name?.toLowerCase().includes(query))
      .slice(0, 20);
  }

  navigateToRestaurant(id: string) {
    this.router.navigate(['/restaurant', id]);
  }
}
