import { Component, ChangeDetectorRef, Input , OnDestroy, OnInit} from '@angular/core';
import { Subscription } from 'rxjs';
import * as Highcharts from 'highcharts';
import * as _Highcharts from 'highcharts/highmaps';
import HighchartsData from '@highcharts/map-collection/custom/world.topo.json';
import { NgxSpinnerService } from 'ngx-spinner';
import { DataService } from '../../../../shared/services/data.service';
import { SelectedClientService } from '../../../../shared/shared.service';
import { listOfCountryWithCode } from '../../../../../../assets/data/countryCodeMapping';
import { DeviceCount, MostClickedAction, MostViewedPage, ProgressBar } from '../../../../shared/interfaces/interfaces';
import { WEEKLY_INTERVAL } from '../../../../shared/lang/lang';


@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.css',
})
export class DashboardOverviewComponent implements OnDestroy , OnInit{
  @Input() latitude: number = 0;
  @Input() longitude: number = 0;

  totalDeviceCount: number = 0;
  maxValue: number = 0;

  mostViewedPages: MostViewedPage[] = [];
  mostClickedActions: MostClickedAction[] = [];
  clientNames: string[] = [];
  deviceCounts: DeviceCount[] = [];
  progressBars: ProgressBar[] = [];

  isDisableViewedPages: boolean = false;
  ismapDisable: boolean = false;
  isDisableClickedAction: boolean = false;

  selectedUsername: string = '';
  selectedClient: string = '';
  defaultSelectedClient: string = '';
  activeTab = 'dashboard';
  selectedInterval: string = WEEKLY_INTERVAL;

  chartConstructor = 'mapChart';
  Highcharts: typeof _Highcharts = _Highcharts;
  chartOptions: Highcharts.Options | null = null;
  
  subscriptions: Subscription[] = [];
  
  constructor(
    private cdr: ChangeDetectorRef,
    public dataService: DataService,
    private spinner: NgxSpinnerService,
    private selectedClientService: SelectedClientService
  ) {
    
  }

  ngOnInit(): void {
    this.spinner.show();
    this.selectedInterval = WEEKLY_INTERVAL;

    const clientSubscription = this.dataService.getAllClients().subscribe((clients: string[]) => {
      this.clientNames = clients;
      this.clientNames.splice(-2);
      if (this.clientNames && this.clientNames.length > 0) {
        this.defaultSelectedClient = this.clientNames[0];
        if (this.activeTab == 'dashboard') {
          this.onDashboardChange(this.clientNames[0]);
          this.mostViwedCountry(this.defaultSelectedClient);
        }
      }

      setTimeout(() => {
        this.spinner.hide();
      }, 1000);
    });
    this.subscriptions.push(clientSubscription)
    const dataSubscription = this.dataService.getDataUpdates().subscribe((data: any[]) => {
      this.handleDataUpdate(data);
    });
    this.subscriptions.push(dataSubscription);

    const actionsSubscription = this.dataService.getActionsUpdates().subscribe((data: any[]) => {
      this.handleActionsUpdate(data);
    });
    this.subscriptions.push(actionsSubscription);

    const mapsSubscription = this.dataService.getmapsUpdates().subscribe((data: any[]) => {
      this.handleMapsUpdate(data);
    });
    this.subscriptions.push(mapsSubscription);

    const PagesSubscription = this.dataService.getPagesUpdates().subscribe((data: any[]) => {
      this.handlePagesUpdate(data);
    });
    this.subscriptions.push(PagesSubscription);

    const browserSubscription = this.dataService.getBrowsersUpdates().subscribe((data: any[]) => {
      this.handlebrowserUpdate(data);
    });
    this.subscriptions.push(browserSubscription);

  }
  handleDataUpdate(data: any[]): void {
    // Update your component state with the new data
    console.log('Data updated in component:', data);

    // Call your existing method to update charts, etc.
    this.getDeviceData(this.defaultSelectedClient);

    // Manually trigger change detection
    this.cdr.detectChanges();
  }
  handleActionsUpdate(data: any[]): void {
    // Update your component state with the new actions data
    console.log('Actions data updated in component:', data);

    // Call your method to update actions-related data, charts, etc.
    this.loadMostClickedActions(this.defaultSelectedClient);

    // Manually trigger change detection
    this.cdr.detectChanges();
  }

  handleMapsUpdate(data: any[]): void {
    // Update your component state with the new maps data
    console.log('Maps data updated in component:', data);

    // Call your method to update maps-related data, charts, etc.
    this.getMapComponent(this.defaultSelectedClient);

    // Manually trigger change detection
    this.cdr.detectChanges();
  }

  handlePagesUpdate(data: any[]): void {
    // Update your component state with the new maps data
    console.log('Maps data updated in component:', data);

    // Call your method to update maps-related data, charts, etc.
    this.loadMostViewedPages(this.defaultSelectedClient);

    // Manually trigger change detection
    this.cdr.detectChanges();
  }

  handlebrowserUpdate(data: any[]): void {
    // Update your component state with the new maps data
    console.log('Maps data updated in component:', data);

    // Call your method to update maps-related data, charts, etc.
    this.loadMostUsedBrowsers(this.defaultSelectedClient);

    // Manually trigger change detection
    this.cdr.detectChanges();
  }

  // load all the widget when it changes the tab
  loadSelectedTabData() {
    if (this.activeTab === 'dashboard') {
      setTimeout(() => {
        this.renderPieChart();
        this.renderBarChart();
        this.getMapComponent(this.defaultSelectedClient);
        this.mostViwedCountry(this.defaultSelectedClient);
        this.loadMostUsedBrowsers(this.defaultSelectedClient);
        this.getDeviceData(this.defaultSelectedClient);
      }, 2000);
    }
  }

  // load Active User by Device
  getDeviceData(selectedClient: string): void {
    const deviceSubscription= this.dataService.getUsersData(selectedClient).subscribe((data) => {
      if (!data || data.length === 0) {
        return;
      }
      const deviceCounts: { [key: string]: number } = data.reduce(
        (counts, entry) => {
          const deviceName = entry.DeviceName;
          if (deviceName) counts[deviceName] = (counts[deviceName] || 0) + 1;
          return counts;
        },
        {}
      );

      const deviceData = Object.entries(deviceCounts).map(
        ([deviceName, count]) => ({ name: deviceName, y: count })
      );

      this.totalDeviceCount = Object.values(deviceCounts).reduce(
        (total, count) => total + count,
        0
      );

      const pieChartOptions: Highcharts.Options = {
        credits: { enabled: false },
        chart: { type: 'pie', backgroundColor: 'transparent' },
        title: { text: '' },
        tooltip: { pointFormat: '{series.name}: <b>{point.y}</b>' },
        plotOptions: {
          pie: {
            innerSize: '80%',
            borderWidth: 0,
            depth: 10,
            dataLabels: {
              enabled: true,
              color: '#000000',
              style: { textOutline: 'none' },
            },
          },
        },
        colors: ['#ffc107','#052288', '#BBC1D2'],
        series: [{ type: 'pie', name: 'Count', data: deviceData }],
      };

      Highcharts.chart('pieChartContainer', pieChartOptions);

      const totalCountElement = document.getElementById('total-count');
      if (totalCountElement)
        totalCountElement.innerText =
          'Total Device Count: ' + this.totalDeviceCount;
    });
    this.subscriptions.push(deviceSubscription);
    this.cdr.detectChanges();
  }

  // change the widget based on the selected client
  onDashboardChange(selectedClient: string): void {
    this.defaultSelectedClient = selectedClient; 
    this.selectedClientService.setSelectedClient(selectedClient);
    if (!this.selectedUsername || this.selectedUsername) {
      const userSubscription = this.dataService.getUsersByClientName(selectedClient).subscribe(() => {
        this.loadMostViewedPages(selectedClient);
        this.loadMostClickedActions(selectedClient);
        this.getDeviceData(selectedClient);
        this.loadMostUsedBrowsers(selectedClient);
        this.getMapComponent(this.defaultSelectedClient);
        this.mostViwedCountry(this.defaultSelectedClient);
      });

      this.subscriptions.push(userSubscription);
    }
  }

  // load Most Clicked Actions 
  loadMostClickedActions(selectedClient: string): void {
    const clickSubscription=this.dataService.getMostClickedActions(selectedClient).subscribe((data) => {
      if (data && data.length > 0) {
        this.isDisableClickedAction = false;
        this.mostClickedActions = data;
        this.renderBarChart();
      } else {
        this.isDisableClickedAction = true;
      }
    });
    this.subscriptions.push(clickSubscription);
  }

  // load Most Viewed Pages
  loadMostViewedPages(selectedClient: string): void {
    const viewSubscription=this.dataService.getMostVisitedPages(selectedClient).subscribe((data) => {
      this.mostViewedPages = data;

      this.renderPieChart();
    });
    this.subscriptions.push(viewSubscription);
  }

  // load Most Used Countries
  mostViwedCountry(selectedClient: string): void {
    const countrySubscription= this.dataService
      .getAccesedCountryCount(selectedClient)
      .subscribe((data: any[]) => {
        const maxValue = Math.max(...data.map((item) => item.value));
        const result = maxValue * 2;
        this.maxValue = result;
        this.progressBars = data;
      });
      this.subscriptions.push(countrySubscription);
  }

  // Function to render the pie chart for Most Viewed Pages
  renderPieChart() {
    this.dataService
      .getMostVisitedPages(this.defaultSelectedClient)
      .subscribe((data) => {
        if (data && data.length > 0) {
          const filteredData = data.filter(
            (item) => !isNaN(parseFloat(item.percentage))
          );
          if (filteredData.length > 0) {
            const first5Data = filteredData.slice(0, 5);
            const colors = [
              '#052288',
              '#FFD500',
              '#BBC1D2',
              '#78787A',
              '#1aadce',
            ];

            const options: Highcharts.Options = {
              credits: { enabled: false },
              chart: {
                type: 'pie',
                height: 300,
                backgroundColor: 'transparent',
              },
              title: { text: '' },
              plotOptions: {
                pie: {
                  colors: colors,
                  borderWidth: 0,
                  dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f}%',
                    style: { textOutline: 'none', color: '#000000' },
                  },
                },
              },
              series: [
                {
                  type: 'pie',
                  data: first5Data.map(({ pageName, percentage }, index) => ({
                    name: pageName,
                    y: parseFloat(percentage),
                    color: colors[index],
                  })),
                },
              ],
              tooltip: {
                pointFormat: '<b>Most Viewed</b>: {point.percentage:.1f}%',
              },
            };

            Highcharts.chart('pie-chart-container', options);
          } else {
            this.isDisableViewedPages = true;
          }
        }
      });
  }

  // load Most Used Browsers
  loadMostUsedBrowsers(selectedClient: string): void {
    const browserSubscription= this.dataService.getMostUsedBrowsers(selectedClient).subscribe((data) => {
      const options: Highcharts.Options = {
        credits: { enabled: false },
        chart: {
          type: 'column',
          height: 300,
          backgroundColor: 'transparent',
        },
        title: {
          text: '',
          style: { color: '#000000', fontSize: '0.9em' },
        },
        xAxis: {
          categories: data.map(({ browserName }) => browserName),
          labels: { style: { color: '#000000' } },
        },
        yAxis: {
          title: { text: 'Counts', style: { color: '#000000' } },
          labels: { style: { color: '#000000' } },
          gridLineColor: 'transparent',
          gridLineWidth: 0,
        },
        plotOptions: {
          column: {
            color: '#052288',
            borderWidth: 0,
            pointWidth: 12,
            borderRadius: 5,
          },
        },
        legend: { itemStyle: { color: '#000000' } },
        series: [
          {
            name: 'Browsers',
            type: 'column',
            data: data.map(({ count }) => count),
          },
        ],
        tooltip: { pointFormat: '<b>Counts</b>: {point.y}' },
      };

      Highcharts.chart('most-used-browsers-chart-container', options);
    });
    this.subscriptions.push(browserSubscription);
  }

  // functions for widget tables

  onMostViewedPagesClick() {
    this.dataService.setLink('mostViewedPages');
  }

  onMostClickedActionsClick() {
    this.dataService.setLink('mostClickedActions');
  }

  onActiveUserByDeviceClick() {
    this.dataService.setLink('mostUsedDevices');
  }

  onMostUsedCountriesClick() {
    this.dataService.setLink('usersByCountry');
  }

  onMostUsedBrowserClick() {
    this.dataService.setLink('mostUsedBrowsers');
  }

  // Function to render the pie chart forMost Clicked Actions
  renderBarChart() {
    if (this.mostClickedActions.length > 0) {
      const first5Data = this.mostClickedActions.slice(0, 5);
      // const colors = ['#052288'];
      const barFillColor = '#052288';

      const options: Highcharts.Options = {
        credits: { enabled: false },
        chart: {
          type: 'bar',
          height: 300,
          backgroundColor: 'transparent',
        },
        title: { text: '' },
        xAxis: {
          categories: first5Data.map(({ ButtonName }) => ButtonName),
          labels: { style: { color: '#000000' } },
        },
        yAxis: {
          title: { text: 'Total counts', style: { color: '#000000' } },
          labels: { style: { color: '#000000' } },
          gridLineColor: 'transparent',
          gridLineWidth: 0,
        },
        plotOptions: {
          bar: { color: barFillColor, borderWidth: 0 },
        },
        legend: { itemStyle: { color: '#000000' } },
        series: [
          {
            type: 'bar',
            name: 'Clicks',
            data: first5Data.map(({ count }) => count),
          },
        ],
        tooltip: { pointFormat: '<b>Clicks</b>: {point.y}' },
      };

      Highcharts.chart('bar-chart-container', options);
    }
  }

  // load Map
  getMapComponent(selectedClient: string) {
    if (!selectedClient) {
      this.ismapDisable = true;
      return;
    }

    this.ismapDisable = false;

    const mapSubscription=this.dataService
      .getlocationData(selectedClient)
      .subscribe((data: any[]) => {
        if (!data || data.length === 0) {
          this.ismapDisable = true;
          return;
        }

        const mapData = data.map((obj) => {
          const countryCode =
            listOfCountryWithCode[obj.country.toLowerCase().trim()] ||
            'not found';
          return {
            name: obj.country,
            color: '#666b7b',
            'hc-key': countryCode,
          };
        });

        const stringifiedArray = data.map((obj) => ({
          name: obj.cityName,
          lat: Number(obj.latitude),
          lon: Number(obj.longitude),
        }));

        this.chartOptions = {
          credits: { enabled: false },
          chart: {
            type: 'map',
            map: HighchartsData,
            backgroundColor: 'transparent',
          },
          title: { text: '', style: { color: '#000000' } },
          mapNavigation: {
            enabled: true,
            buttonOptions: { alignTo: 'spacingBox' },
          },
          legend: { enabled: true },
          colorAxis: {
            visible: false,
            minColor: '#BBC1D2',
            maxColor: '#BBC1D2',
          },
          tooltip: {
            formatter: function () {
              return this.point.name;
            },
          },
          series: [
            { type: 'map', allAreas: true, data: mapData },
            {
              type: 'mappoint',
              marker: {
                symbol:
                  'url(https://github.com/Cynnent/web-analytics/blob/main/src/assets/images/location.png?raw=true)',
                width: 18,
                height: 22,
              },
              data: stringifiedArray,
            },
          ],
        };
      });
      this.subscriptions.push(mapSubscription);
  }

  // to change the tab when clicked
  changeActiveTab(clickedTab: string) {
    this.selectedInterval = WEEKLY_INTERVAL;
    this.activeTab = clickedTab;
    this.loadSelectedTabData();
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions = [];
  }
}
