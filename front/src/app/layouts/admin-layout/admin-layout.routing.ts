import { Routes } from '@angular/router';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { SymptomsCheckerComponent } from '../../pages/symptoms-checker/symptoms-checker.component';
import {FaqComponent} from '../../pages/faq/faq.component'
import {UpdateDataComponent} from '../../pages/update-data/update-data.component'

export const AdminLayoutRoutes: Routes = [
    { path: 'symptoms_checker', component: SymptomsCheckerComponent},
    { path: 'dashboard',        component: DashboardComponent },
    { path: 'update_data',      component: UpdateDataComponent},
    { path: 'faq',              component: FaqComponent}
];
