import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonSpinner,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { RestaurantService } from '../services/restaurant.service';
import type { RestaurantModel } from '../models/restaurant.model';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonSpinner,
    RouterLink,
  ],
})
export class Tab2Page implements OnInit {
  private restaurants = inject(RestaurantService);
  list: RestaurantModel[] = [];
  loading = false;

  ngOnInit(): void {
    this.loading = true;
    this.restaurants.list().subscribe({
      next: (r) => {
        this.list = r;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
