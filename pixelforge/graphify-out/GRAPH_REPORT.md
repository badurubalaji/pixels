# Graph Report - /home/ashulabs/workspace/pixels/pixelforge  (2026-04-24)

## Corpus Check
- 0 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1284 nodes · 2227 edges · 48 communities detected
- Extraction: 67% EXTRACTED · 33% INFERRED · 0% AMBIGUOUS · INFERRED: 725 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]

## God Nodes (most connected - your core abstractions)
1. `CanvasService` - 71 edges
2. `Editor` - 54 edges
3. `SidebarDrawerComponent` - 49 edges
4. `TextToolbarComponent` - 44 edges
5. `PropertyPanelComponent` - 42 edges
6. `Dashboard` - 33 edges
7. `get_db()` - 31 edges
8. `ApiService` - 28 edges
9. `Canvas` - 28 edges
10. `Canvas` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Angular CLI` --conceptually_related_to--> `App Root Template (Angular placeholder)`  [INFERRED]
  README.md → src/app/app.html
- `is_connected()` --calls--> `health_check()`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/database.py → /home/ashulabs/workspace/pixels/pixelforge/backend/app/routes.py
- `signup()` --calls--> `hash_password()`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/auth_routes.py → /home/ashulabs/workspace/pixels/pixelforge/backend/app/auth.py
- `login()` --calls--> `verify_password()`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/auth_routes.py → /home/ashulabs/workspace/pixels/pixelforge/backend/app/auth.py
- `Pixelforge Project` --rationale_for--> `Positioning: Free Canva alternative with AI tools`  [EXTRACTED]
  README.md → src/index.html

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (145): ApiService, delete_asset(), get_asset(), list_assets(), Asset upload / retrieval / deletion endpoints.  Assets are stored on-disk under, Upload an image asset, persist to disk, record metadata in Mongo.      Args:, # WHY: SVG uploads are XML and can smuggle XSS. Re-parse defensively., Stream an asset's bytes from disk.      Args:         asset_id: MongoDB ObjectId (+137 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (7): BackgroundPanelComponent, CanvasService, makeService(), Editor, Canvas, LayerPanelComponent, ResizeDialog

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (5): AnimationService, AnimationTimeline, ColorPalettePanelComponent, PropertyPanelComponent, TextToolbarComponent

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (18): ActiveSelection, Canvas, Circle, EventEmitter, FabricImage, FabricObject, FabricText, FakeImage (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (4): DesignHelperService, PluginRegistry, SidebarDrawerComponent, StyleVariationsService

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (32): ActiveSelection, bootstrap(), Circle, FabricImage, FabricObject, FabricText, Group, IText (+24 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (7): AiBackgroundService, AiDesignService, ConnectionManager, project_collab_socket(), Real-time collaboration via WebSocket.  Each project has a "room". Connected cli, Tracks active websocket connections per project room., MagicWriteService

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (1): Dashboard

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (3): CanvasRulersComponent, CollaborationService, VersionsDialog

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (3): ClipboardService, ContextMenuComponent, QuickActionBar

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (7): AuditDialog, CommandPalette, close_db(), connect_db(), Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB, lifespan(), NewProjectDialog

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (2): CommentsService, FontService

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (1): ProjectService

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (2): ExportDialog, ExportService

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (5): BrandKitService, decodeSvgDataUrl(), encodeSvgToDataUrl(), isSvgDataUrl(), sanitizeSvg()

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (1): ImageFiltersPanelComponent

### Community 16 - "Community 16"
Cohesion: 0.1
Nodes (22): Angular Logo SVG, Angular @for control flow block, Pill link group (Angular docs links), App Root Template (Angular placeholder), router-outlet, title() signal binding, app-root mount point, Positioning: Free Canva alternative with AI tools (+14 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (21): Happy-path coverage for project_routes endpoints after the Depends refactor.  On, GET /api/projects/shared/{token} returns the project via share token., POST /api/projects creates a project with anonymous owner., GET /api/projects returns previously created anonymous projects., GET /api/projects/{id} returns detail view., PUT /api/projects/{id} updates name., DELETE /api/projects/{id} removes the project., GET /api/projects/{id}/versions returns empty list for new project. (+13 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (1): CommentsOverlay

### Community 19 - "Community 19"
Cohesion: 0.1
Nodes (19): Happy-path coverage for asset_routes endpoints after the Depends refactor.  Exte, PX-003 AC-7: SVG with relative-fragment href (#id) passes validation., PX-003 AC-7: SVG with on* attributes is rejected., GET /api/assets returns [] when none uploaded., PX-003 AC-7: malformed XML is rejected before any other processing., POST /api/assets/upload then DELETE /api/assets/{id} round-trip., PX-003 AC-6: a clean, well-formed SVG uploads successfully., PX-003 AC-7: <script> in uploaded SVG is rejected (400). (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (3): HistoryService, getPlatformPreset(), ToolbarPanelComponent

### Community 21 - "Community 21"
Cohesion: 0.2
Nodes (1): GradientPanelComponent

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (2): AccessibilityService, QualityScoreService

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (1): TemplateService

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (2): Canvas, FabricObject

### Community 25 - "Community 25"
Cohesion: 0.24
Nodes (13): aiofiles 24.1.0, Pixelforge Backend (Python), bcrypt 4.2.1, FastAPI 0.115.12, motor 3.7.0 (async MongoDB), onnxruntime 1.21.1, passlib[bcrypt] 1.7.4, Pillow 11.2.1 (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (12): Happy-path coverage for comments_routes endpoints after the Depends refactor., POST a comment then GET surfaces it by projectId + text., # NOTE: list_comments re-derives ``id`` from ``_id`` when Mongo auto-assigns, PATCH toggles resolved flag., DELETE removes the comment., POST /{id}/replies appends a reply., GET /api/projects/{pid}/comments returns [] when none exist., test_add_reply() (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.2
Nodes (2): AuthComponent, AuthService

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (11): auth_headers(), auth_token(), auth_user(), client(), mock_db(), Pytest fixtures for the pixelforge backend test harness.  This module wires an `, Return a bearer JWT for the seeded test user.      Returns:         Encoded JWT, Return an Authorization header dict for authenticated requests.      Returns: (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (2): authInterceptor(), PresentationMode

### Community 30 - "Community 30"
Cohesion: 0.36
Nodes (1): BackgroundRemovalService

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (1): HubComponent

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (1): AlignmentPanelComponent

### Community 33 - "Community 33"
Cohesion: 0.36
Nodes (1): OnboardingTour

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (7): Happy-path coverage for auth_routes endpoints after the Depends refactor., POST /api/auth/login returns a token for a previously-created user., GET /api/auth/me echoes the token's user., POST /api/auth/signup creates user and returns a token., test_login_with_valid_credentials(), test_me_returns_current_user(), test_signup_returns_token()

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (1): ThemeService

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (1): PwaInstallPrompt

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (5): get_platform_preset(), PlatformPreset, Canonical platform-size presets (backend source of truth).  This module mirrors, Look up a platform preset by id.      Args:         preset_id: The preset id to, One platform-size preset record.      Attributes:         id: Stable identifier

### Community 39 - "Community 39"
Cohesion: 0.4
Nodes (1): CollabOverlay

### Community 40 - "Community 40"
Cohesion: 0.8
Nodes (5): PWA Icon 192x192 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 384x384 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 96x96 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), Angular-style Shield 'A' Logo Symbol (Pink-Magenta-Purple Gradient, White Background)

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (1): KeyboardService

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (4): PWA Icon 128x128 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 144x144 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 152x152 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 72x72 - Stylized 'A' with pink-to-purple gradient on pentagonal shield

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): Development server entry point.  Usage:     python run.py     # or     uvicorn a

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (1): TestRootModule

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): GIF

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): App

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): ShortcutsDialog

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): Core backend primitives (config, shared constants, security helpers).  Currently

## Knowledge Gaps
- **151 isolated node(s):** `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB`, `Return the MongoDB database handle.      Raises a clear error if the DB is not c`, `Brand kit API: per-user saved colors, fonts, and logos.`, `Public template gallery: community-shared templates anyone can clone.` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 7`** (34 nodes): `.createProject()`, `Dashboard`, `.clearTemplateFilters()`, `.constructor()`, `.createFromCategory()`, `.createFromPreset()`, `.createFromTemplate()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.filterByTag()`, `.formatDate()`, `.formatRelativeTime()`, `.generateAiDesign()`, `.getPresetIcon()`, `.goToLogin()`, `.goToTab()`, `.loadGallery()`, `.logout()`, `.onDragLeave()`, `.onDragOver()`, `.onDrop()`, `.onGalleryClick()`, `.onGallerySearch()`, `.onHomeUpload()`, `.openNewProjectDialog()`, `.permanentDelete()`, `.restoreProject()`, `.setGalleryCategory()`, `.triggerHomeUpload()`, `.useGalleryTemplate()`, `.useSuggestion()`, `.fileMakeCopy()`, `dashboard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (26 nodes): `.createComment()`, `.deleteCommentRemote()`, `.updateComment()`, `CommentsService`, `.addComment()`, `.addReply()`, `.constructor()`, `.deleteComment()`, `.load()`, `.persist()`, `.setActiveProject()`, `.setCommentMode()`, `.toggleCommentMode()`, `.toggleResolved()`, `FontService`, `.constructor()`, `.fileToDataUrl()`, `.getAllFontFamilies()`, `.getGoogleFonts()`, `.loadCustomFonts()`, `.persistCustomFonts()`, `.registerFont()`, `.removeCustomFont()`, `.uploadCustomFont()`, `comments.service.ts`, `font.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (25 nodes): `ProjectService`, `.addUploadedImage()`, `.checkBackend()`, `.constructor()`, `.createProject()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.getUploadedImages()`, `.loadProjects()`, `.loadUploads()`, `.mergeProjects()`, `.openProject()`, `.permanentlyDelete()`, `.persistProjects()`, `.persistUploads()`, `.purgeOldTrash()`, `.removeUploadedImage()`, `.restoreProject()`, `.saveCanvasState()`, `.setTags()`, `.syncFromBackend()`, `.updateProject()`, `.removeUpload()`, `project.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (25 nodes): `ExportDialog`, `.applyPlatformPreset()`, `.close()`, `.doExport()`, `.setPagesData()`, `.toggleBatchSize()`, `ExportService`, `.dataURLToBlob()`, `.embedStandardFonts()`, `.exportImage()`, `.exportMultiPagePDF()`, `.exportPDF()`, `.exportSVG()`, `.exportTransparentPNG()`, `.exportVideo()`, `.exportWithBackground()`, `.parseColor()`, `.renderCircleToPdf()`, `.renderImageToPdf()`, `.renderLineToPdf()`, `.renderObjectToPdf()`, `.renderRectToPdf()`, `.renderTextToPdf()`, `export.service.ts`, `export-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (22 nodes): `ImageFiltersPanelComponent`, `.applyFilters()`, `.applyFocalBlur()`, `.applyPreset()`, `.attachWhenReady()`, `.autoEnhance()`, `.ngOnDestroy()`, `.ngOnInit()`, `.onBlurChange()`, `.onBrightnessChange()`, `.onContrastChange()`, `.onHueRotationChange()`, `.onNoiseChange()`, `.onPixelateChange()`, `.onReplaceFile()`, `.onSaturationChange()`, `.resetFilters()`, `.toggleGrayscale()`, `.toggleInvert()`, `.toggleSepia()`, `.triggerReplace()`, `image-filters-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (20 nodes): `.addReply()`, `CommentsOverlay`, `.cancelNewComment()`, `.closeMention()`, `.closeThread()`, `.deleteComment()`, `.formatMentions()`, `.knownUsers()`, `.ngOnDestroy()`, `.ngOnInit()`, `.onNewEnter()`, `.onReplyInput()`, `.onReplyKey()`, `.pickMention()`, `.screenX()`, `.screenY()`, `.submitNewComment()`, `.submitReply()`, `.toggleComment()`, `comments-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (16 nodes): `GradientPanelComponent`, `.addStop()`, `.applyGradient()`, `.applyPreset()`, `.applySolidColor()`, `.attachWhenReady()`, `.ngOnDestroy()`, `.ngOnInit()`, `.readFill()`, `.removeStop()`, `.setAngle()`, `.setFillType()`, `.startEyedropper()`, `.updateStopColor()`, `.updateStopOffset()`, `gradient-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (16 nodes): `AccessibilityService`, `.audit()`, `.contrastRatio()`, `.getEffectiveBackground()`, `.hexToRgb()`, `.relativeLuminance()`, `QualityScoreService`, `.calculate()`, `.evaluateAlignment()`, `.evaluateColorHarmony()`, `.evaluateContrast()`, `.evaluateFontVariety()`, `.evaluateWhiteSpace()`, `.scoreToGrade()`, `accessibility.service.ts`, `quality-score.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (15 nodes): `template.service.ts`, `TemplateService`, `.applyTemplate()`, `.createBadge()`, `.createBusinessCard()`, `.createFbCover()`, `.createIconText()`, `.createInstaPost()`, `.createMinimal()`, `.createMonogram()`, `.createPoster()`, `.createSaleBanner()`, `.createStacked()`, `.createWordmark()`, `.createYtThumb()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (15 nodes): `Canvas`, `.dispose()`, `.getObjects()`, `.getZoom()`, `.off()`, `.on()`, `.renderAll()`, `.requestRenderAll()`, `.setDimensions()`, `.setViewportTransform()`, `.setZoom()`, `constructor()`, `FabricObject`, `getObjects()`, `export.service.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (12 nodes): `AuthComponent`, `.continueAsGuest()`, `.submit()`, `AuthService`, `.constructor()`, `.loadFromStorage()`, `.login()`, `.logout()`, `.setAuth()`, `.signup()`, `auth.service.ts`, `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (10 nodes): `authInterceptor()`, `PresentationMode`, `.exit()`, `.next()`, `.ngOnDestroy()`, `.onBackdropClick()`, `.prev()`, `.start()`, `auth.interceptor.ts`, `presentation-mode.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (9 nodes): `BackgroundRemovalService`, `.dataURLToBlob()`, `.removeBackground()`, `.removeClientSide()`, `.removeFromDataURL()`, `.removeServerSide()`, `.reset()`, `.triggerBgRemoveUpload()`, `background-removal.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (9 nodes): `HubComponent`, `.buildTiles()`, `.ngOnInit()`, `.onProjectActivate()`, `.onStartFromScratch()`, `.onTileActivate()`, `.trackProjectById()`, `.trackTileById()`, `hub.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (8 nodes): `AlignmentPanelComponent`, `.align()`, `.attachWhenReady()`, `.autoArrange()`, `.constructor()`, `.distribute()`, `.fixOverlaps()`, `alignment-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (8 nodes): `OnboardingTour`, `.finish()`, `.next()`, `.ngOnInit()`, `.prev()`, `.start()`, `.updateHighlight()`, `onboarding-tour.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (7 nodes): `theme.service.ts`, `ThemeService`, `.applyTheme()`, `.constructor()`, `.loadTheme()`, `.setTheme()`, `.toggleTheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (6 nodes): `PwaInstallPrompt`, `.dismiss()`, `.install()`, `.ngOnDestroy()`, `.ngOnInit()`, `pwa-install-prompt.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (5 nodes): `CollabOverlay`, `.initial()`, `.screenX()`, `.screenY()`, `collab-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (4 nodes): `KeyboardService`, `.destroy()`, `.init()`, `keyboard.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `run.py`, `Development server entry point.  Usage:     python run.py     # or     uvicorn a`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `test-setup.ts`, `TestRootModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `types.d.ts`, `GIF`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `App`, `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `ShortcutsDialog`, `shortcuts-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `__init__.py`, `Core backend primitives (config, shared constants, security helpers).  Currently`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CanvasService` connect `Community 1` to `Community 2`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `makeService()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `SidebarDrawerComponent` connect `Community 4` to `Community 1`, `Community 6`, `Community 12`, `Community 14`, `Community 20`, `Community 30`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB`, `Return the MongoDB database handle.      Raises a clear error if the DB is not c` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._