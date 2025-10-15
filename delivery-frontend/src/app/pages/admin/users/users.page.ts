import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  AlertController,
  ToastController,
  ModalController,
} from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService, RoleName } from '../../../services/user.service';
import type { User } from '../../../models/user.model';
import { EditUserModalComponent } from './edit-user.modal';
import { CreateUserModalComponent } from './create-user.modal';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './users.page.html',
})
export class AdminUsersPage implements OnInit {
  private userService = inject(UserService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private fb = inject(FormBuilder);

  users: User[] = [];
  loading = false;
  roles: RoleName[] = ['client', 'driver', 'restaurant_owner', 'super_admin'];
  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    email: this.fb.nonNullable.control<string>('', [
      Validators.required,
      Validators.email,
    ]),
    role: this.fb.nonNullable.control<RoleName>('client', [
      Validators.required,
    ]),
  });
  editingId?: string;
  // paginación simple en memoria
  page = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (list) => {
        this.users = list;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toastCtrl.create({
          message: 'No se pudo cargar usuarios',
          duration: 2000,
          color: 'danger',
        });
        t.present();
      },
    });
  }

  async edit(user: User) {
    const modal = await this.modalCtrl.create({
      component: EditUserModalComponent,
      componentProps: { user, roles: this.roles },
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.8,
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'ok' && data) {
      const {
        name,
        email,
        role: r,
      } = data as { name: string; email: string; role: RoleName };
      this.userService.updateUser(user.id, { name, email, role: r }).subscribe({
        next: async () => {
          const t = await this.toastCtrl.create({
            message: 'Actualizado',
            duration: 1500,
            color: 'success',
          });
          t.present();
          this.load();
        },
        error: async () => {
          const t = await this.toastCtrl.create({
            message: 'Error al actualizar',
            duration: 2000,
            color: 'danger',
          });
          t.present();
        },
      });
    }
  }

  async save() {
    if (!this.editingId) return;
    const { name, email, role } = this.form.getRawValue();
    this.userService
      .updateUser(this.editingId, { name, email, role })
      .subscribe({
        next: async () => {
          const t = await this.toastCtrl.create({
            message: 'Actualizado',
            duration: 1500,
            color: 'success',
          });
          t.present();
          this.load();
        },
        error: async () => {
          const t = await this.toastCtrl.create({
            message: 'Error al actualizar',
            duration: 2000,
            color: 'danger',
          });
          t.present();
        },
      });
  }

  async create() {
    const modal = await this.modalCtrl.create({
      component: CreateUserModalComponent,
      componentProps: { roles: this.roles },
      breakpoints: [0, 0.6, 0.85],
      initialBreakpoint: 0.85,
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'ok' && data) {
      const {
        name,
        email,
        role: r,
        password,
      } = data as {
        name: string;
        email: string;
        role: RoleName;
        password: string;
      };
      this.userService
        .createUser({ name, email, role: r, password })
        .subscribe({
          next: async () => {
            const t = await this.toastCtrl.create({
              message: 'Usuario creado',
              duration: 1500,
              color: 'success',
            });
            t.present();
            this.load();
          },
          error: async (err) => {
            const msg = err?.error?.message || 'Error al crear usuario';
            const t = await this.toastCtrl.create({
              message: msg,
              duration: 2000,
              color: 'danger',
            });
            t.present();
          },
        });
    }
  }

  async remove(user: User) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar usuario',
      message: `¿Eliminar a ${user.email}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.confirmDelete(user.id),
        },
      ],
    });
    await alert.present();
  }

  private async confirmDelete(id: string) {
    this.userService.deleteUser(id).subscribe({
      next: async () => {
        const t = await this.toastCtrl.create({
          message: 'Eliminado',
          duration: 1500,
          color: 'success',
        });
        t.present();
        this.load();
      },
      error: async () => {
        const t = await this.toastCtrl.create({
          message: 'Error al eliminar',
          duration: 2000,
          color: 'danger',
        });
        t.present();
      },
    });
  }

  // utilidades de paginación en memoria
  get pagedUsers(): User[] {
    const start = (this.page - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }
  nextPage() {
    if (this.page * this.pageSize < this.users.length) this.page += 1;
  }
  prevPage() {
    if (this.page > 1) this.page -= 1;
  }
}
