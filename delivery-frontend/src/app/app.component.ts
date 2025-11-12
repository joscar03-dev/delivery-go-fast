import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PushNotificationService } from './services/push-notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private pushService = inject(PushNotificationService);

  constructor() {}

  ngOnInit() {
    this.initializeApp();
  }

  private initializeApp() {
    // 🔔 CRÍTICO: Inicializar listeners de notificaciones AL INICIO
    // Esto permite que la app responda a notificaciones que la abren desde estado cerrado
    this.pushService.initializeListeners();
  }
}
