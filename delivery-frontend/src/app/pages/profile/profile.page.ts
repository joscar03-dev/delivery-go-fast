import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonText,
  IonList,
  IonListHeader,
  IonItem,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import type { User } from '../../models/user.model';
import { WaveBackgroundComponent } from '../../components/wave-background/wave-background.component';
import { addIcons } from 'ionicons';
import {
  receiptOutline,
  chevronForwardOutline,
  locationOutline,
  personCircleOutline,
  bicycleOutline,
  storefrontOutline,
  headsetOutline,
  documentTextOutline,
  shieldCheckmarkOutline,
  logOutOutline,
  trashOutline,
} from 'ionicons/icons';

// Register icons
addIcons({
  'receipt-outline': receiptOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'location-outline': locationOutline,
  'person-circle-outline': personCircleOutline,
  'bicycle-outline': bicycleOutline,
  'storefront-outline': storefrontOutline,
  'headset-outline': headsetOutline,
  'document-text-outline': documentTextOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'log-out-outline': logOutOutline,
  'trash-outline': trashOutline,
});

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    WaveBackgroundComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonSpinner,
    IonText,
    IonList,
    IonListHeader,
    IonItem,
    IonIcon,
    IonLabel,
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  private userService = inject(UserService);
  private auth = inject(AuthService);
  private router = inject(Router);

  user?: User;
  loading = false;

  ngOnInit(): void {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (u) => {
        this.user = u;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/tabs/business']);
  }

  goToAddresses() {
    console.log('🚀 Navigating to addresses from profile');
    this.router.navigate(['/tabs/addresses'], {
      state: { returnUrl: '/tabs/account' },
    });
  }
}
