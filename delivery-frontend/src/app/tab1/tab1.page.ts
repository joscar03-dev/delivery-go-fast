import {
  Component,
  OnInit,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router';
import { RestaurantService } from '../services/restaurant.service';
import type { RestaurantModel } from '../models/restaurant.model';
import { register } from 'swiper/element/bundle';
import { addIcons } from 'ionicons';
import { search } from 'ionicons/icons';

// Register icons
addIcons({
  search,
});

register();

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonChip,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    RouterLink,
  ],
})
export class Tab1Page implements OnInit {
  private restaurantsSvc = inject(RestaurantService);
  private router = inject(Router);
  list: RestaurantModel[] = [];
  categories: { id?: string; name: string }[] = [];
  selectedCategory: string | null = null; // name

  ngOnInit(): void {
    this.restaurantsSvc.list().subscribe({
      next: (r) => {
        this.list = r || [];
        const names = Array.from(
          new Set(
            (
              this.list.map((x) => x.category?.name).filter(Boolean) as string[]
            ).sort()
          )
        );
        this.categories = names.map((name) => ({ name }));
      },
      error: () => {
        this.list = [];
        this.categories = [];
      },
    });
  }

  setFilter(name: string | null) {
    this.selectedCategory = name;
  }

  navigateToRestaurant(id: string) {
    this.router.navigate(['/restaurant', id]);
  }

  get filtered(): RestaurantModel[] {
    if (!this.selectedCategory) return this.list;
    return this.list.filter((r) => r.category?.name === this.selectedCategory);
  }
}
