import { Injectable } from '@angular/core'
import { ChatComponentComponent } from './chat-component/chat-component.component'
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { catchError, retry } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class ChatClientService {
  private restUrl = 'http://localhost:3000/vectorsearch'
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }
  constructor (private httpClient: HttpClient) {}
  getExpenseEntries (): Observable<any> {
    return this.httpClient
      .get(this.restUrl, this.httpOptions)
      .pipe(retry(3), catchError(this.httpErrorHandler))
  }

  getExpenseEntry (id: number): Observable<any> {
    return this.httpClient
      .get(this.restUrl + '/' + id, this.httpOptions)
      .pipe(retry(3), catchError(this.httpErrorHandler))
  }

  getVectorSearchResponse2(data: string): Observable<string> {
    return this.httpClient.post<string>(this.restUrl, data, this.httpOptions)
    .pipe(
       retry(3),
       catchError(this.httpErrorHandler)
    );
 }
 getVectorSearchResponse(data: string): Observable<string> {
  return this.httpClient.get<string>(this.restUrl + '?query=' + data,  this.httpOptions)
  .pipe(
     retry(3),
     catchError(this.httpErrorHandler)
  );
}
  private httpErrorHandler (error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error(
        'A client side error occurs. The error message is ' + error.message
      )
    } else {
      console.error(
        'An error happened in server. The HTTP status code is ' +
          error.status +
          ' and the error returned is ' +
          error.message
      )
    }

    return throwError('Error occurred. Pleas try again')
  }
}
