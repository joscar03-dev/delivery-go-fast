import {
  Component,
  EnvironmentInjector,
  inject,
  computed,
  signal,
} from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import { triangle, ellipse, square } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  private auth = inject(AuthService);

  isSuperAdmin = computed(() => this.auth.hasRole('super_admin'));

  constructor() {
    addIcons({ triangle, ellipse, square });
  }
}
