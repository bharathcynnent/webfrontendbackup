
import { Injectable ,NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { tap, catchError } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import { SelectedClientService } from '../shared.service';
interface UserResponse {
  _id: string;
  date: string;
  screens: { [key: string]: { [key: string]: number } };
  totalCount: number;
}

interface MapData {
  _id: string;
  clientName: string;
  latitude: string;
  longitude: string;
  country: string;
  cityName?: string;
  __v: number;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  setLink(link: string) {
    this.widgetLink = link;
  }

  public mostVisitedPages: any[] = [];
  public mostClickedAction: any[] = [];
  public userDropdownData: { id: string; value: string }[] = [];
  public userEventDates: { id: string; value: string }[] = [];
  private apiUrl = 'https://webanalyticals.onrender.com/';
  private wsEndpoint = 'ws://localhost:3000'; 
  private dataSubject = new Subject<any[]>();
  private actionsSubject = new Subject<any[]>();
  private viewedSubject = new Subject<any[]>();
  private mapSubject = new Subject<any[]>();
  private browserSubject = new Subject<any[]>();
  static widgetLink: string;
  static getTableData: any;
  
  constructor(
    private selectedClientService: SelectedClientService,
    private http: HttpClient,
  ) {
    this.setupWebSocket();
  }
  widgetLink: string = '';

  private setupWebSocket(): void {
    const wsSubject = webSocket(this.wsEndpoint);
    wsSubject.subscribe(
        (message: any) => {
            console.log('WebSocket message received:', message); // Add this log
            const change = message.change;
            const collection = message.collection;
            const selectedClient = message.selectedClient; // Include selectedClient

            if (collection === 'devicedatas') {
                this.handleDeviceDataChange({ ...change, selectedClient });
            } else if (collection === 'mostclickedactions') {
                this.handleMostClickedActionsChange({ ...change, selectedClient });
            } else if (collection === 'mapdatas') {
                this.handlemapDataChange({ ...change, selectedClient });
            } else if (collection === 'mostviewedpages') {
                this.handleMostViewedPagesChange({ ...change, selectedClient });
            } else if (collection === 'browsercounts') {
                this.handleMostViewedBrowserChange({ ...change, selectedClient });
            }
        },
        (error) => {
            console.error('WebSocket error:', error);
        }
    );
}


  private handleDeviceDataChange(change: any): void {
    const selectedClient = change.selectedClient || this.selectedClientService.getSelectedClient();
    console.log('Selected client:', selectedClient); 
    if (selectedClient) {
      this.getUsersData(selectedClient).subscribe(
        (data) => {
          console.log('Received updated data:', data);
          this.dataSubject.next(data); // Notify subscribers with the new data
        },
        (error) => {
          console.error('Error fetching updated data:', error);
        }
      );
    } else {
      console.error('Selected client is undefined.');
    }
  }

  private handlemapDataChange(change: any): void {
    const selectedClient = change.selectedClient || this.selectedClientService.getSelectedClient();
    if (selectedClient) {
      this.getlocationData(selectedClient).subscribe(
        (data) => {
          console.log('Received updated data:', data);
          this.mapSubject.next(data); // Notify subscribers with the new data
        },
        (error) => {
          console.error('Error fetching updated data:', error);
        }
      );
    } else {
      console.error('Selected client is undefined.');
    }
  }


  private handleMostClickedActionsChange(change: any): void {
    // Define how to handle MostClickedActions changes here
    const selectedClient = change.selectedClient || this.selectedClientService.getSelectedClient();
    if (selectedClient) {
      this.getMostClickedActions(selectedClient).subscribe(
        (data) => {
          console.log('Received updated actions data:', data);
          this.actionsSubject.next(data); // Notify subscribers with the new data
        },
        (error) => {
          console.error('Error fetching updated actions data:', error);
        }
      );
    } else {
      console.error('Selected client is undefined.');
    }
  }

  private handleMostViewedPagesChange(change: any): void {
    const selectedClient = change.selectedClient || this.selectedClientService.getSelectedClient();
    if (selectedClient) {
      this.getMostVisitedPages(selectedClient).subscribe(
        (data) => {
          console.log('Received updated data:', data);
          this.viewedSubject.next(data); // Notify subscribers with the new data
        },
        (error) => {
          console.error('Error fetching updated data:', error);
        }
      );
    } else {
      console.error('Selected client is undefined.');
    }
  }
  
  private handleMostViewedBrowserChange(change: any): void {
    const selectedClient = change.selectedClient || this.selectedClientService.getSelectedClient();
    if (selectedClient) {
      this.getMostUsedBrowsers(selectedClient).subscribe(
        (data) => {
          console.log('Received updated data:', data);
          this.browserSubject.next(data); 
        },
        (error) => {
          console.error('Error fetching updated data:', error);
        }
      );
    } else {
      console.error('Selected client is undefined.');
    }
  }

  getDataUpdates(): Observable<any[]> {
    return this.dataSubject.asObservable();
  }

  getActionsUpdates(): Observable<any[]> {
    return this.actionsSubject.asObservable();
  }

  getmapsUpdates(): Observable<any[]> {
    return this.mapSubject.asObservable();
  }

  getPagesUpdates(): Observable<any[]> {
    return this.viewedSubject.asObservable();
  }

  getBrowsersUpdates(): Observable<any[]> {
    return this.browserSubject.asObservable();
  }

  getUsersData(selectedClient: string): Observable<any[]> {
    const endpoint = `https://webanalyticals.onrender.com/getAllDeviceData/${selectedClient}`;
    console.log('API Endpoint:', endpoint);
    return this.http.get<any[]>(endpoint);
  }


  getAllClients(): Observable<string[]> {
    return this.http
      .get<any[]>('https://webanalyticals.onrender.com/getAllClients')
      .pipe(map((response) => response.map((client) => client.clientName)));
  }

  getUsersByClientName(selectedClient: string): Observable<{ _id: string }[]> {
    return this.http
      .get<UserResponse[]>(
        `https://webanalyticals.onrender.com/getUsersByClientName/${selectedClient}`
      )
      .pipe(map((response) => response.map((user) => ({ _id: user._id }))));
  }

  getMonthlyData(selectedUserId: string): Observable<any[]> {
    const endpoint = `${this.apiUrl}getMonthlyData/${selectedUserId}`;
    return this.http.get<any[]>(endpoint).pipe(
      catchError((error) => {
        console.error('Error in getMonthlyData:', error);
        throw error;
      })
    );
  }
  
  getAccesedCountryCount(selectedClient: string): Observable<MapData[]> {
    const endpoint = `https://webanalyticals.onrender.com/accesedCountCountry/${selectedClient}`;
    console.log('API Endpoint:', endpoint);
    return this.http.get<MapData[]>(endpoint).pipe(
      catchError((error) => {
        console.error('Error in getAccesedCountryCount:', error);
        throw error;
      })
    );
  }

  getMostUsedBrowsers(selectedClient: string): Observable<any[]> {
    const endpoint = `https://webanalyticals.onrender.com/mostUsedBrowsers/${selectedClient}`;
    return this.http.get<any[]>(endpoint).pipe(
      catchError((error) => {
        console.error('Error in getMostUsedBrowsers:', error);
        throw error;
      })
    );
  }

  getWeeklyDataForUser(selectedUserId: string): Observable<any[]> {
    const endpoint = `${this.apiUrl}getWeeklyData/${selectedUserId}`;
    return this.http.get<any[]>(endpoint).pipe(
      catchError((error) => {
        console.error('Error in getWeeklyDataForUser:', error);
        throw error;
      })
    );
  }

  getDatesByUserId(
    userId: string
  ): Observable<{ id: string; value: string }[]> {
    return this.http
      .get<UserResponse[]>(
        `https://webanalyticals.onrender.com/getDates/${userId}`
      )
      .pipe(
        map((response) =>
          response.map((item) => ({ id: item.date, value: item.date }))
        )
      );
  }

  getlocationData(selectedClient: string): Observable<MapData[]> {
    const endpoint = `https://webanalyticals.onrender.com/getAllMapData/${selectedClient}`;
    return this.http.get<MapData[]>(endpoint).pipe(
      catchError((error) => {
        console.error('Error in getlocationData:', error);
        throw error;
      })
    );
  }

  getUserEvents(
    selectedUsername: string,
    selectedDateForId: string
  ): Observable<UserResponse> {
    return this.http.get<UserResponse>(
      `https://webanalyticals.onrender.com/getUserEvents/${selectedUsername}/${selectedDateForId}`
    );
  }

  getMostVisitedPages(clientName: string): Observable<any[]> {
    const endpoint = `${this.apiUrl}mostViewedPages/${clientName}`;
    return this.http.get<any[]>(endpoint).pipe(
      map((data) => {
        this.mostVisitedPages = data;
        return data;
      })
    );
  }

  getMostClickedActions(clientName: string): Observable<any[]> {
    const endpoint = `${this.apiUrl}mostClickedActions/${clientName}`;
    return this.http.get<any[]>(endpoint).pipe(
      map((data) => {
        this.mostClickedAction = data;
        return data;
      })
    );
  }

  getTableData(clientName: string): Observable<any> {
    return this.http.get(
      `https://webanalyticals.onrender.com/${this.widgetLink}/${clientName}`
    );
  }
}
