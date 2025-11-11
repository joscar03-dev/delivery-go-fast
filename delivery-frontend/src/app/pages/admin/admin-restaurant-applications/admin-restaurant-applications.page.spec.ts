import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminRestaurantApplicationsPage } from './admin-restaurant-applications.page';

describe('AdminRestaurantApplicationsPage', () => {
  let component: AdminRestaurantApplicationsPage;
  let fixture: ComponentFixture<AdminRestaurantApplicationsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminRestaurantApplicationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
