import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestaurantApplicationPage } from './restaurant-application.page';

describe('RestaurantApplicationPage', () => {
  let component: RestaurantApplicationPage;
  let fixture: ComponentFixture<RestaurantApplicationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RestaurantApplicationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
