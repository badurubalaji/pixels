# Graph Report - /home/ashulabs/workspace/pixels/pixelforge  (2026-04-23)

## Corpus Check
- 105 files · ~84,009 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 946 nodes · 1596 edges · 36 communities detected
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 428 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Animation Engine|Animation Engine]]
- [[_COMMUNITY_Backend Asset + Auth API|Backend Asset + Auth API]]
- [[_COMMUNITY_Alignment & Arrangement Tools|Alignment & Arrangement Tools]]
- [[_COMMUNITY_Background Removal|Background Removal]]
- [[_COMMUNITY_Canvas Text & Export Ops|Canvas Text & Export Ops]]
- [[_COMMUNITY_API Service (Core HTTP)|API Service (Core HTTP)]]
- [[_COMMUNITY_Dashboard & Project Management|Dashboard & Project Management]]
- [[_COMMUNITY_Clipboard & Copy-Paste|Clipboard & Copy-Paste]]
- [[_COMMUNITY_Export Dialog & Presets|Export Dialog & Presets]]
- [[_COMMUNITY_Project Service|Project Service]]
- [[_COMMUNITY_Canvas Rulers & Guides|Canvas Rulers & Guides]]
- [[_COMMUNITY_Accessibility Audit|Accessibility Audit]]
- [[_COMMUNITY_Backend Database + Command Palette|Backend Database + Command Palette]]
- [[_COMMUNITY_Background Panel UI|Background Panel UI]]
- [[_COMMUNITY_Image Filters Panel|Image Filters Panel]]
- [[_COMMUNITY_Angular Starter Template (placeholder)|Angular Starter Template (placeholder)]]
- [[_COMMUNITY_Comments Overlay|Comments Overlay]]
- [[_COMMUNITY_Brand Kit|Brand Kit]]
- [[_COMMUNITY_Gradient Panel|Gradient Panel]]
- [[_COMMUNITY_AI Background + Design Services|AI Background + Design Services]]
- [[_COMMUNITY_Backend Requirements (Python deps)|Backend Requirements (Python deps)]]
- [[_COMMUNITY_Auth (Frontend)|Auth (Frontend)]]
- [[_COMMUNITY_Magic Write (AI text)|Magic Write (AI text)]]
- [[_COMMUNITY_Design Helper (palettes, font pairing)|Design Helper (palettes, font pairing)]]
- [[_COMMUNITY_Auth Interceptor & Presentation Mode|Auth Interceptor & Presentation Mode]]
- [[_COMMUNITY_History (undoredo)|History (undo/redo)]]
- [[_COMMUNITY_Theme Service|Theme Service]]
- [[_COMMUNITY_PWA Install Prompt|PWA Install Prompt]]
- [[_COMMUNITY_Collaboration Overlay|Collaboration Overlay]]
- [[_COMMUNITY_PWA Icons (large)|PWA Icons (large)]]
- [[_COMMUNITY_PWA Icons (small)|PWA Icons (small)]]
- [[_COMMUNITY_Backend Dev Server Entry|Backend Dev Server Entry]]
- [[_COMMUNITY_Vitest Test Setup|Vitest Test Setup]]
- [[_COMMUNITY_Global Type Declarations|Global Type Declarations]]
- [[_COMMUNITY_App Root Component|App Root Component]]
- [[_COMMUNITY_Shortcuts Dialog|Shortcuts Dialog]]

## God Nodes (most connected - your core abstractions)
1. `CanvasService` - 70 edges
2. `Editor` - 54 edges
3. `SidebarDrawerComponent` - 48 edges
4. `TextToolbarComponent` - 44 edges
5. `PropertyPanelComponent` - 42 edges
6. `Dashboard` - 33 edges
7. `get_db()` - 31 edges
8. `ApiService` - 28 edges
9. `ProjectService` - 24 edges
10. `ExportService` - 22 edges

## Surprising Connections (you probably didn't know these)
- `App Root Template (Angular placeholder)` --conceptually_related_to--> `Angular CLI`  [INFERRED]
  src/app/app.html → README.md
- `delete_project()` --calls--> `get_db()`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/project_routes.py → /home/ashulabs/workspace/pixels/pixelforge/backend/app/database.py
- `revoke_share_link()` --calls--> `get_db()`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/project_routes.py → /home/ashulabs/workspace/pixels/pixelforge/backend/app/database.py
- `update_brand_kit()` --calls--> `get_db()`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/brand_routes.py → /home/ashulabs/workspace/pixels/pixelforge/backend/app/database.py
- `delete_public_template()` --calls--> `get_db()`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/template_routes.py → /home/ashulabs/workspace/pixels/pixelforge/backend/app/database.py

## Hyperedges (group relationships)
- **Image Processing Backend Stack** — requirements_fastapi, requirements_rembg, requirements_pillow, requirements_onnxruntime [INFERRED 0.85]
- **Backend Authentication Stack** — requirements_passlib, requirements_bcrypt, requirements_pyjwt, requirements_pydantic [INFERRED 0.80]
- **Angular App Bootstrap + Splash Flow** — index_html_shell, index_html_app_root, index_html_splash_hide_script, app_html_placeholder [INFERRED 0.85]
- **PWA Icon Set (larger sizes: 512, 384, 192, 96)** — icon_512x512_pwa_icon, icon_384x384_pwa_icon, icon_192x192_pwa_icon, icon_96x96_pwa_icon [EXTRACTED 1.00]
- **PWA Icon Set (smaller sizes)** — icon_144x144_pwa_icon, icon_128x128_pwa_icon, icon_72x72_pwa_icon, icon_152x152_pwa_icon [EXTRACTED 1.00]

## Communities

### Community 0 - "Animation Engine"
Cohesion: 0.04
Nodes (5): AnimationService, AnimationTimeline, ColorPalettePanelComponent, PropertyPanelComponent, TextToolbarComponent

### Community 1 - "Backend Asset + Auth API"
Cohesion: 0.04
Nodes (81): delete_asset(), get_asset(), list_assets(), upload_asset(), AuthResponse, create_token(), decode_token(), get_current_user() (+73 more)

### Community 2 - "Alignment & Arrangement Tools"
Cohesion: 0.04
Nodes (5): AlignmentPanelComponent, CanvasService, KeyboardService, LayerPanelComponent, ResizeDialog

### Community 3 - "Background Removal"
Cohesion: 0.04
Nodes (4): BackgroundRemovalService, PluginRegistry, SidebarDrawerComponent, StyleVariationsService

### Community 4 - "Canvas Text & Export Ops"
Cohesion: 0.05
Nodes (2): Editor, ToolbarPanelComponent

### Community 5 - "API Service (Core HTTP)"
Cohesion: 0.05
Nodes (5): ApiService, CommentsService, FontService, ShareDialog, VersionsDialog

### Community 6 - "Dashboard & Project Management"
Cohesion: 0.07
Nodes (1): Dashboard

### Community 7 - "Clipboard & Copy-Paste"
Cohesion: 0.08
Nodes (3): ClipboardService, ContextMenuComponent, QuickActionBar

### Community 8 - "Export Dialog & Presets"
Cohesion: 0.12
Nodes (2): ExportDialog, ExportService

### Community 9 - "Project Service"
Cohesion: 0.11
Nodes (1): ProjectService

### Community 10 - "Canvas Rulers & Guides"
Cohesion: 0.1
Nodes (2): CanvasRulersComponent, CollaborationService

### Community 11 - "Accessibility Audit"
Cohesion: 0.12
Nodes (3): AccessibilityService, AuditDialog, QualityScoreService

### Community 12 - "Backend Database + Command Palette"
Cohesion: 0.12
Nodes (6): CommandPalette, close_db(), connect_db(), Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB, lifespan(), NewProjectDialog

### Community 13 - "Background Panel UI"
Cohesion: 0.15
Nodes (2): BackgroundPanelComponent, TemplateService

### Community 14 - "Image Filters Panel"
Cohesion: 0.15
Nodes (1): ImageFiltersPanelComponent

### Community 15 - "Angular Starter Template (placeholder)"
Cohesion: 0.1
Nodes (22): Angular Logo SVG, Angular @for control flow block, Pill link group (Angular docs links), App Root Template (Angular placeholder), router-outlet, title() signal binding, app-root mount point, Positioning: Free Canva alternative with AI tools (+14 more)

### Community 16 - "Comments Overlay"
Cohesion: 0.15
Nodes (1): CommentsOverlay

### Community 17 - "Brand Kit"
Cohesion: 0.21
Nodes (1): BrandKitService

### Community 18 - "Gradient Panel"
Cohesion: 0.2
Nodes (1): GradientPanelComponent

### Community 19 - "AI Background + Design Services"
Cohesion: 0.2
Nodes (2): AiBackgroundService, AiDesignService

### Community 20 - "Backend Requirements (Python deps)"
Cohesion: 0.24
Nodes (13): aiofiles 24.1.0, Pixelforge Backend (Python), bcrypt 4.2.1, FastAPI 0.115.12, motor 3.7.0 (async MongoDB), onnxruntime 1.21.1, passlib[bcrypt] 1.7.4, Pillow 11.2.1 (+5 more)

### Community 21 - "Auth (Frontend)"
Cohesion: 0.2
Nodes (2): AuthComponent, AuthService

### Community 22 - "Magic Write (AI text)"
Cohesion: 0.42
Nodes (1): MagicWriteService

### Community 23 - "Design Helper (palettes, font pairing)"
Cohesion: 0.27
Nodes (1): DesignHelperService

### Community 24 - "Auth Interceptor & Presentation Mode"
Cohesion: 0.22
Nodes (2): authInterceptor(), PresentationMode

### Community 25 - "History (undo/redo)"
Cohesion: 0.42
Nodes (1): HistoryService

### Community 26 - "Theme Service"
Cohesion: 0.29
Nodes (1): ThemeService

### Community 28 - "PWA Install Prompt"
Cohesion: 0.33
Nodes (1): PwaInstallPrompt

### Community 29 - "Collaboration Overlay"
Cohesion: 0.4
Nodes (1): CollabOverlay

### Community 30 - "PWA Icons (large)"
Cohesion: 0.8
Nodes (5): PWA Icon 192x192 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 384x384 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 96x96 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), Angular-style Shield 'A' Logo Symbol (Pink-Magenta-Purple Gradient, White Background)

### Community 31 - "PWA Icons (small)"
Cohesion: 1.0
Nodes (4): PWA Icon 128x128 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 144x144 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 152x152 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 72x72 - Stylized 'A' with pink-to-purple gradient on pentagonal shield

### Community 32 - "Backend Dev Server Entry"
Cohesion: 1.0
Nodes (1): Development server entry point.  Usage:     python run.py     # or     uvicorn a

### Community 33 - "Vitest Test Setup"
Cohesion: 1.0
Nodes (1): TestRootModule

### Community 34 - "Global Type Declarations"
Cohesion: 1.0
Nodes (1): GIF

### Community 35 - "App Root Component"
Cohesion: 1.0
Nodes (1): App

### Community 38 - "Shortcuts Dialog"
Cohesion: 1.0
Nodes (1): ShortcutsDialog

## Knowledge Gaps
- **29 isolated node(s):** `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB`, `Return the MongoDB database handle.      Raises a clear error if the DB is not c`, `Brand kit API: per-user saved colors, fonts, logos.`, `Public template gallery: community-shared templates anyone can clone.` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Canvas Text & Export Ops`** (60 nodes): `.publishTemplate()`, `.addText()`, `.clearCanvas()`, `.getCanvasJSON()`, `.getThumbnail()`, `.setZoom()`, `.openProject()`, `Editor`, `.addPage()`, `.addShape()`, `.addTextWithOptions()`, `.cancelNameEdit()`, `.dataURLToBlob()`, `.deletePage()`, `.deletePageAt()`, `.duplicateCurrentPage()`, `.duplicatePage()`, `.duplicatePageAt()`, `.fileNew()`, `.fitToScreen()`, `.formatTimer()`, `.goBack()`, `.handleSystemPaste()`, `.initPages()`, `.loadImageFile()`, `.ngAfterViewInit()`, `.onCanvasAreaMouseDown()`, `.onDragLeave()`, `.onDragOver()`, `.onDrop()`, `.onImageUpload()`, `.onKeyDown()`, `.onMouseWheel()`, `.openAuditDialog()`, `.openExportDialog()`, `.openResizeDialog()`, `.openShareDialog()`, `.openShortcutsDialog()`, `.openVersionsDialog()`, `.publishAsTemplate()`, `.redo()`, `.saveCurrentPageState()`, `.saveProject()`, `.setZoomPct()`, `.startNameEdit()`, `.startPresentation()`, `.switchToPage()`, `.togglePageLock()`, `.toggleTimer()`, `.triggerImageUpload()`, `.undo()`, `.updatePageNotes()`, `.zoomIn()`, `.zoomOut()`, `.preloadPopularFonts()`, `.getCanvasState()`, `toolbar-panel.ts`, `editor.ts`, `ToolbarPanelComponent`, `.applyTemplate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard & Project Management`** (35 nodes): `.createProject()`, `.getPublicTemplate()`, `.listPublicTemplates()`, `Dashboard`, `.clearTemplateFilters()`, `.constructor()`, `.createFromCategory()`, `.createFromPreset()`, `.createFromTemplate()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.filterByTag()`, `.formatDate()`, `.formatRelativeTime()`, `.generateAiDesign()`, `.getPresetIcon()`, `.goToLogin()`, `.goToTab()`, `.loadGallery()`, `.logout()`, `.onDragLeave()`, `.onDragOver()`, `.onDrop()`, `.onGalleryClick()`, `.onGallerySearch()`, `.onHomeUpload()`, `.openNewProjectDialog()`, `.restoreProject()`, `.setGalleryCategory()`, `.triggerHomeUpload()`, `.useGalleryTemplate()`, `.useSuggestion()`, `.fileMakeCopy()`, `dashboard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Export Dialog & Presets`** (33 nodes): `.applyFocalBlur()`, `.loadFromJSON()`, `.toDataURL()`, `ExportDialog`, `.applyPlatformPreset()`, `.close()`, `.doExport()`, `.setPagesData()`, `.toggleBatchSize()`, `ExportService`, `.dataURLToBlob()`, `.embedStandardFonts()`, `.exportAnimatedGIF()`, `.exportBatchSizes()`, `.exportImage()`, `.exportMultiPagePDF()`, `.exportPDF()`, `.exportSVG()`, `.exportTransparentPNG()`, `.exportVideo()`, `.exportWithBackground()`, `.parseColor()`, `.renderCircleToPdf()`, `.renderGenericToPdf()`, `.renderImageToPdf()`, `.renderLineToPdf()`, `.renderObjectToPdf()`, `.renderRectToPdf()`, `.renderTextToPdf()`, `.withIdentityViewport()`, `.withIdentityViewportAsync()`, `export.service.ts`, `export-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Project Service`** (30 nodes): `.getProject()`, `.healthCheck()`, `.listProjects()`, `.editTags()`, `.permanentDelete()`, `ProjectService`, `.addUploadedImage()`, `.checkBackend()`, `.constructor()`, `.createProject()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.getUploadedImages()`, `.loadProjects()`, `.loadUploads()`, `.mergeProjects()`, `.openProject()`, `.permanentlyDelete()`, `.persistProjects()`, `.persistUploads()`, `.purgeOldTrash()`, `.removeUploadedImage()`, `.restoreProject()`, `.saveCanvasState()`, `.setTags()`, `.syncFromBackend()`, `.updateProject()`, `.removeUpload()`, `project.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Canvas Rulers & Guides`** (26 nodes): `.restoreVersion()`, `CanvasRulersComponent`, `.drawHorizontalRuler()`, `.drawRulers()`, `.drawVerticalRuler()`, `.getGuideScreenPos()`, `.getStep()`, `.ngAfterViewInit()`, `.ngOnDestroy()`, `.onMouseMove()`, `.onMouseUp()`, `.removeGuide()`, `.startDragGuide()`, `.startMoveGuide()`, `.toggleRulers()`, `CollaborationService`, `.connect()`, `.disconnect()`, `.handleMessage()`, `.send()`, `.sendCanvasUpdate()`, `.sendCursor()`, `.setupCanvasListeners()`, `collaboration.service.ts`, `canvas-rulers.ts`, `.restore()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Background Panel UI`** (22 nodes): `BackgroundPanelComponent`, `.onCustomColor()`, `.onModeChange()`, `.setBackgroundMode()`, `.onBgModeChange()`, `.onCustomBgColor()`, `template.service.ts`, `background-panel.ts`, `TemplateService`, `.applyTemplate()`, `.createBadge()`, `.createBusinessCard()`, `.createFbCover()`, `.createIconText()`, `.createInstaPost()`, `.createMinimal()`, `.createMonogram()`, `.createPoster()`, `.createSaleBanner()`, `.createStacked()`, `.createWordmark()`, `.createYtThumb()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Image Filters Panel`** (22 nodes): `ImageFiltersPanelComponent`, `.applyFilters()`, `.applyFocalBlur()`, `.applyPreset()`, `.attachWhenReady()`, `.autoEnhance()`, `.ngOnDestroy()`, `.ngOnInit()`, `.onBlurChange()`, `.onBrightnessChange()`, `.onContrastChange()`, `.onHueRotationChange()`, `.onNoiseChange()`, `.onPixelateChange()`, `.onReplaceFile()`, `.onSaturationChange()`, `.resetFilters()`, `.toggleGrayscale()`, `.toggleInvert()`, `.toggleSepia()`, `.triggerReplace()`, `image-filters-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Comments Overlay`** (20 nodes): `.addReply()`, `CommentsOverlay`, `.cancelNewComment()`, `.closeMention()`, `.closeThread()`, `.deleteComment()`, `.formatMentions()`, `.knownUsers()`, `.ngOnDestroy()`, `.ngOnInit()`, `.onNewEnter()`, `.onReplyInput()`, `.onReplyKey()`, `.pickMention()`, `.screenX()`, `.screenY()`, `.submitNewComment()`, `.submitReply()`, `.toggleComment()`, `comments-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Brand Kit`** (18 nodes): `.getBrandKit()`, `BrandKitService`, `.addBrandColor()`, `.addBrandFont()`, `.addBrandLogo()`, `.constructor()`, `.fetchFromBackend()`, `.load()`, `.persist()`, `.persistAll()`, `.removeBrandColor()`, `.removeBrandFont()`, `.removeBrandLogo()`, `.scheduleSync()`, `.trackRecentFont()`, `.addBrandFontFromSelect()`, `.uploadCustomFont()`, `brand-kit.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Gradient Panel`** (16 nodes): `GradientPanelComponent`, `.addStop()`, `.applyGradient()`, `.applyPreset()`, `.applySolidColor()`, `.attachWhenReady()`, `.ngOnDestroy()`, `.ngOnInit()`, `.readFill()`, `.removeStop()`, `.setAngle()`, `.setFillType()`, `.startEyedropper()`, `.updateStopColor()`, `.updateStopOffset()`, `gradient-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AI Background + Design Services`** (15 nodes): `AiBackgroundService`, `.buildSvg()`, `.detectType()`, `.generate()`, `.generateAndApply()`, `.matchPalette()`, `AiDesignService`, `.generate()`, `.generateHeadline()`, `.generateSubheadline()`, `.parsePrompt()`, `.setBackgroundImage()`, `.setBgFit()`, `ai-background.service.ts`, `ai-design.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth (Frontend)`** (12 nodes): `AuthComponent`, `.continueAsGuest()`, `.submit()`, `AuthService`, `.constructor()`, `.loadFromStorage()`, `.login()`, `.logout()`, `.setAuth()`, `.signup()`, `auth.service.ts`, `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Magic Write (AI text)`** (11 nodes): `MagicWriteService`, `.applySwaps()`, `.generateVariants()`, `.makeLonger()`, `.makeShorter()`, `.removeFillers()`, `.sentenceCase()`, `.titleCase()`, `.toHeadline()`, `.transform()`, `magic-write.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Design Helper (palettes, font pairing)`** (11 nodes): `DesignHelperService`, `.extractColorsFromSelection()`, `.generatePalettesFrom()`, `.getFontPairings()`, `.hexToHsl()`, `.hslToHex()`, `.loadImage()`, `.rgbToHex()`, `.extractColors()`, `.generatePalettes()`, `design-helper.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Interceptor & Presentation Mode`** (10 nodes): `authInterceptor()`, `PresentationMode`, `.exit()`, `.next()`, `.ngOnDestroy()`, `.onBackdropClick()`, `.prev()`, `.start()`, `auth.interceptor.ts`, `presentation-mode.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `History (undo/redo)`** (9 nodes): `HistoryService`, `.clear()`, `.init()`, `.redo()`, `.restoreState()`, `.saveState()`, `.undo()`, `.updateCounts()`, `history.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Theme Service`** (7 nodes): `theme.service.ts`, `ThemeService`, `.applyTheme()`, `.constructor()`, `.loadTheme()`, `.setTheme()`, `.toggleTheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PWA Install Prompt`** (6 nodes): `PwaInstallPrompt`, `.dismiss()`, `.install()`, `.ngOnDestroy()`, `.ngOnInit()`, `pwa-install-prompt.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Collaboration Overlay`** (5 nodes): `CollabOverlay`, `.initial()`, `.screenX()`, `.screenY()`, `collab-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Dev Server Entry`** (2 nodes): `run.py`, `Development server entry point.  Usage:     python run.py     # or     uvicorn a`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Test Setup`** (2 nodes): `test-setup.ts`, `TestRootModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Global Type Declarations`** (2 nodes): `types.d.ts`, `GIF`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Root Component`** (2 nodes): `App`, `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Shortcuts Dialog`** (2 nodes): `ShortcutsDialog`, `shortcuts-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CanvasService` connect `Alignment & Arrangement Tools` to `Animation Engine`, `Background Removal`, `Canvas Text & Export Ops`, `Clipboard & Copy-Paste`, `Export Dialog & Presets`, `Accessibility Audit`, `Background Panel UI`, `AI Background + Design Services`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `get_db()` connect `Backend Asset + Auth API` to `Backend Database + Command Palette`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `ApiService` connect `API Service (Core HTTP)` to `Canvas Text & Export Ops`, `Dashboard & Project Management`, `Project Service`, `Canvas Rulers & Guides`, `Comments Overlay`, `Brand Kit`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB`, `Return the MongoDB database handle.      Raises a clear error if the DB is not c` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Animation Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Backend Asset + Auth API` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Alignment & Arrangement Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._