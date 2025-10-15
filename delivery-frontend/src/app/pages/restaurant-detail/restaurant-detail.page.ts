import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';
import type { RestaurantModel } from '../../models/restaurant.model';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './restaurant-detail.page.html',
})
export class RestaurantDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private restaurants = inject(RestaurantService);
  restaurant?: RestaurantModel;
  loading = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading = true;
    this.restaurants.getById(id).subscribe({
      next: (r) => {
        this.restaurant = r;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
