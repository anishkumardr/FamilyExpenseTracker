import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryAddPopupComponent } from './category-add-popup.component';

describe('CategoryAddPopupComponent', () => {
  let component: CategoryAddPopupComponent;
  let fixture: ComponentFixture<CategoryAddPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryAddPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryAddPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
