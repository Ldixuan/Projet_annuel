import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymptomsCheckerComponent } from './symptoms-checker.component';

describe('SymptomsCheckerComponent', () => {
  let component: SymptomsCheckerComponent;
  let fixture: ComponentFixture<SymptomsCheckerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SymptomsCheckerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SymptomsCheckerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
