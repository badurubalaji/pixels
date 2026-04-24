import '@angular/compiler';
import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
class TestRootModule {}

getTestBed().initTestEnvironment(
  [BrowserTestingModule, TestRootModule],
  platformBrowserTesting(),
);
