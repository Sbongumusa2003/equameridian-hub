import { HttpContextToken } from '@angular/common/http';


export const SUPPRESS_403_REDIRECT = new HttpContextToken<boolean>(() => false);
