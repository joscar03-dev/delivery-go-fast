import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonButton,
  IonSpinner,
  IonText,
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
    IonButtons,
    IonBackButton,
    IonContent,
    IonButton,
    IonSpinner,
    IonText,
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
    this.loadProfile();
  }

  ionViewWillEnter(): void {
    // Recargar el perfil cada vez que se entra a la página
    // Esto asegura que el rol esté actualizado si fue aprobado como driver
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading = true;

    // Primero recargar el usuario actual para actualizar el rol
    this.auth.reloadCurrentUser().subscribe({
      next: () => {
        // Luego obtener el perfil completo
        this.userService.getProfile().subscribe({
          next: (u) => {
            this.user = u;
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading profile:', err);
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error('Error reloading user:', err);
        // Si falla, intentar cargar el perfil de todas formas
        this.userService.getProfile().subscribe({
          next: (u) => {
            this.user = u;
            this.loading = false;
          },
          error: (err2) => {
            console.error('Error loading profile:', err2);
            this.loading = false;
          },
        });
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

  navigateToDriverApplication() {
    console.log('🚀 Navigating to driver application');
    this.router.navigate(['/driver-application']);
  }
}
