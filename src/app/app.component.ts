import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@awesome-cordova-plugins/splash-screen/ngx';
import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  public selectedIndex = 0;
  public appPages = [
    {
      title: 'Catch',
      url: '/page/Home',
      icon: 'boat'
    },
    {
      title: 'Form Entries',
      url: '/page/F1EntriesList',
      icon: 'clipboard'
    },
    {
      title: 'Wildlife',
      url: '/page/Wildlife',
      icon: 'glasses'
    },
    {
      title: 'Lost/Unmarked Gear',
      url: '/page/Gear',
      icon: 'help-buoy'
    },
    {
      title: 'Your Details',
      url: '/page/Settings',
      icon: 'person-circle'
    },
    {
      title: 'About this App',
      url: '/page/About',
      icon: 'information-circle'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  ngOnInit() {
    const path = window.location.pathname.split('page/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex(page => page.title.toLowerCase() === path.toLowerCase());
    }
  }

  darkModeOn() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
