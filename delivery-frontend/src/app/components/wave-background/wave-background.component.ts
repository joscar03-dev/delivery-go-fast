import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wave-background',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wave-background.component.html',
  styleUrls: ['./wave-background.component.scss'],
})
export class WaveBackgroundComponent {
  // Generar ID único para el gradiente para evitar conflictos entre páginas
  gradientId = `wave-gradient-${Math.random().toString(36).substr(2, 9)}`;
}
