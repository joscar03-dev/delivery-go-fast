import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bagOutline, bicycleOutline } from 'ionicons/icons';

addIcons({
  'bag-outline': bagOutline,
  'bicycle-outline': bicycleOutline,
});

@Component({
  selector: 'app-driver-tabs',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './driver-tabs.page.html',
  styleUrls: ['./driver-tabs.page.scss'],
})
export class DriverTabsPage {
  constructor() {}
}
