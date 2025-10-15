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
  IonChip,
} from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { RouterLink } from '@angular/router';
import { RestaurantService } from '../services/restaurant.service';
import type { RestaurantModel } from '../models/restaurant.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    RouterLink,
  ],
})
export class Tab1Page implements OnInit {
  private restaurantsSvc = inject(RestaurantService);
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

  get filtered(): RestaurantModel[] {
    if (!this.selectedCategory) return this.list;
    return this.list.filter((r) => r.category?.name === this.selectedCategory);
  }
}
