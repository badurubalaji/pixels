import { Component, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ApiService } from '../../core/services/api.service';
import { AiDesignService } from '../../core/services/ai-design.service';
import { CANVAS_PRESETS, CanvasPreset } from '../../core/models/project.model';
import { LOGO_TEMPLATES, LogoTemplate } from '../../core/services/template.service';
import { NewProjectDialog } from './components/new-project-dialog';
import { UserMenuComponent } from '../../shared/components/user-menu.component';

type NavTab = 'home' | 'templates' | 'gallery' | 'projects' | 'stats' | 'trash';

@Component({
  selector: 'app-dashboard',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule,
    MatBadgeModule,
    MatMenuModule,
    UserMenuComponent,
  ],
  template: `
    <div class="dashboard"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      [class.drag-active]="isDragging()"
    >
      @if (isDragging()) {
        <div class="drag-overlay">
          <mat-icon>cloud_upload</mat-icon>
          <h2>Drop image to start a new design</h2>
          <p>Canvas size will match your image dimensions</p>
        </div>
      }
      <!-- Top Navigation Bar -->
      <nav class="top-nav">
        <div class="nav-left">
          <div class="nav-brand" (click)="goToTab('home')">
            <mat-icon class="brand-icon">auto_awesome</mat-icon>
            <span class="brand-name">PixelForge</span>
          </div>

          <div class="nav-links">
            <button
              class="nav-link"
              [class.active]="activeTab() === 'home'"
              (click)="goToTab('home')"
            >
              <mat-icon>home</mat-icon>
              Home
            </button>
            <button
              class="nav-link"
              [class.active]="activeTab() === 'templates'"
              (click)="goToTab('templates')"
            >
              <mat-icon>dashboard_customize</mat-icon>
              Templates
            </button>
            <button
              class="nav-link"
              [class.active]="activeTab() === 'gallery'"
              (click)="onGalleryClick()"
            >
              <mat-icon>public</mat-icon>
              Gallery
            </button>
            <button
              class="nav-link"
              [class.active]="activeTab() === 'projects'"
              (click)="goToTab('projects')"
            >
              <mat-icon>folder</mat-icon>
              Projects
              @if (projectService.projects().length > 0) {
                <span class="nav-badge">{{ projectService.projects().length }}</span>
              }
            </button>

            <button
              class="nav-link"
              [class.active]="activeTab() === 'stats'"
              (click)="goToTab('stats')"
            >
              <mat-icon>insights</mat-icon>
              Stats
            </button>

            @if (projectService.trashedProjects().length > 0) {
              <button
                class="nav-link"
                [class.active]="activeTab() === 'trash'"
                (click)="goToTab('trash')"
              >
                <mat-icon>delete_outline</mat-icon>
                Trash
                <span class="nav-badge">{{ projectService.trashedProjects().length }}</span>
              </button>
            }
          </div>
        </div>

        <div class="nav-right">
          <button mat-flat-button class="create-btn" (click)="openNewProjectDialog()">
            <mat-icon>add</mat-icon>
            <span>Create a design</span>
          </button>

          <button mat-icon-button matTooltip="Toggle theme" (click)="themeService.toggleTheme()">
            <mat-icon>{{ themeService.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <!-- PX-068: unified user menu (replaces bespoke dashboard avatar) -->
          <app-user-menu />
        </div>
      </nav>

      <div class="page-content">
        <!-- ===================== HOME TAB ===================== -->
        @if (activeTab() === 'home') {
          <!-- Hero -->
          <section class="hero">
            <h1>What will you <span class="gradient-text">design</span> today?</h1>
            <p class="hero-sub">Create stunning logos, social posts, presentations and more — free, in your browser.</p>

            <!-- Category shortcuts (Canva-style circles) -->
            <div class="category-shortcuts">
              @for (cat of categoryShortcuts; track cat.name) {
                <button class="cat-shortcut" (click)="createFromCategory(cat)">
                  <div class="cat-circle" [style.background]="cat.gradient">
                    <mat-icon>{{ cat.icon }}</mat-icon>
                  </div>
                  <span>{{ cat.name }}</span>
                </button>
              }
              <button class="cat-shortcut" (click)="openNewProjectDialog()">
                <div class="cat-circle cat-custom">
                  <mat-icon>add</mat-icon>
                </div>
                <span>Custom size</span>
              </button>
              <button class="cat-shortcut" (click)="triggerHomeUpload()">
                <div class="cat-circle cat-upload">
                  <mat-icon>cloud_upload</mat-icon>
                </div>
                <span>Upload</span>
              </button>
              <input type="file" #homeUploadInput hidden accept="image/*" (change)="onHomeUpload($event)" />
            </div>
          </section>

          <!-- Continue where you left off -->
          @if (recentProjects().length > 0) {
            <section class="section">
              <div class="section-header">
                <h2>Continue where you left off</h2>
                <button class="see-all" (click)="goToTab('projects')">All projects</button>
              </div>
              <div class="recents-grid">
                @for (project of recentProjects(); track project.id) {
                  <div class="recent-card" (click)="openProject(project.id)">
                    <div class="recent-thumb">
                      @if (project.thumbnail) {
                        <img [src]="project.thumbnail" [alt]="project.name" />
                      } @else {
                        <div class="thumb-placeholder">
                          <mat-icon>image</mat-icon>
                        </div>
                      }
                      <div class="recent-overlay">
                        <button mat-flat-button class="open-cta">
                          <mat-icon>play_arrow</mat-icon> Continue
                        </button>
                      </div>
                    </div>
                    <div class="recent-meta">
                      <span class="recent-name">{{ project.name }}</span>
                      <span class="recent-time">{{ formatRelativeTime(project.updatedAt) }}</span>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Quick Start Carousel -->
          <section class="section">
            <div class="section-header">
              <h2>Quick Start</h2>
              <button class="see-all" (click)="onGalleryClick()">Browse gallery</button>
            </div>
            <div class="quickstart-carousel">
              <button class="qs-card qs-blank" (click)="openNewProjectDialog()">
                <mat-icon>add_circle_outline</mat-icon>
                <span>Blank Design</span>
                <small>Custom size</small>
              </button>
              @for (preset of quickStartItems; track preset.name) {
                <button class="qs-card" [style.aspectRatio]="preset.width / preset.height + ''"
                  (click)="createFromPreset(preset)">
                  <div class="qs-shape" [style.background]="preset.color"></div>
                  <span>{{ preset.name }}</span>
                  <small>{{ preset.width }}×{{ preset.height }}</small>
                </button>
              }
              @for (tpl of trendingTemplates(); track tpl.id) {
                <button class="qs-card qs-template" (click)="useGalleryTemplate(tpl)">
                  @if (tpl.thumbnail) {
                    <img [src]="tpl.thumbnail" [alt]="tpl.name" />
                  } @else {
                    <div class="qs-shape" style="background:linear-gradient(135deg,#7c3aed,#06b6d4)"></div>
                  }
                  <span>{{ tpl.name }}</span>
                  <small>By {{ tpl.author_name || 'Community' }}</small>
                </button>
              }
            </div>
          </section>

          <!-- Quick Start Presets -->
          <section class="section">
            <div class="section-header">
              <h2>Start with a blank canvas</h2>
              <button class="see-all" (click)="goToTab('templates')">See all templates</button>
            </div>

            <div class="category-chips">
              <mat-chip-set>
                @for (cat of categories; track cat) {
                  <mat-chip
                    [highlighted]="selectedCategory() === cat"
                    (click)="selectedCategory.set(cat)"
                  >{{ cat }}</mat-chip>
                }
              </mat-chip-set>
            </div>

            <div class="preset-grid">
              @for (preset of filteredPresets(); track preset.name) {
                <div class="preset-card" (click)="createFromPreset(preset)">
                  <div class="preset-preview" [style.aspectRatio]="preset.width / preset.height">
                    <mat-icon>{{ getPresetIcon(preset.category) }}</mat-icon>
                  </div>
                  <div class="preset-info">
                    <span class="preset-name">{{ preset.name }}</span>
                    <span class="preset-dims">{{ preset.width }} x {{ preset.height }}</span>
                  </div>
                </div>
              }
              <div class="preset-card custom-card" (click)="openNewProjectDialog()">
                <div class="preset-preview custom-preview">
                  <mat-icon>add</mat-icon>
                </div>
                <div class="preset-info">
                  <span class="preset-name">Custom size</span>
                  <span class="preset-dims">Any dimension</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Recent Projects (quick view) -->
          @if (projectService.projects().length > 0) {
            <section class="section">
              <div class="section-header">
                <h2>Recent designs</h2>
                <button class="see-all" (click)="goToTab('projects')">See all projects</button>
              </div>
              <div class="project-grid">
                @for (project of projectService.projects().slice(0, 4); track project.id) {
                  <div class="project-card" (click)="openProject(project.id)">
                    <div class="project-thumb">
                      @if (project.thumbnail) {
                        <img [src]="project.thumbnail" [alt]="project.name" />
                      } @else {
                        <div class="thumb-placeholder">
                          <mat-icon>image</mat-icon>
                        </div>
                      }
                      <div class="project-overlay">
                        <button mat-icon-button class="delete-btn" matTooltip="Delete" (click)="deleteProject($event, project.id)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                    <div class="project-meta">
                      <span class="project-name">{{ project.name }}</span>
                      <span class="project-dims">{{ project.width }} x {{ project.height }}</span>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Features -->
          <section class="section">
            <h2>What you can do</h2>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon bg-remove"><mat-icon>auto_fix_high</mat-icon></div>
                <h3>AI Background Removal</h3>
                <p>Remove backgrounds instantly with one click using AI — works right in your browser</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon export"><mat-icon>4k</mat-icon></div>
                <h3>4K Export</h3>
                <p>Download transparent PNG, SVG, or WebP up to 4K resolution</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon templates"><mat-icon>dashboard</mat-icon></div>
                <h3>Logo Templates</h3>
                <p>Start from professional templates — monogram, badge, wordmark & more</p>
              </div>
            </div>
          </section>
        }

        <!-- ===================== TEMPLATES TAB ===================== -->
        @if (activeTab() === 'templates') {
          <section class="section">
            <div class="page-title">
              <h1>Templates</h1>
              <p>Start from a professional template and make it yours</p>
            </div>

            <!-- AI Design from prompt -->
            <div class="ai-design-prompt">
              <div class="ai-prompt-header">
                <mat-icon class="ai-prompt-icon">auto_awesome</mat-icon>
                <div>
                  <strong>Describe a design</strong>
                  <span>AI will create a starter layout for you</span>
                </div>
              </div>
              <div class="ai-prompt-row">
                <input
                  type="text"
                  class="ai-prompt-input"
                  [value]="aiDesignPrompt()"
                  (input)="aiDesignPrompt.set($any($event.target).value)"
                  (keydown.enter)="generateAiDesign()"
                  placeholder="e.g. instagram post for a coffee shop sale"
                />
                <button mat-flat-button class="ai-design-btn"
                  [disabled]="!aiDesignPrompt() || generatingAi()"
                  (click)="generateAiDesign()">
                  @if (generatingAi()) {
                    <mat-icon class="spin">autorenew</mat-icon> Generating...
                  } @else {
                    <mat-icon>auto_awesome</mat-icon> Generate
                  }
                </button>
              </div>
              <div class="ai-prompt-suggestions">
                @for (s of aiSuggestionPrompts; track s) {
                  <button class="ai-suggest-chip" (click)="useSuggestion(s)">{{ s }}</button>
                }
              </div>
            </div>

            <!-- Search + category filter -->
            <div class="templates-toolbar">
              <div class="search-wrapper">
                <mat-icon class="search-icon">search</mat-icon>
                <input
                  class="search-input"
                  placeholder="Search templates..."
                  [value]="templateSearch()"
                  (input)="templateSearch.set($any($event.target).value)"
                />
              </div>

              <mat-chip-listbox
                class="template-chip-list"
                [value]="selectedTemplateCategory()"
                (change)="selectedTemplateCategory.set($event.value || 'All')"
                aria-label="Filter templates by category"
              >
                @for (cat of templateCategories; track cat) {
                  <mat-chip-option [value]="cat" [selected]="selectedTemplateCategory() === cat">
                    {{ cat }}
                  </mat-chip-option>
                }
              </mat-chip-listbox>
            </div>

            @if (filteredTemplates().length === 0) {
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <h3>No templates match</h3>
                <button mat-stroked-button (click)="clearTemplateFilters()">Clear filters</button>
              </div>
            } @else {
              <div class="template-section">
                <p class="section-desc">{{ filteredTemplates().length }} template{{ filteredTemplates().length !== 1 ? 's' : '' }} · Click to start designing</p>
                <div class="template-grid">
                  @for (tpl of filteredTemplates(); track tpl.id) {
                    <div class="template-card" (click)="createFromTemplate(tpl)">
                      <div class="tpl-preview">
                        <div class="tpl-icon-wrap">
                          <mat-icon>{{ tpl.icon }}</mat-icon>
                        </div>
                      </div>
                      <div class="tpl-info">
                        <span class="tpl-name">{{ tpl.name }}</span>
                        <span class="tpl-category">{{ tpl.category }}</span>
                        <span class="tpl-desc">{{ tpl.description }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Canvas Size Templates -->
            <div class="template-section">
              <h2>Canvas Sizes</h2>
              <p class="section-desc">Choose a size for your design</p>

              <div class="category-chips">
                <mat-chip-set>
                  @for (cat of categories; track cat) {
                    <mat-chip
                      [highlighted]="selectedCategory() === cat"
                      (click)="selectedCategory.set(cat)"
                    >{{ cat }}</mat-chip>
                  }
                </mat-chip-set>
              </div>

              <div class="preset-grid">
                @for (preset of filteredPresets(); track preset.name) {
                  <div class="preset-card" (click)="createFromPreset(preset)">
                    <div class="preset-preview" [style.aspectRatio]="preset.width / preset.height">
                      <mat-icon>{{ getPresetIcon(preset.category) }}</mat-icon>
                    </div>
                    <div class="preset-info">
                      <span class="preset-name">{{ preset.name }}</span>
                      <span class="preset-dims">{{ preset.width }} x {{ preset.height }}</span>
                    </div>
                  </div>
                }
                <div class="preset-card custom-card" (click)="openNewProjectDialog()">
                  <div class="preset-preview custom-preview">
                    <mat-icon>add</mat-icon>
                  </div>
                  <div class="preset-info">
                    <span class="preset-name">Custom size</span>
                    <span class="preset-dims">Any dimension</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        }

        <!-- ===================== GALLERY TAB ===================== -->
        @if (activeTab() === 'gallery') {
          <section class="section">
            <div class="page-title">
              <h1>Public Gallery</h1>
              <p>Templates shared by the community · Click to use as your starting point</p>
            </div>

            <div class="templates-toolbar">
              <div class="search-wrapper">
                <mat-icon class="search-icon">search</mat-icon>
                <input
                  class="search-input"
                  placeholder="Search public templates..."
                  [value]="gallerySearch()"
                  (input)="onGallerySearch($any($event.target).value)"
                />
              </div>

              <mat-chip-listbox
                class="template-chip-list"
                [value]="galleryCategory()"
                (change)="setGalleryCategory($event.value || 'all')"
                aria-label="Filter gallery by category"
              >
                @for (cat of galleryCategories; track cat) {
                  <mat-chip-option [value]="cat" [selected]="galleryCategory() === cat">
                    {{ cat === 'all' ? 'All' : cat }}
                  </mat-chip-option>
                }
              </mat-chip-listbox>
            </div>

            @if (loadingGallery()) {
              <div class="empty-state">
                <mat-icon>hourglass_empty</mat-icon>
                <h3>Loading templates...</h3>
              </div>
            } @else if (publicTemplates().length === 0) {
              <div class="empty-state">
                <mat-icon>collections</mat-icon>
                <h3>No public templates yet</h3>
                <p>Be the first to publish — open any project and click the Publish button</p>
              </div>
            } @else {
              <div class="project-grid full">
                @for (tpl of publicTemplates(); track tpl.id) {
                  <div class="project-card" (click)="useGalleryTemplate(tpl)">
                    <div class="project-thumb">
                      @if (tpl.thumbnail) {
                        <img [src]="tpl.thumbnail" [alt]="tpl.name" />
                      } @else {
                        <div class="thumb-placeholder">
                          <mat-icon>image</mat-icon>
                        </div>
                      }
                    </div>
                    <div class="project-meta">
                      <span class="project-name">{{ tpl.name }}</span>
                      <span class="project-dims">{{ tpl.width }}×{{ tpl.height }} · by {{ tpl.author_name || 'Anon' }}</span>
                      <div class="gallery-stats">
                        <span class="gallery-cat">{{ tpl.category }}</span>
                        <span class="gallery-uses"><mat-icon>download</mat-icon>{{ tpl.uses_count }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- ===================== PROJECTS TAB ===================== -->
        @if (activeTab() === 'projects') {
          <section class="section">
            <div class="page-title">
              <h1>Your Projects</h1>
              <p>{{ filteredProjects().length }} of {{ projectService.projects().length }} design{{ projectService.projects().length !== 1 ? 's' : '' }}</p>
            </div>

            <!-- Search + Sort controls -->
            <div class="projects-toolbar">
              <div class="search-wrapper">
                <mat-icon class="search-icon">search</mat-icon>
                <input
                  class="search-input"
                  placeholder="Search projects..."
                  [value]="projectSearch()"
                  (input)="projectSearch.set($any($event.target).value)"
                />
                @if (projectSearch()) {
                  <button class="clear-search" (click)="projectSearch.set('')">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>

              <button mat-stroked-button [matMenuTriggerFor]="sortMenu" class="sort-btn">
                <mat-icon>sort</mat-icon>
                {{ sortLabel() }}
              </button>

              @if (allTags().length > 0) {
                <div class="tag-filter-chips">
                  @for (tag of allTags(); track tag) {
                    <button class="filter-chip" [class.active]="tagFilter() === tag"
                      (click)="tagFilter.set(tagFilter() === tag ? null : tag)">{{ tag }}</button>
                  }
                </div>
              }
              <mat-menu #sortMenu="matMenu">
                <button mat-menu-item (click)="projectSort.set('updated')">
                  <mat-icon>update</mat-icon> Recently edited
                </button>
                <button mat-menu-item (click)="projectSort.set('created')">
                  <mat-icon>add_circle_outline</mat-icon> Recently created
                </button>
                <button mat-menu-item (click)="projectSort.set('name')">
                  <mat-icon>sort_by_alpha</mat-icon> Name (A-Z)
                </button>
              </mat-menu>
            </div>

            @if (projectService.projects().length === 0) {
              <div class="empty-state">
                <mat-icon>folder_open</mat-icon>
                <h3>No projects yet</h3>
                <p>Create your first design to get started</p>
                <button mat-flat-button class="create-btn" (click)="openNewProjectDialog()">
                  <mat-icon>add</mat-icon>
                  Create a design
                </button>
              </div>
            } @else if (filteredProjects().length === 0) {
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <h3>No projects match "{{ projectSearch() }}"</h3>
                <button mat-stroked-button (click)="projectSearch.set('')">Clear search</button>
              </div>
            } @else {
              <div class="project-grid full">
                @for (project of filteredProjects(); track project.id) {
                  <div class="project-card" (click)="openProject(project.id)">
                    <div class="project-thumb">
                      @if (project.thumbnail) {
                        <img [src]="project.thumbnail" [alt]="project.name" />
                      } @else {
                        <div class="thumb-placeholder">
                          <mat-icon>image</mat-icon>
                        </div>
                      }
                      <div class="project-overlay">
                        <button mat-icon-button class="overlay-btn" matTooltip="Duplicate" (click)="duplicateProject($event, project.id)">
                          <mat-icon>content_copy</mat-icon>
                        </button>
                        <button mat-icon-button class="overlay-btn" matTooltip="Edit tags" (click)="editTags($event, project.id, project.tags ?? [])">
                          <mat-icon>label</mat-icon>
                        </button>
                        <button mat-icon-button class="overlay-btn delete-btn" matTooltip="Delete" (click)="deleteProject($event, project.id)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                    <div class="project-meta">
                      <span class="project-name">{{ project.name }}</span>
                      <span class="project-dims">{{ project.width }} x {{ project.height }}</span>
                      @if (project.tags?.length) {
                        <div class="project-tags">
                          @for (tag of project.tags; track tag) {
                            <span class="project-tag" (click)="filterByTag($event, tag)">{{ tag }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- ===================== STATS TAB ===================== -->
        @if (activeTab() === 'stats') {
          <section class="section">
            <div class="page-title">
              <h1>Your Design Stats</h1>
              <p>Insights from your projects and activity</p>
            </div>

            <!-- Stat cards -->
            <div class="stats-grid">
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:#7c3aed">folder</mat-icon>
                <div class="stat-value">{{ stats().totalProjects }}</div>
                <div class="stat-label">Total Projects</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:#06b6d4">today</mat-icon>
                <div class="stat-value">{{ stats().createdThisWeek }}</div>
                <div class="stat-label">Created This Week</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:#10b981">edit_calendar</mat-icon>
                <div class="stat-value">{{ stats().editedThisWeek }}</div>
                <div class="stat-label">Edited This Week</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:#f59e0b">label</mat-icon>
                <div class="stat-value">{{ stats().uniqueTags }}</div>
                <div class="stat-label">Unique Tags</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:#ec4899">straighten</mat-icon>
                <div class="stat-value">{{ stats().avgDimensions }}</div>
                <div class="stat-label">Average Canvas Size</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:#ef4444">delete_outline</mat-icon>
                <div class="stat-value">{{ stats().trashedCount }}</div>
                <div class="stat-label">In Trash</div>
              </div>
            </div>

            <!-- Activity chart -->
            <h2 class="stats-section-title">Activity (Last 14 Days)</h2>
            <div class="activity-chart">
              @for (day of activityChart(); track day.date) {
                <div class="activity-bar-wrap" [matTooltip]="day.label + ': ' + day.count + ' edit' + (day.count !== 1 ? 's' : '')">
                  <div class="activity-bar"
                    [style.height.%]="(day.count / activityMax()) * 100"
                    [class.has-activity]="day.count > 0"></div>
                  <span class="activity-day">{{ day.date.getDate() }}</span>
                </div>
              }
            </div>

            <!-- Most used categories -->
            <h2 class="stats-section-title">Projects by Size Category</h2>
            <div class="category-bars">
              @for (cat of categoryBreakdown(); track cat.name) {
                <div class="category-row">
                  <span class="cat-name">{{ cat.name }}</span>
                  <div class="cat-track">
                    <div class="cat-fill"
                      [style.width.%]="(cat.count / stats().totalProjects) * 100"></div>
                  </div>
                  <span class="cat-count">{{ cat.count }}</span>
                </div>
              }
            </div>
          </section>
        }

        <!-- ===================== TRASH TAB ===================== -->
        @if (activeTab() === 'trash') {
          <section class="section">
            <div class="page-title">
              <h1>Trash</h1>
              <p>{{ projectService.trashedProjects().length }} item{{ projectService.trashedProjects().length !== 1 ? 's' : '' }} · Auto-deleted after 30 days</p>
            </div>

            @if (projectService.trashedProjects().length === 0) {
              <div class="empty-state">
                <mat-icon>delete_outline</mat-icon>
                <h3>Trash is empty</h3>
                <p>Deleted projects appear here</p>
              </div>
            } @else {
              <div class="trash-actions">
                <button mat-stroked-button class="empty-trash-btn" (click)="emptyTrash()">
                  <mat-icon>delete_forever</mat-icon>
                  Empty trash
                </button>
              </div>

              <div class="project-grid full">
                @for (project of projectService.trashedProjects(); track project.id) {
                  <div class="project-card trashed">
                    <div class="project-thumb">
                      @if (project.thumbnail) {
                        <img [src]="project.thumbnail" [alt]="project.name" />
                      } @else {
                        <div class="thumb-placeholder">
                          <mat-icon>image</mat-icon>
                        </div>
                      }
                      <div class="project-overlay">
                        <button mat-icon-button class="overlay-btn" matTooltip="Restore" (click)="restoreProject(project.id)">
                          <mat-icon>restore</mat-icon>
                        </button>
                        <button mat-icon-button class="overlay-btn delete-btn" matTooltip="Delete forever" (click)="permanentDelete(project.id)">
                          <mat-icon>delete_forever</mat-icon>
                        </button>
                      </div>
                    </div>
                    <div class="project-meta">
                      <span class="project-name">{{ project.name }}</span>
                      <span class="project-dims">Deleted {{ formatDate(project.deletedAt) }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      background: var(--px-page, #f8fafc);
      color: var(--px-ink, #0f172a);
    }

    .dashboard {
      position: relative;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      background: transparent;
      color: var(--px-ink, #0f172a);
      -webkit-overflow-scrolling: touch;
    }
    /* Ambient decorative layer — matches /hub, /gallery, /profile. */
    .dashboard::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background-image:
        radial-gradient(
          ellipse at 80% -10%,
          rgba(124, 58, 237, 0.10) 0%,
          transparent 45%
        ),
        radial-gradient(
          ellipse at -10% 110%,
          rgba(6, 182, 212, 0.08) 0%,
          transparent 45%
        ),
        radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.05) 1px, transparent 0);
      background-size: auto, auto, 24px 24px;
    }
    .dashboard > * { position: relative; z-index: 1; }

    .drag-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 12, 41, 0.92);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      gap: 16px;
      border: 4px dashed var(--mat-sys-primary);
      border-radius: 16px;
      pointer-events: none;
      animation: pulse-border 1.5s ease-in-out infinite;

      mat-icon {
        font-size: 96px;
        height: 96px;
        width: 96px;
        color: var(--mat-sys-primary);
      }

      h2 {
        margin: 0;
        font-size: 1.6rem;
        color: white;
      }

      p {
        margin: 0;
        font-size: 1rem;
        opacity: 0.7;
        color: white;
      }
    }

    @keyframes pulse-border {
      0%, 100% { border-color: rgba(124, 58, 237, 0.6); }
      50% { border-color: rgba(124, 58, 237, 1); }
    }

    /* === Top Nav (PX-068 redesigned to match /hub, /gallery, /profile) === */
    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      height: 68px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: saturate(1.4) blur(10px);
      border-bottom: 1px solid var(--px-line, #e2e8f0);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 28px;
    }

    .nav-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;

      .brand-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, var(--px-violet, #7c3aed) 0%, var(--px-cyan, #06b6d4) 100%);
        color: #ffffff !important;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28),
          0 4px 12px -4px rgba(124, 58, 237, 0.45);
        font-size: 20px !important;
      }

      .brand-name {
        font-size: 1.05rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--px-ink, #0f172a);
      }
    }

    .nav-links {
      display: flex;
      gap: 2px;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: none;
      background: none;
      color: var(--px-ink-soft, #334155);
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      border-radius: 10px;
      transition: background 160ms ease, color 160ms ease;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
      }

      &:hover {
        color: var(--px-ink, #0f172a);
        background: #f1f5f9;
      }

      &.active {
        color: var(--px-violet, #7c3aed);
        background: rgba(124, 58, 237, 0.10);
      }
      &.active .nav-badge {
        background: var(--px-violet, #7c3aed);
      }

      .nav-badge {
        background: var(--px-ink-soft, #334155);
        color: #ffffff;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
      }
    }

    .nav-right {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .create-btn {
      height: 40px !important;
      padding: 0 18px !important;
      background: linear-gradient(135deg, var(--px-violet, #7c3aed) 0%, #a855f7 100%) !important;
      color: #ffffff !important;
      border-radius: 10px !important;
      font-weight: 600;
      letter-spacing: 0.005em;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.28);
      transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
    }
    .create-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(124, 58, 237, 0.36);
      filter: brightness(1.05);
    }
    .create-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    @media (max-width: 820px) {
      .create-btn span { display: none; }
      .create-btn { padding: 0 12px !important; min-width: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .create-btn, .nav-link { transition: none !important; }
      .create-btn:hover { transform: none !important; }
    }

    .user-info {
      padding: 12px 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong { font-size: 0.9rem; }
      span { font-size: 0.78rem; opacity: 0.6; }
    }

    .projects-toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      align-items: center;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      max-width: 400px;

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.4;
        font-size: 20px;
        height: 20px;
        width: 20px;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 10px 40px 10px 40px;
        background: var(--mat-sys-surface-container);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 10px;
        color: inherit;
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.15s;

        &:focus { border-color: var(--mat-sys-primary); }
      }

      .clear-search {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        opacity: 0.5;
        padding: 4px;
        display: flex;

        mat-icon { font-size: 18px; height: 18px; width: 18px; }
        &:hover { opacity: 1; }
      }
    }

    .sort-btn {
      height: 40px;
    }

    .overlay-btn {
      background: rgba(255,255,255,0.1) !important;
      backdrop-filter: blur(8px);
    }

    .tag-filter-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-chip {
      padding: 4px 12px;
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      color: inherit;
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.15s;

      &.active {
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        border-color: var(--mat-sys-primary);
      }

      &:not(.active):hover {
        border-color: var(--mat-sys-primary);
      }
    }

    .project-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }

    /* === AI Design Prompt === */
    .ai-design-prompt {
      padding: 20px;
      background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1));
      border: 1px solid rgba(124, 58, 237, 0.3);
      border-radius: 14px;
      margin-bottom: 24px;
    }

    .ai-prompt-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;

      .ai-prompt-icon {
        color: var(--mat-sys-primary);
        font-size: 28px;
        height: 28px;
        width: 28px;
      }

      strong { display: block; font-size: 0.95rem; }
      span { display: block; font-size: 0.78rem; opacity: 0.65; }
    }

    .ai-prompt-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .ai-prompt-input {
      flex: 1;
      padding: 12px 16px;
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 10px;
      font-size: 0.92rem;
      color: inherit;
      outline: none;

      &:focus { border-color: var(--mat-sys-primary); }
    }

    .ai-design-btn {
      background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%) !important;
      color: white !important;
      padding: 0 24px;
      height: 44px;

      .spin { animation: spin 1s linear infinite; }
    }

    .ai-prompt-suggestions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .ai-suggest-chip {
      padding: 5px 12px;
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      font-size: 0.78rem;
      color: inherit;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
      }
    }

    /* === Stats === */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 32px;
    }

    .stat-card {
      padding: 20px;
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid var(--mat-sys-outline-variant);

      .stat-icon {
        font-size: 28px;
        height: 28px;
        width: 28px;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 1.6rem;
        font-weight: 700;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
      }

      .stat-label {
        font-size: 0.78rem;
        opacity: 0.6;
      }
    }

    .stats-section-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 32px 0 16px;
    }

    .activity-chart {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 160px;
      padding: 16px;
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
    }

    .activity-bar-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      height: 100%;
      cursor: default;
    }

    .activity-bar {
      width: 100%;
      max-width: 32px;
      background: var(--mat-sys-surface-container-highest);
      border-radius: 4px;
      min-height: 4px;
      transition: background 0.15s;

      &.has-activity {
        background: linear-gradient(180deg, #7c3aed, #06b6d4);
      }
    }

    .activity-day {
      font-size: 0.7rem;
      opacity: 0.5;
    }

    .category-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
    }

    .category-row {
      display: flex;
      align-items: center;
      gap: 12px;

      .cat-name {
        width: 130px;
        font-size: 0.85rem;
      }

      .cat-track {
        flex: 1;
        height: 8px;
        background: var(--mat-sys-surface-container-highest);
        border-radius: 4px;
        overflow: hidden;
      }

      .cat-fill {
        height: 100%;
        background: linear-gradient(90deg, #7c3aed, #06b6d4);
        transition: width 0.4s;
      }

      .cat-count {
        width: 36px;
        text-align: right;
        font-size: 0.85rem;
        font-variant-numeric: tabular-nums;
        opacity: 0.7;
      }
    }

    /* === Category shortcuts (Canva-style circles) === */
    .category-shortcuts {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 28px;
    }

    .cat-shortcut {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0;
      min-width: 74px;
      transition: transform 0.15s;

      &:hover {
        transform: translateY(-3px);

        .cat-circle {
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
      }

      .cat-circle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: box-shadow 0.15s;

        mat-icon {
          font-size: 26px;
          height: 26px;
          width: 26px;
        }
      }

      .cat-custom {
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-primary);
        border: 2px dashed var(--mat-sys-outline);
      }

      .cat-upload {
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-primary);
      }

      span {
        font-size: 0.78rem;
        font-weight: 500;
      }
    }

    /* === Recents grid (large hero cards) === */
    .recents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }

    .recent-card {
      position: relative;
      cursor: pointer;
      border-radius: 12px;
      overflow: hidden;
      background: var(--mat-sys-surface-container);
      transition: transform 0.15s, box-shadow 0.15s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

        .recent-overlay { opacity: 1; }
      }
    }

    .recent-thumb {
      position: relative;
      aspect-ratio: 16 / 10;
      background: var(--mat-sys-surface-container-high);
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .thumb-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        opacity: 0.3;
      }
    }

    .recent-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s;

      .open-cta {
        background: var(--mat-sys-primary) !important;
        color: var(--mat-sys-on-primary) !important;
      }
    }

    .recent-meta {
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .recent-name {
        font-size: 0.92rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .recent-time {
        font-size: 0.74rem;
        opacity: 0.55;
      }
    }

    /* === Quick Start Carousel === */
    .quickstart-carousel {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 4px 0 12px;
      scroll-snap-type: x proximity;
      scrollbar-width: thin;
    }

    .qs-card {
      flex-shrink: 0;
      width: 160px;
      min-height: 160px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 4px;
      padding: 12px;
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      cursor: pointer;
      color: inherit;
      scroll-snap-align: start;
      transition: all 0.15s;

      &:hover {
        border-color: var(--mat-sys-primary);
        transform: translateY(-2px);
      }

      mat-icon {
        font-size: 28px;
        height: 28px;
        width: 28px;
        opacity: 0.6;
        margin-bottom: 8px;
      }

      .qs-shape {
        width: 100%;
        flex: 1;
        min-height: 80px;
        border-radius: 8px;
        margin-bottom: 8px;
      }

      img {
        width: 100%;
        flex: 1;
        min-height: 80px;
        border-radius: 8px;
        margin-bottom: 8px;
        object-fit: cover;
        background: var(--mat-sys-surface-container-high);
      }

      span {
        font-size: 0.82rem;
        font-weight: 600;
        text-align: center;
      }

      small {
        font-size: 0.7rem;
        opacity: 0.55;
      }

      &.qs-blank {
        background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1));
        border-style: dashed;

        mat-icon {
          color: var(--mat-sys-primary);
          opacity: 1;
        }
      }

      &.qs-template {
        background: var(--mat-sys-surface-container-high);
      }
    }

    .gallery-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      font-size: 0.7rem;
      opacity: 0.7;

      .gallery-cat {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        padding: 1px 8px;
        border-radius: 8px;
      }

      .gallery-uses {
        display: flex;
        align-items: center;
        gap: 2px;

        mat-icon {
          font-size: 12px;
          height: 12px;
          width: 12px;
        }
      }
    }

    .templates-toolbar {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 24px;
    }

    .template-cat-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .template-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .trash-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .empty-trash-btn {
      color: #ef4444;
    }

    .project-card.trashed .project-thumb {
      opacity: 0.6;
    }

    .project-tag {
      padding: 2px 8px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      border-radius: 8px;
      font-size: 0.7rem;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }

    /* === Page Content === */
    .page-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px 64px;
    }

    .page-title {
      padding: 40px 0 24px;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 6px;
        color: #fafafa;
      }

      p {
        margin: 0;
        color: #71717a;
        font-size: 0.95rem;
      }
    }

    /* === Sections === */
    .section {
      margin-bottom: 40px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h2 {
        font-size: 1.15rem;
        font-weight: 600;
        margin: 0;
        color: #fafafa;
      }
    }

    h2 {
      font-size: 1.15rem;
      font-weight: 600;
      margin: 0 0 16px;
      color: #fafafa;
    }

    .see-all {
      background: none;
      border: none;
      color: var(--mat-sys-primary);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
      transition: background 0.15s;

      &:hover { background: rgba(124, 58, 237, 0.1); }
    }

    .section-desc {
      color: #71717a;
      font-size: 0.85rem;
      margin: -8px 0 16px;
    }

    /* === Hero === */
    .hero {
      text-align: center;
      padding: 56px 0 40px;

      h1 {
        font-size: 2.8rem;
        font-weight: 800;
        line-height: 1.15;
        margin: 0 0 14px;
        letter-spacing: -1px;
        color: #fafafa;
      }

      .gradient-text {
        background: linear-gradient(135deg, #7c3aed, #0ea5e9, #e91e63);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-sub {
        font-size: 1.1rem;
        color: #71717a;
        line-height: 1.5;
        margin: 0;
        max-width: 600px;
        margin: 0 auto;
      }
    }

    /* === Category Chips === */
    .category-chips {
      margin-bottom: 16px;
      mat-chip { cursor: pointer; }
    }

    /* === Preset Grid === */
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
      gap: 14px;
    }

    .preset-card {
      cursor: pointer;
      border-radius: 12px;
      overflow: hidden;
      background: #18181b;
      border: 1px solid #27272a;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        border-color: var(--mat-sys-primary);
      }

      .preset-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #1e1e22;
        min-height: 90px;
        max-height: 130px;

        mat-icon { font-size: 32px; height: 32px; width: 32px; opacity: 0.2; }
      }

      &.custom-card .custom-preview {
        background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(14,165,233,0.12));
        mat-icon { opacity: 0.5; color: var(--mat-sys-primary); }
      }

      .preset-info {
        padding: 10px 12px;
        .preset-name { display: block; font-size: 0.82rem; font-weight: 500; color: #e4e4e7; }
        .preset-dims { font-size: 0.7rem; color: #52525b; }
      }
    }

    /* === Template Grid === */
    .template-section {
      margin-bottom: 40px;
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .template-card {
      cursor: pointer;
      border-radius: 14px;
      overflow: hidden;
      background: #18181b;
      border: 1px solid #27272a;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 28px rgba(0,0,0,0.35);
        border-color: var(--mat-sys-primary);
      }

      .tpl-preview {
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1a1a2e, #16213e);

        .tpl-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 28px;
            height: 28px;
            width: 28px;
            color: var(--mat-sys-primary);
          }
        }
      }

      .tpl-info {
        padding: 14px 16px;

        .tpl-name {
          display: block;
          font-size: 0.95rem;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 2px;
        }

        .tpl-category {
          display: block;
          font-size: 0.72rem;
          color: var(--mat-sys-primary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .tpl-desc {
          font-size: 0.78rem;
          color: #71717a;
        }
      }
    }

    /* === Project Grid === */
    .project-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;

      &.full {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      }
    }

    .project-card {
      cursor: pointer;
      border-radius: 12px;
      overflow: hidden;
      background: #18181b;
      border: 1px solid #27272a;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        border-color: #3f3f46;
        .project-overlay { opacity: 1; }
      }

      .project-thumb {
        height: 150px;
        position: relative;
        overflow: hidden;

        img { width: 100%; height: 100%; object-fit: cover; }

        .thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e1e22;
          mat-icon { font-size: 48px; height: 48px; width: 48px; opacity: 0.1; }
        }
      }

      .project-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        padding: 8px;
        opacity: 0;
        transition: opacity 0.2s;
        .delete-btn { color: white; }
      }

      .project-meta {
        padding: 12px 14px;
        .project-name {
          display: block;
          font-size: 0.88rem;
          font-weight: 500;
          color: #e4e4e7;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .project-dims { font-size: 0.72rem; color: #52525b; }
      }
    }

    /* === Empty State === */
    .empty-state {
      text-align: center;
      padding: 80px 24px;

      mat-icon {
        font-size: 72px;
        height: 72px;
        width: 72px;
        color: #3f3f46;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 1.3rem;
        font-weight: 600;
        color: #a1a1aa;
      }

      p {
        margin: 0 0 24px;
        color: #52525b;
      }
    }

    /* === Features === */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .feature-card {
      padding: 24px;
      border-radius: 14px;
      background: #18181b;
      border: 1px solid #27272a;

      .feature-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
        mat-icon { color: white; font-size: 22px; height: 22px; width: 22px; }
        &.bg-remove { background: linear-gradient(135deg, #e91e63, #9c27b0); }
        &.export { background: linear-gradient(135deg, #0ea5e9, #7c3aed); }
        &.templates { background: linear-gradient(135deg, #4caf50, #00bcd4); }
      }

      h3 { margin: 0 0 6px; font-size: 0.95rem; font-weight: 600; color: #e4e4e7; }
      p { margin: 0; font-size: 0.82rem; color: #71717a; line-height: 1.5; }
    }
  `],
})
export class Dashboard {
  readonly projectService = inject(ProjectService);
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly apiService = inject(ApiService);
  private readonly aiDesign = inject(AiDesignService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  /** Set the active tab and reflect it in the URL. */
  goToTab(tab: NavTab): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
    if (tab === 'gallery') this.loadGallery();
  }

  // AI design state
  readonly aiDesignPrompt = signal('');
  readonly generatingAi = signal(false);
  readonly aiSuggestionPrompts = [
    'Instagram post for coffee shop sale',
    'Minimalist logo for tech startup',
    'Luxury event invitation banner',
    'Playful birthday party flyer',
    'Professional product launch ad',
  ];

  useSuggestion(s: string): void {
    this.aiDesignPrompt.set(s);
    this.generateAiDesign();
  }

  async generateAiDesign(): Promise<void> {
    const prompt = this.aiDesignPrompt();
    if (!prompt) return;

    this.generatingAi.set(true);
    try {
      // Create a new project with default size first
      const project = this.projectService.createProject('AI Design', 1080, 1080);
      // Navigate to editor; AI generation happens after editor loads
      sessionStorage.setItem('pf_ai_design_prompt', prompt);
      this.router.navigate(['/editor', project.id]);
    } finally {
      this.generatingAi.set(false);
    }
  }

  constructor() {
    // Load trending templates for the home carousel
    this.apiService.listPublicTemplates().subscribe(templates => {
      this.trendingTemplates.set(templates.slice(0, 4));
    });

    // Sync activeTab with URL query param (?tab=)
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab') as NavTab | null;
      const validTabs: NavTab[] = ['home', 'templates', 'gallery', 'projects', 'stats', 'trash'];
      if (tab && validTabs.includes(tab) && this.activeTab() !== tab) {
        this.activeTab.set(tab);
        if (tab === 'gallery') this.loadGallery();
      }
    });
  }

  readonly userInitial = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '?';
    const source = user.name || user.email;
    return source.charAt(0).toUpperCase();
  });

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }

  logout(): void {
    this.authService.logout();
  }

  readonly activeTab = signal<NavTab>('home');
  readonly presets = CANVAS_PRESETS;
  readonly logoTemplates = LOGO_TEMPLATES;
  readonly categories = ['All', 'Logo', 'Standard', 'Social'];
  readonly selectedCategory = signal('All');

  readonly projectSearch = signal('');
  readonly projectSort = signal<'updated' | 'created' | 'name'>('updated');

  readonly sortLabel = computed(() => {
    switch (this.projectSort()) {
      case 'created': return 'Newest';
      case 'name': return 'A-Z';
      default: return 'Recent';
    }
  });

  readonly tagFilter = signal<string | null>(null);

  // Template marketplace
  readonly templateSearch = signal('');
  readonly selectedTemplateCategory = signal<string>('All');
  readonly templateCategories = ['All', 'Logo', 'Social', 'Marketing'];

  readonly filteredTemplates = computed(() => {
    const search = this.templateSearch().toLowerCase();
    const cat = this.selectedTemplateCategory();
    let templates = this.logoTemplates;

    if (cat !== 'All') {
      templates = templates.filter(t => t.category === cat);
    }
    if (search) {
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
      );
    }
    return templates;
  });

  clearTemplateFilters(): void {
    this.templateSearch.set('');
    this.selectedTemplateCategory.set('All');
  }

  // Recent projects (last 4, sorted by updated)
  readonly recentProjects = computed(() => {
    return [...this.projectService.projects()]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  });

  readonly categoryShortcuts = [
    { name: 'Logo',           icon: 'auto_awesome',    width: 1000, height: 1000, gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
    { name: 'Presentation',   icon: 'slideshow',        width: 1920, height: 1080, gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
    { name: 'Social Post',    icon: 'photo_camera',     width: 1080, height: 1080, gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)' },
    { name: 'Story',          icon: 'smartphone',       width: 1080, height: 1920, gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
    { name: 'Video',          icon: 'play_circle',      width: 1280, height: 720,  gradient: 'linear-gradient(135deg,#ef4444,#7c3aed)' },
    { name: 'Doc',            icon: 'description',      width: 794,  height: 1123, gradient: 'linear-gradient(135deg,#3b82f6,#0ea5e9)' },
    { name: 'Banner',         icon: 'view_carousel',    width: 1500, height: 500,  gradient: 'linear-gradient(135deg,#10b981,#059669)' },
    { name: 'Business Card',  icon: 'contact_mail',     width: 1050, height: 600,  gradient: 'linear-gradient(135deg,#64748b,#334155)' },
    { name: 'Poster',         icon: 'campaign',         width: 800,  height: 1200, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { name: 'Email',          icon: 'mail',             width: 600,  height: 800,  gradient: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
  ];

  createFromCategory(cat: { name: string; width: number; height: number }): void {
    const project = this.projectService.createProject(cat.name, cat.width, cat.height);
    this.router.navigate(['/editor', project.id]);
  }

  triggerHomeUpload(): void {
    const input = document.querySelector('input[type="file"][hidden][accept="image/*"]') as HTMLInputElement;
    input?.click();
  }

  onHomeUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    // Reuse the drag-drop logic — create project sized to image
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const project = this.projectService.createProject(
          file.name.replace(/\.[^.]+$/, ''), img.width, img.height,
        );
        const canvasJson = JSON.stringify({
          version: '7.0.0',
          objects: [{
            type: 'FabricImage', src: dataUrl,
            left: img.width / 2, top: img.height / 2,
            originX: 'center', originY: 'center', crossOrigin: 'anonymous',
          }],
          background: '#ffffff',
        });
        this.projectService.saveCanvasState(project.id, canvasJson, dataUrl);
        this.router.navigate(['/editor', project.id]);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Quick Start carousel items
  readonly quickStartItems = [
    { name: 'Logo', width: 1000, height: 1000, category: 'Logo', color: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
    { name: 'Instagram Post', width: 1080, height: 1080, category: 'Social', color: 'linear-gradient(135deg,#ec4899,#a855f7)' },
    { name: 'Story', width: 1080, height: 1920, category: 'Social', color: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
    { name: 'Presentation', width: 1920, height: 1080, category: 'Standard', color: 'linear-gradient(135deg,#10b981,#059669)' },
    { name: 'YouTube Thumb', width: 1280, height: 720, category: 'Social', color: 'linear-gradient(135deg,#ef4444,#7c3aed)' },
  ];

  // Trending templates from gallery
  readonly trendingTemplates = signal<any[]>([]);

  // Stats
  readonly stats = computed(() => {
    const projects = this.projectService.projects();
    const trashed = this.projectService.trashedProjects();
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const tagSet = new Set<string>();
    let totalW = 0, totalH = 0;
    for (const p of projects) {
      p.tags?.forEach(t => tagSet.add(t));
      totalW += p.width;
      totalH += p.height;
    }
    const count = projects.length || 1;

    return {
      totalProjects: projects.length,
      createdThisWeek: projects.filter(p => new Date(p.createdAt).getTime() > weekAgo).length,
      editedThisWeek: projects.filter(p => new Date(p.updatedAt).getTime() > weekAgo).length,
      uniqueTags: tagSet.size,
      avgDimensions: projects.length ? `${Math.round(totalW / count)}×${Math.round(totalH / count)}` : '—',
      trashedCount: trashed.length,
    };
  });

  readonly activityChart = computed(() => {
    const days: { date: Date; count: number; label: string }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        count: 0,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      });
    }

    for (const p of this.projectService.projects()) {
      const updated = new Date(p.updatedAt);
      updated.setHours(0, 0, 0, 0);
      const day = days.find(d => d.date.getTime() === updated.getTime());
      if (day) day.count++;
    }

    return days;
  });

  readonly activityMax = computed(() => {
    const max = Math.max(...this.activityChart().map(d => d.count));
    return Math.max(1, max);
  });

  readonly categoryBreakdown = computed(() => {
    const buckets = new Map<string, number>();
    for (const p of this.projectService.projects()) {
      const ratio = p.width / p.height;
      let cat: string;
      if (Math.abs(ratio - 1) < 0.05) cat = 'Square';
      else if (ratio > 1.7) cat = 'Wide / Banner';
      else if (ratio > 1) cat = 'Landscape';
      else if (ratio > 0.6) cat = 'Portrait';
      else cat = 'Tall / Story';
      buckets.set(cat, (buckets.get(cat) || 0) + 1);
    }
    return Array.from(buckets.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  // Drag-and-drop state
  readonly isDragging = signal(false);
  private dragCounter = 0;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && Array.from(event.dataTransfer.items).some(i => i.type.startsWith('image/'))) {
      this.dragCounter++;
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.isDragging.set(false);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter = 0;
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Create new project sized to the image
        const project = this.projectService.createProject(
          file.name.replace(/\.[^.]+$/, ''),
          img.width,
          img.height,
        );

        // Save the image as the canvas content (encoded as a Fabric.js canvas JSON with one image)
        const canvasJson = JSON.stringify({
          version: '7.0.0',
          objects: [{
            type: 'FabricImage',
            src: dataUrl,
            left: img.width / 2,
            top: img.height / 2,
            originX: 'center',
            originY: 'center',
            crossOrigin: 'anonymous',
          }],
          background: '#ffffff',
        });

        this.projectService.saveCanvasState(project.id, canvasJson, dataUrl);
        this.router.navigate(['/editor', project.id]);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  formatRelativeTime(date: Date | string): string {
    const d = new Date(date);
    const secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 60) return 'Just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
    return d.toLocaleDateString();
  }

  // Gallery state
  readonly publicTemplates = signal<any[]>([]);
  readonly loadingGallery = signal(false);
  readonly gallerySearch = signal('');
  readonly galleryCategory = signal<string>('all');
  readonly galleryCategories = ['all', 'Logo', 'Social', 'Marketing', 'Print', 'Other'];

  private gallerySearchTimer: any = null;

  onGalleryClick(): void {
    this.goToTab('gallery');
  }

  loadGallery(): void {
    this.loadingGallery.set(true);
    this.apiService.listPublicTemplates(this.galleryCategory(), this.gallerySearch()).subscribe({
      next: (templates) => {
        this.publicTemplates.set(templates);
        this.loadingGallery.set(false);
      },
      error: () => this.loadingGallery.set(false),
    });
  }

  setGalleryCategory(cat: string): void {
    this.galleryCategory.set(cat);
    this.loadGallery();
  }

  onGallerySearch(text: string): void {
    this.gallerySearch.set(text);
    if (this.gallerySearchTimer) clearTimeout(this.gallerySearchTimer);
    this.gallerySearchTimer = setTimeout(() => this.loadGallery(), 350);
  }

  useGalleryTemplate(tpl: any): void {
    // Fetch full template (with canvas_json), create a new local project, navigate to editor
    this.apiService.getPublicTemplate(tpl.id).subscribe({
      next: (full) => {
        const newProject = this.projectService.createProject(
          `${full.name} (copy)`,
          full.width,
          full.height,
        );
        // Save canvas state to the new project
        this.projectService.saveCanvasState(newProject.id, full.canvas_json, full.thumbnail || '');
        this.router.navigate(['/editor', newProject.id]);
      },
    });
  }

  readonly filteredProjects = computed(() => {
    let projects = [...this.projectService.projects()];
    const search = this.projectSearch().toLowerCase();
    if (search) {
      projects = projects.filter(p => p.name.toLowerCase().includes(search) || p.tags?.some(t => t.toLowerCase().includes(search)));
    }
    const tag = this.tagFilter();
    if (tag) {
      projects = projects.filter(p => p.tags?.includes(tag));
    }
    const sort = this.projectSort();
    projects.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return projects;
  });

  readonly allTags = computed(() => {
    const tags = new Set<string>();
    this.projectService.projects().forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  });

  filterByTag(event: Event, tag: string): void {
    event.stopPropagation();
    this.tagFilter.set(this.tagFilter() === tag ? null : tag);
  }

  editTags(event: Event, projectId: string, currentTags: string[]): void {
    event.stopPropagation();
    const tagInput = prompt('Edit tags (comma-separated):', currentTags.join(', '));
    if (tagInput === null) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(t => t);
    this.projectService.setTags(projectId, tags);
  }

  readonly filteredPresets = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'All') return this.presets;
    return this.presets.filter(p => p.category === cat);
  });

  getPresetIcon(category: string): string {
    switch (category) {
      case 'Logo': return 'star';
      case 'Social': return 'share';
      default: return 'crop_landscape';
    }
  }

  createFromPreset(preset: CanvasPreset): void {
    const project = this.projectService.createProject(preset.name, preset.width, preset.height);
    this.router.navigate(['/editor', project.id]);
  }

  createFromTemplate(tpl: LogoTemplate): void {
    // Create a 1000x1000 logo project, editor will apply the template
    const project = this.projectService.createProject(tpl.name, 1000, 1000);
    this.router.navigate(['/editor', project.id], { queryParams: { template: tpl.id } });
  }

  openNewProjectDialog(): void {
    const dialogRef = this.dialog.open(NewProjectDialog, { width: '420px' });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const project = this.projectService.createProject(result.name, result.width, result.height);
        this.router.navigate(['/editor', project.id]);
      }
    });
  }

  openProject(id: string): void {
    this.router.navigate(['/editor', id]);
  }

  deleteProject(event: Event, id: string): void {
    event.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    this.projectService.deleteProject(id);
  }

  duplicateProject(event: Event, id: string): void {
    event.stopPropagation();
    this.projectService.duplicateProject(id);
  }

  // --- Trash actions ---

  restoreProject(id: string): void {
    this.projectService.restoreProject(id);
  }

  permanentDelete(id: string): void {
    if (!confirm('Permanently delete this project? This cannot be undone.')) return;
    this.projectService.permanentlyDelete(id);
  }

  emptyTrash(): void {
    const count = this.projectService.trashedProjects().length;
    if (!confirm(`Permanently delete all ${count} project(s) in trash?`)) return;
    this.projectService.emptyTrash();
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  }
}
