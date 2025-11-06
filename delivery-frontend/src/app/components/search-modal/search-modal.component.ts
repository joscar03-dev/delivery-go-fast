import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { RestaurantService } from '../../services/restaurant.service';
import type { RestaurantModel } from '../../models/restaurant.model';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { close, restaurant, sadOutline } from 'ionicons/icons';

addIcons({
  close,
  restaurant,
  'sad-outline': sadOutline,
});

interface SearchResult {
  restaurant: RestaurantModel;
  matchType: 'name' | 'category' | 'menuItem';
  matchedText?: string;
}

@Component({
  selector: 'app-search-modal',
  templateUrl: './search-modal.component.html',
  styleUrls: ['./search-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonIcon,
    IonSpinner,
  ],
})
export class SearchModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private restaurantSvc = inject(RestaurantService);
  private router = inject(Router);

  searchQuery = '';
  searchResults: SearchResult[] = [];
  allRestaurants: RestaurantModel[] = [];
  loading = false;
  private searchTimeout: any;

  ngOnInit() {
    console.log('SearchModal: Inicializando');
    this.loadRestaurants();
  }

  private loadRestaurants() {
    this.loading = true;
    this.restaurantSvc.list().subscribe({
      next: (restaurants) => {
        this.allRestaurants = restaurants || [];
        this.loading = false;
        console.log(
          'SearchModal: Restaurantes cargados:',
          this.allRestaurants.length
        );
      },
      error: (err) => {
        console.error('SearchModal: Error al cargar restaurantes:', err);
        this.allRestaurants = [];
        this.loading = false;
      },
    });
  }

  // NUEVO: Método simple con input HTML normal
  onSearchKeyup(value: string) {
    console.log('SearchModal: Keyup event, valor:', value);

    // Limpiar timeout anterior
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    const query = value.trim().toLowerCase();
    this.searchQuery = query;

    // Si muy corto, limpiar
    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    // Timeout para evitar búsquedas mientras escribe
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  private performSearch(query: string) {
    console.log('=== BÚSQUEDA ===', query);

    this.searchResults = this.allRestaurants
      .filter((r) => r?.name?.toLowerCase().includes(query))
      .slice(0, 10)
      .map((restaurant) => ({ restaurant, matchType: 'name' as const }));

    console.log('Resultados:', this.searchResults.length);
  }

  async selectRestaurant(result: SearchResult) {
    console.log(
      'SearchModal: Seleccionando restaurante:',
      result.restaurant.id
    );
    await this.modalCtrl.dismiss();
    this.router.navigate(['/restaurant', result.restaurant.id]);
  }

  dismiss() {
    console.log('SearchModal: Cerrando modal');
    this.modalCtrl.dismiss();
  }
}
