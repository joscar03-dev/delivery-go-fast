import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminRestaurantApplicationDetailPage } from './admin-restaurant-application-detail.page';

describe('AdminRestaurantApplicationDetailPage', () => {
  let component: AdminRestaurantApplicationDetailPage;
  let fixture: ComponentFixture<AdminRestaurantApplicationDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminRestaurantApplicationDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
