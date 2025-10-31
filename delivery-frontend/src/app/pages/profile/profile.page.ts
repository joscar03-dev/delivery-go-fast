import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonToggle,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import type { User } from '../../models/user.model';
import { addIcons } from 'ionicons';
import {
  moonOutline,
  receiptOutline,
  chevronForwardOutline,
} from 'ionicons/icons';

// Register icons
addIcons({
  'moon-outline': moonOutline,
  'receipt-outline': receiptOutline,
  'chevron-forward-outline': chevronForwardOutline,
});

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonToggle,
    IonIcon,
    IonLabel,
  ],
  templateUrl: './profile.page.html',
})
export class ProfilePage implements OnInit {
  private userService = inject(UserService);
  private auth = inject(AuthService);
  user?: User;
  loading = false;
  paletteToggle = false;

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

    // Use matchMedia to check the user preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // Initialize the dark palette based on the initial
    // value of the prefers-color-scheme media query
    this.initializeDarkPalette(prefersDark.matches);

    // Listen for changes to the prefers-color-scheme media query
    prefersDark.addEventListener('change', (mediaQuery) =>
      this.initializeDarkPalette(mediaQuery.matches)
    );
  }

  // Check/uncheck the toggle and update the palette based on isDark
  initializeDarkPalette(isDark: boolean) {
    this.paletteToggle = isDark;
    this.toggleDarkPalette(isDark);
  }

  // Listen for the toggle check/uncheck to toggle the dark palette
  toggleChange(event: CustomEvent) {
    this.toggleDarkPalette(event.detail.checked);
  }

  // Add or remove the "ion-palette-dark" class on the html element
  toggleDarkPalette(shouldAdd: boolean) {
    document.documentElement.classList.toggle('ion-palette-dark', shouldAdd);
  }

  logout() {
    this.auth.logout();
  }
}
