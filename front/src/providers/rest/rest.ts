import { Injectable  } from '@angular/core';
import { Observable, of  } from 'rxjs';
import { timeout, catchError, mergeMap } from 'rxjs/operators'
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { CookieService } from 'ngx-cookie';
import { map } from 'rxjs/operators'
import * as S3 from 'aws-sdk/clients/s3';

@Injectable()
export class RestProvider {

    constructor(
        public http: Http, 
        public cookieService: CookieService
    ) {
       
    }
    
    private host = "https://projet-annuel-backend.herokuapp.com/predictPandemiApp/";
    // private host = "http://127.0.0.1:8000/predictPandemiApp/";
    private apiUrlRegister = this.host + 'register';
    private apiUrlLogin = this.host + 'login'
    private apiUrlCheckerSymptoms = this.host + "checker_symptoms"
    private apiUrlLogout = this.host + 'logout'
    private apiUrlGetTodayCovidData = this.host + "getTodayCovidData"
    private apiUrlFitModel = this.host + "fitModel"
    private apiUrlGetCols = this.host + "getCols"

    public bucket = new S3(
      {
          accessKeyId: 'AKIAQ7CGCDEXTJECRB4R',
          secretAccessKey: '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',
          region: 'us-east-1'
      }
    );

    GetCols():Observable<any>{
      return this.getUrlReturn(this.apiUrlGetCols);
    }

    CheckerSymptoms(symptoms):Observable<any>{
        return this.postUrlReturn(this.apiUrlCheckerSymptoms, symptoms);
    }

    Register(registerInfo):Observable<any>{
      return this.postUrlReturn(this.apiUrlRegister, registerInfo);
    }

    Login(loginInfo):Observable<any>{
      return this.postUrlReturn(this.apiUrlLogin, loginInfo);
    }

    Logout():Observable<any>{
      return this.getUrlReturn(this.apiUrlLogout);
    }

    GetTodayCovidData(country):Observable<any>{
      return this.getUrlReturn(this.apiUrlGetTodayCovidData + "?"+"country=" + country);
    }

    FitModel():Observable<any>{
      return this.getUrlReturn(this.apiUrlFitModel);
    }

    private getUrlReturn(url: string): Observable<any> {
      return this.http.get(url,{headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded',
        })})
        .pipe(
          timeout(20000),
          catchError(e => {
            return of({
              'Success': false,
              'Msg':'timeout',
              'error':'timeout'});
          })
        )
        .pipe(map(this.extractData))
    }

    private postUrlReturn(url:string, body:any): Observable<any> {
        return this.http.post(url,body,{
          headers: new Headers({
            'Content-Type': 'application/x-www-form-urlencoded',

          })
        }).pipe(
            timeout(20000),
            catchError(e => {
              return of({
                'Success': false,
                'Msg':'timeout',
                'error':'timeout'});
            })
          )
          .pipe(map(this.extractData))
      }
    
    // private getToken(): Observable<any> {
    //     return Observable.fromPromise(this.storage.get('token').then(token => {
    //       //maybe some processing logic like JSON.parse(token)
    //       return token;
    //     }));
    // }
    
    private extractData(res) {
        let body = res.json();
        return body || {};
    }

    private handleError(error: Response | any) {
        let errMsg: string;

        if(error.name!=null &&error.name =="TimeoutError"){

            return Observable.throw({Msg:"Timeout",Success :false});
          }
          else{
        
        console.error(JSON.parse(error._body));
        return Observable.throw(JSON.parse(error._body));
      }
    }

}