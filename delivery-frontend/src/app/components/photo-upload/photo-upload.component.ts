import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  ActionSheetController,
  AlertController,
} from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-photo-upload',
  templateUrl: './photo-upload.component.html',
  styleUrls: ['./photo-upload.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class PhotoUploadComponent {
  @Input() label: string = 'Subir Foto';
  @Input() photo: string | undefined;
  @Input() required: boolean = false;
  @Output() photoChange = new EventEmitter<string>();

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController
  ) {}

  async selectPhoto() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar Foto',
      buttons: [
        {
          text: 'Tomar Foto',
          icon: 'camera',
          handler: () => {
            this.takePicture(CameraSource.Camera);
          },
        },
        {
          text: 'Elegir de Galería',
          icon: 'images',
          handler: () => {
            this.takePicture(CameraSource.Photos);
          },
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }

  async takePicture(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source,
        width: 1200,
        height: 1200,
      });

      if (image.base64String) {
        const base64Image = `data:image/${image.format};base64,${image.base64String}`;
        this.photo = base64Image;
        this.photoChange.emit(base64Image);
      }
    } catch (error: any) {
      // Usuario canceló o hubo un error
      if (error.message !== 'User cancelled photos app') {
        await this.showError(
          'No se pudo capturar la foto. Por favor, intenta de nuevo.'
        );
      }
    }
  }

  async removePhoto() {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Foto',
      message: '¿Estás seguro de que deseas eliminar esta foto?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.photo = undefined;
            this.photoChange.emit('');
          },
        },
      ],
    });

    await alert.present();
  }

  private async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: ['OK'],
    });

    await alert.present();
  }
}
